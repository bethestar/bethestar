#!/usr/bin/env node
// 국세청 기본통칙 PDF(data/tax-rules/*.pdf) → 택스허브용 JSON(src/data/tax-rules/*.json) 변환.
//
// 사용법:  node scripts/build-tax-rules.mjs
// 필요:    pdftotext (poppler-utils). Windows 에서는 별도 설치가 필요하다.
//
// PDF 는 국세법령정보시스템에서 내려받은 "OO법 2024년 기본통칙" 형식을 기준으로 한다.
// 구조: "제1장 【 총칙(…) 】" 같은 장·절 제목, "2-0…1 【 제목 】" 통칙 머리말, 본문, "<개정 …>" 이력.

import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join, basename } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const IN_DIR = join(ROOT, "data/tax-rules");
const OUT_DIR = join(ROOT, "src/data/tax-rules");

/** PDF 첫 줄의 법령명 → 메뉴 id (menuData.ts 의 taxLaws). 메뉴에 없는 세법은 별도 id. */
const LAW_IDS = {
  법인세법: "corporate-tax",
  소득세법: "income-tax",
  부가가치세법: "vat",
  조세특례제한법: "tax-incentive",
  "상속세 및 증여세법": "inheritance-gift-tax",
  상속세및증여세법: "inheritance-gift-tax",
  종합부동산세법: "comprehensive-real-estate-tax",
  국세기본법: "national-tax-basic",
  "국제조세조정에 관한 법률": "international-tax",
  개별소비세법: "individual-consumption-tax",
};

const HEADING_RE = /^제\s*(\d+(?:의\d+)?)\s*(편|장|절|관)\s*【\s*(.+?)\s*】\s*$/;
// 제목은 "】" 앞까지 (】 가 없으면 다음 줄로 이어진 제목)
const RULE_RE = /^(\d+(?:의\d+)?)-(\d+(?:의\d+)?)…(\d+(?:의\d+)?)\s*【\s*([^】]*?)\s*(?:(】)\s*(.*))?$/;
// 새 문단으로 시작하는 줄: ①, 1., 가., (1), (가), ※, 표 테두리
const PARA_START_RE = /^([①-⑳]|\d+(?:의\d+)?\.\s|\d+\)\s|[가-힣]\.\s|\(\d+\)|\([가-힣]\)|※|[│┌└├─┃━])/;
const TABLE_RE = /[│┌┐└┘├┤┬┴┼─┃━]/;

