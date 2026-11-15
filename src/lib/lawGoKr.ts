import "server-only";

// 국가법령정보센터 Open API (법제처) — https://open.law.go.kr
// 인증값 OC 는 서버 환경변수 LAW_GO_KR_OC 에서만 읽고, 화면·링크에 노출하지 않는다.
//
// 2026-11 실제 호출로 확인한 내용:
// - 법령 본문: /DRF/lawService.do?target=law&type=JSON&ID=<법령ID> → { 법령: { 기본정보, 조문: { 조문단위[] }, 별표: { 별표단위[] }, ... } }
// - 조문단위.조문여부: "전문"(편·장·절 제목) | "조문". 항·호·목은 객체 하나 또는 배열로 온다.
// - 응답이 최대 5MB 정도라 Next.js 데이터 캐시(2MB 제한)에 넣지 않고, 필요한 부분만 추려 서버 메모리에 하루 동안 캐시한다.
// - 판례 목록: /DRF/lawSearch.do?target=prec, 상세: /DRF/lawService.do?target=prec (대법원 출처만 JSON 상세가 온다).
// - 기본통칙·집행기준은 이 API(행정규칙 포함)에서 찾을 수 없었다.
// - law.go.kr 은 해외 IP 에서 간헐적으로 연결이 끊겨 재시도한다.

const BASE = "https://www.law.go.kr";
const DAY = 24 * 60 * 60 * 1000;

export type LawLevel = "law" | "decree" | "rule";

/** 메뉴의 세목 id → 법령ID (lawSearch 로 확인한 현행 법령). */
/** 판례 검색어: 법령명 전체보다 세목명이 대법원 판례(사건명 "법인세등부과처분취소" 등)까지 잘 잡는다 (실호출 비교). */
export const CASE_QUERY: Record<string, string> = {
  "corporate-tax": "법인세",
  "income-tax": "소득세",
  "vat": "부가가치세",
  "tax-incentive": "조세특례제한법",
  "inheritance-gift-tax": "상속세",
  "comprehensive-real-estate-tax": "종합부동산세",
  "local-tax": "지방세",
  "national-tax-basic": "국세기본법",
  "international-tax": "국제조세",
};

export const TAX_LAW_IDS: Record<string, Record<LawLevel, { id: string; name: string }>> = {
  "corporate-tax": {
    law: { id: "001563", name: "법인세법" },
    decree: { id: "003608", name: "법인세법 시행령" },
    rule: { id: "007229", name: "법인세법 시행규칙" },
  },
  "income-tax": {
    law: { id: "001565", name: "소득세법" },
    decree: { id: "003956", name: "소득세법 시행령" },
    rule: { id: "007507", name: "소득세법 시행규칙" },
  },
  vat: {
    law: { id: "001571", name: "부가가치세법" },
    decree: { id: "003666", name: "부가가치세법 시행령" },
    rule: { id: "007289", name: "부가가치세법 시행규칙" },
  },
  "tax-incentive": {
    law: { id: "001584", name: "조세특례제한법" },
    decree: { id: "004920", name: "조세특례제한법 시행령" },
    rule: { id: "008218", name: "조세특례제한법 시행규칙" },
  },
  "inheritance-gift-tax": {
    law: { id: "001561", name: "상속세 및 증여세법" },
    decree: { id: "003814", name: "상속세 및 증여세법 시행령" },
    rule: { id: "007388", name: "상속세 및 증여세법 시행규칙" },
  },
  "comprehensive-real-estate-tax": {
    law: { id: "009873", name: "종합부동산세법" },
    decree: { id: "009968", name: "종합부동산세법 시행령" },
    rule: { id: "009967", name: "종합부동산세법 시행규칙" },
  },
  "local-tax": {
    law: { id: "001649", name: "지방세법" },
    decree: { id: "005077", name: "지방세법 시행령" },
    rule: { id: "008334", name: "지방세법 시행규칙" },
  },
  "national-tax-basic": {
    law: { id: "001586", name: "국세기본법" },
    decree: { id: "002884", name: "국세기본법 시행령" },
    rule: { id: "006741", name: "국세기본법 시행규칙" },
  },
  "international-tax": {
    law: { id: "000603", name: "국제조세조정에 관한 법률" },
    decree: { id: "002942", name: "국제조세조정에 관한 법률 시행령" },
    rule: { id: "006780", name: "국제조세조정에 관한 법률 시행규칙" },
  },
};

export class LawApiError extends Error {}

export function lawApiConfigured(): boolean {
  return Boolean(process.env.LAW_GO_KR_OC?.trim());
}

// ───────────────────────── HTTP ─────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function drf(path: "lawService.do" | "lawSearch.do", params: Record<string, string | number>): Promise<unknown> {
  const oc = process.env.LAW_GO_KR_OC?.trim();
  if (!oc) throw new LawApiError("LAW_GO_KR_OC 환경변수가 설정되지 않았습니다.");
  const qs = new URLSearchParams({ OC: oc, type: "JSON" });
  for (const [k, v] of Object.entries(params)) qs.set(k, String(v));
  const url = `${BASE}/DRF/${path}?${qs}`;

  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 60_000);
    try {
      // 응답이 커서(최대 ~5MB) Next 데이터 캐시에 넣지 않는다. 대신 아래 메모리 캐시를 쓴다.
      const res = await fetch(url, { cache: "no-store", redirect: "manual", signal: ac.signal });
      const text = await res.text();
      if (!res.ok) throw new LawApiError(`국가법령정보센터 응답 오류 (HTTP ${res.status})`);
      try {
        return JSON.parse(text);
      } catch {
        // 인증 실패 등은 HTML/XML 로 온다. 원문에는 OC 가 섞일 수 있어 그대로 노출하지 않는다.
        throw new LawApiError("국가법령정보센터 응답을 해석하지 못했습니다. OC 값과 API 신청 상태를 확인하세요.");
      }
    } catch (err) {
      lastErr = err;
      if (err instanceof LawApiError) throw err;
      await sleep(800 * (attempt + 1));
    } finally {
      clearTimeout(timer);
    }
  }
  throw new LawApiError(`국가법령정보센터에 연결하지 못했습니다${lastErr instanceof Error && lastErr.name === "AbortError" ? " (시간 초과)" : ""}.`);
}

/** 같은 키는 TTL 동안 한 번만 가져온다 (동시 요청도 하나로 합침). 실패하면 캐시하지 않는다. */
const memo = new Map<string, { at: number; value: Promise<unknown> }>();
function cached<T>(key: string, ttl: number, load: () => Promise<T>): Promise<T> {
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.value as Promise<T>;
  const value = load();
  memo.set(key, { at: Date.now(), value });
  value.catch(() => memo.delete(key));
  if (memo.size > 200) memo.delete(memo.keys().next().value as string);
  return value;
}

// ───────────────────────── 텍스트 정리 ─────────────────────────

function asArray<T>(v: T | T[] | null | undefined): T[] {
  if (v === null || v === undefined || v === "") return [];
  return Array.isArray(v) ? v : [v];
}

const ENTITIES: Record<string, string> = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