function pdfToLines(file) {
  const text = execFileSync("pdftotext", ["-layout", "-enc", "UTF-8", file, "-"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return text
    .replace(/\f/g, "\n")
    .split("\n")
    .map((l) => l.replace(/[ \t 　]+/g, " ").trim())
    .filter(Boolean);
}

function anchorOf(no) {
  return "r" + no.replace(/…/g, "-").replace(/의/g, "_");
}

/** 법 조문 앵커 (LawText 의 a{번호}-{가지}). "2의2" → "a2-2" */
function lawAnchorOf(article) {
  const [n, b] = article.split("의");
  return `a${n}${b ? `-${b}` : ""}`;
}

function parse(lines, file) {
  const header = lines[0].match(/^(.+?)\s+(\d{4})년\s*기본통칙$/);
  if (!header) throw new Error(`${file}: 첫 줄에서 법령명을 찾지 못했습니다: ${lines[0]}`);
  const lawName = header[1].trim();
  const year = Number(header[2]);

  const items = [];
  let rule = null;
  let para = null;

  const flushPara = () => {
    if (rule && para) rule.paragraphs.push(para.trim());
    para = null;
  };
  const flushRule = () => {
    flushPara();
    if (rule) items.push(rule);
    rule = null;
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    const h = line.match(HEADING_RE);
    if (h) {
      flushRule();
      items.push({ kind: "heading", level: { 편: 0, 장: 1, 절: 2, 관: 3 }[h[2]], text: `제${h[1]}${h[2]} ${h[3]}` });
      continue;
    }

    const r = line.match(RULE_RE);
    if (r) {
      flushRule();
      let title = r[4];
      let rest = r[6] ?? "";
      // 제목이 다음 줄로 넘어간 경우 "】" 이 나올 때까지 이어 붙인다.
      if (!r[5]) {
        while (i + 1 < lines.length && !lines[i + 1].includes("】")) title += " " + lines[++i];
        if (i + 1 < lines.length) {
          const [t, ...after] = lines[++i].split("】");
          title += " " + t;
          rest = after.join("】").trim();
        }
      }
      const no = `${r[1]}-${r[2]}…${r[3]}`;
      rule = {
        kind: "rule",
        no,
        anchor: anchorOf(no),
        lawArticle: r[1],
        lawAnchor: lawAnchorOf(r[1]),
        title: title.replace(/\s+/g, " ").trim(),
        paragraphs: [],
      };
      if (rest) para = rest;
      continue;
    }

    if (!rule) continue; // 첫 통칙 전의 잡문

    const isTable = TABLE_RE.test(line);
    if (!para || isTable || PARA_START_RE.test(line) || (para && TABLE_RE.test(para))) {
      flushPara();
      para = line;
    } else {
      // PDF 줄바꿈은 대부분 낱말 경계에서 일어나므로 공백으로 잇는다.
      para += " " + line;
    }
  }
  flushRule();

  // 같은 번호가 두 번 나오면 (PDF 의 중복 머리말) 내용이 더 긴 쪽을 남긴다.
  const seen = new Map();
  const deduped = [];
  for (const it of items) {
    if (it.kind !== "rule") {
      deduped.push(it);
      continue;
    }
    const prev = seen.get(it.no);
    const size = (x) => x.paragraphs.join("").length + x.title.length;
    if (!prev) {
      seen.set(it.no, it);
      deduped.push(it);
    } else if (size(it) > size(prev)) {
      deduped[deduped.indexOf(prev)] = it;
      seen.set(it.no, it);
    }
  }

  for (const it of deduped) {
    if (it.kind !== "rule") continue;
    const body = it.paragraphs.join(" ");
    it.deleted = /삭제/.test(body) && body.replace(/<[^>]*>|\([^)]*\)|삭제|조문번호이동으로|[\s.,\d]/g, "").length < 4;
  }

  return { lawName, year, items: deduped };
}

mkdirSync(OUT_DIR, { recursive: true });
const index = [];
for (const f of readdirSync(IN_DIR).filter((n) => n.toLowerCase().endsWith(".pdf")).sort()) {
  const lines = pdfToLines(join(IN_DIR, f));
  const doc = parse(lines, f);
  const id = LAW_IDS[doc.lawName] ?? LAW_IDS[doc.lawName.replace(/\s+/g, "")];
  if (!id) {
    console.warn(`건너뜀: ${f} — 법령명 "${doc.lawName}"의 id 가 없습니다. LAW_IDS 에 추가하세요.`);
    continue;
  }
  const rules = doc.items.filter((x) => x.kind === "rule");
  const out = {
    id,
    lawName: doc.lawName,
    title: `${doc.lawName} ${doc.year}년 기본통칙`,
    year: doc.year,
    sourceFile: basename(f),
    source: "국세청 국세법령정보시스템 (PDF)",
    ruleCount: rules.length,
    items: doc.items,
  };
  writeFileSync(join(OUT_DIR, `${id}.json`), JSON.stringify(out) + "\n");
  index.push({ id, lawName: doc.lawName, year: doc.year, ruleCount: rules.length });
  console.log(`${f} → ${id}.json  (${doc.lawName} ${doc.year}년, 통칙 ${rules.length}개, 삭제 ${rules.filter((r) => r.deleted).length}개)`);
}
writeFileSync(join(OUT_DIR, "index.json"), JSON.stringify(index, null, 2) + "\n");