/** 문자열·중첩 배열을 하나의 텍스트로. <br> 은 줄바꿈, 다른 태그는 제거, 엔티티 해석. */
export function lawText(v: unknown): string {
  const raw = Array.isArray(v) ? (v as unknown[]).flat(Infinity).map(String).join("\n") : String(v ?? "");
  return raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?[A-Za-z][^>]*>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] === "#") {
        const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m;
      }
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .split("\n")
    .map((l) => l.replace(/[ \t　]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

// ───────────────────────── 법령 본문 ─────────────────────────

export interface LawHeading {
  kind: "heading";
  key: string;
  level: number; // 0 편, 1 장, 2 절, 3 관
  text: string;
}

export interface LawLine {
  depth: number; // 0 조문/항, 1 호, 2 목
  text: string;
}

export interface LawArticle {
  kind: "article";
  key: string;
  anchor: string; // a2, a2-2
  label: string; // 제2조의2
  title: string;
  lines: LawLine[];
  note: string; // [본조신설 …] 등
  deleted: boolean;
}

export interface LawAppendix {
  type: "별표" | "서식";
  key: string;
  label: string; // [별표 1], [별지 제3호의2서식]
  title: string;
  pdfUrl: string;
  fileUrl: string; // HWP 등 원본 파일
  source: string; // 어느 법령(법/시행령/시행규칙)에 속하는지
}

export interface LawDocument {
  id: string;
  name: string;
  kind: string; // 법률 / 대통령령 / 총리령·부령
  ministry: string;
  promulgatedAt: string; // YYYY-MM-DD
  promulgationNo: string;
  effectiveAt: string;
  amendType: string;
  items: (LawHeading | LawArticle)[];
  appendices: LawAppendix[];
  sourceUrl: string; // 국가법령정보센터 공개 페이지
}

function ymd(s: unknown): string {
  const m = String(s ?? "").match(/^(\d{4})(\d{2})(\d{2})$/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : String(s ?? "");
}

type Raw = Record<string, unknown>;

function contentOf(v: unknown): string {
  if (v && typeof v === "object" && !Array.isArray(v) && "content" in (v as Raw)) return String((v as Raw).content ?? "");
  return String(v ?? "");
}

function headingLevel(text: string): number {
  const m = text.match(/^제\s*\d+(?:의\d+)?\s*(편|장|절|관)/);
  return m ? { 편: 0, 장: 1, 절: 2, 관: 3 }[m[1] as "편" | "장" | "절" | "관"] : 1;
}

function parseArticle(u: Raw): LawArticle {
  const no = String(u["조문번호"] ?? "");
  const branch = String(u["조문가지번호"] ?? "").replace(/^0+/, "");
  const label = `제${no}조${branch ? `의${branch}` : ""}`;
  const lines: LawLine[] = [];
  const head = lawText(u["조문내용"]);
  if (head) lines.push({ depth: 0, text: head });
  for (const hang of asArray(u["항"] as Raw | Raw[])) {
    const t = lawText(hang["항내용"]);
    if (t) lines.push({ depth: 0, text: t });
    for (const ho of asArray(hang["호"] as Raw | Raw[])) {
      const ht = lawText(ho["호내용"]);
      if (ht) lines.push({ depth: 1, text: ht });
      for (const mok of asArray(ho["목"] as Raw | Raw[])) {
        const mt = lawText(mok["목내용"]);
        if (mt) lines.push({ depth: 2, text: mt });
      }
    }
  }
  return {
    kind: "article",
    key: String(u["조문키"] ?? label),
    anchor: `a${no}${branch ? `-${branch}` : ""}`,
    label,
    title: lawText(u["조문제목"]),
    lines,
    note: lawText(u["조문참고자료"]),
    deleted: /^제\d+조(?:의\d+)?\s*삭제/.test(head),
  };
}

function firstLink(v: unknown): string {
  const s = Array.isArray(v) ? String(v[0] ?? "") : String(v ?? "");
  // 여러 개일 때 "['/LSW/…', '/LSW/…']" 문자열로 오는 경우가 있다.
  const m = s.match(/\/LSW\/[^'",\]\s]+/);
  return m ? `${BASE}${m[0]}` : "";
}

function parseAppendix(b: Raw, source: string): LawAppendix {
  const type = String(b["별표구분"]) === "서식" ? "서식" : "별표";
  const no = String(parseInt(String(b["별표번호"] ?? "0"), 10) || "");
  const branch = String(parseInt(String(b["별표가지번호"] ?? "0"), 10) || "");
  const label = type === "별표" ? `[별표 ${no}${branch ? `의${branch}` : ""}]` : `[별지 제${no}호${branch ? `의${branch}` : ""}서식]`;
  return {
    type,
    key: `${source}-${String(b["별표키"] ?? label)}`,
    label,
    title: lawText(b["별표제목"]),
    pdfUrl: firstLink(b["별표서식PDF파일링크"]),
    fileUrl: firstLink(b["별표서식파일링크"]),
    source,
  };
}

export function parseLawDocument(json: unknown, fallbackId: string): LawDocument {
  const root = (json as Raw)?.["법령"] as Raw | undefined;
  if (!root) {
    const msg = typeof (json as Raw)?.["Law"] === "string" ? String((json as Raw)["Law"]) : "";
    throw new LawApiError(`법령 본문을 찾지 못했습니다${msg ? `: ${msg}` : ""}.`);
  }
  const info = (root["기본정보"] ?? {}) as Raw;
  const name = String(info["법령명_한글"] ?? "");
  const items: (LawHeading | LawArticle)[] = [];
  for (const u of asArray((root["조문"] as Raw | undefined)?.["조문단위"] as Raw | Raw[])) {
    if (u["조문여부"] === "전문") {
      const text = lawText(u["조문내용"]);
      if (text) items.push({ kind: "heading", key: String(u["조문키"] ?? text), level: headingLevel(text), text });
    } else {
      items.push(parseArticle(u));
    }
  }
  const appendices = asArray((root["별표"] as Raw | undefined)?.["별표단위"] as Raw | Raw[]).map((b) => parseAppendix(b, name));
  return {
    id: String(info["법령ID"] ?? fallbackId),
    name,
    kind: contentOf(info["법종구분"]),
    ministry: contentOf(info["소관부처"]),
    promulgatedAt: ymd(info["공포일자"]),
    promulgationNo: String(info["공포번호"] ?? ""),
    effectiveAt: ymd(info["시행일자"]),
    amendType: String(info["제개정구분"] ?? ""),
    items,
    appendices,
    sourceUrl: `${BASE}/법령/${encodeURIComponent(name)}`,
  };
}

/** 현행 법령 본문 (하루 캐시). */
export function getLawDocument(lawId: string): Promise<LawDocument> {
  return cached(`law:${lawId}`, DAY, async () => parseLawDocument(await drf("lawService.do", { target: "law", ID: lawId }), lawId));
}

// ───────────────────────── 판례 ─────────────────────────

export interface CaseSummary {
  id: string;
  caseNo: string;
  name: string;
  court: string;
  date: string;
  source: string; // 대법원 | 국세법령정보시스템 …
  kind: string;
  /** 국가법령정보 API 로 본문(JSON)을 받을 수 있는지. 국세법령정보시스템 출처는 받을 수 없다 (실호출 확인). */
  hasDetail: boolean;
  publicUrl: string;
}

/** 국가법령정보 API 가 본문을 주지 않는 판례 출처 (국세법령정보시스템은 실호출 확인, 지방세법령정보시스템은 같은 성격으로 추정). */
const NO_DETAIL_SOURCES = new Set(["국세법령정보시스템", "지방세법령정보시스템"]);

export interface CaseList {
  total: number;
  page: number;
  perPage: number;
  items: CaseSummary[];
}

export function searchCases(query: string, page = 1, perPage = 20): Promise<CaseList> {
  return cached(`prec:${query}:${page}:${perPage}`, 6 * 60 * 60 * 1000, async () => {
    const json = (await drf("lawSearch.do", { target: "prec", query, display: perPage, page })) as Raw;
    const root = (json["PrecSearch"] ?? {}) as Raw;
    const items = asArray(root["prec"] as Raw | Raw[]).map((p) => {
      const id = String(p["판례일련번호"] ?? "");
      const caseNo = String(p["사건번호"] ?? "");
      const source = String(p["데이터출처명"] ?? "");
      // 국세법령정보시스템 출처는 법원명이 비어 있고 사건번호가 "서울행정법원-2025-구합-55962" 형태다.
      const courtFromNo = caseNo.includes("-") ? caseNo.split("-")[0] : "";
      return {
        id,
        caseNo,
        name: lawText(p["사건명"]),
        court: String(p["법원명"] || courtFromNo || source),
        date: String(p["선고일자"] ?? "").replace(/\./g, "-"),
        source,
        kind: String(p["사건종류명"] ?? ""),
        hasDetail: !NO_DETAIL_SOURCES.has(source),
        publicUrl: casePublicUrl(id),
      };
    });
    return { total: Number(root["totalCnt"] ?? items.length) || 0, page, perPage, items };
  });
}

export interface CaseDetail {
  id: string;
  caseNo: string;
  name: string;
  court: string;
  date: string;
  kind: string;
  verdictType: string;
  holdings: string; // 판시사항
  summary: string; // 판결요지
  refArticles: string; // 참조조문
  refCases: string; // 참조판례
  body: string; // 판례내용
  sourceUrl: string;
}

/** 판례 상세. 국세법령정보시스템 출처 등 상세가 제공되지 않으면 null. */
export function getCase(id: string): Promise<CaseDetail | null> {
  return cached(`prec-detail:${id}`, DAY, async () => {
    const json = (await drf("lawService.do", { target: "prec", ID: id })) as Raw;
    const d = json["PrecService"] as Raw | undefined;
    if (!d) return null;
    return {
      id,
      caseNo: String(d["사건번호"] ?? ""),
      name: lawText(d["사건명"]),
      court: String(d["법원명"] ?? ""),
      date: ymd(d["선고일자"]),
      kind: String(d["사건종류명"] ?? ""),
      verdictType: String(d["판결유형"] ?? ""),
      holdings: lawText(d["판시사항"]),
      summary: lawText(d["판결요지"]),
      refArticles: lawText(d["참조조문"]),
      refCases: lawText(d["참조판례"]),
      body: lawText(d["판례내용"]),
      sourceUrl: casePublicUrl(id),
    };
  });
}

/** 국가법령정보센터 공개 판례 페이지. API 의 HTML 상세(type=HTML)가 이 주소를 iframe 으로 띄운다 (실호출 확인). */
export function casePublicUrl(id: string): string {
  return `${BASE}/LSW/precInfoP.do?precSeq=${encodeURIComponent(id)}&mode=0`;
}

/** 국세법령정보시스템 (기본통칙·집행기준·예규 원문). */
export const NTS_TAXLAW_URL = "https://taxlaw.nts.go.kr";
