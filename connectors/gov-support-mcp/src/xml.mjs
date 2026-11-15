// 의존성 없는 최소 XML/RSS 파서 — <item> 같은 반복 요소를 { 태그명: 텍스트 } 객체 목록으로 바꾼다.
// 평평한(1단계) 자식 요소만 다룬다. 같은 이름의 자식이 여러 번 나오면 쉼표로 이어 붙인다.

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function decodeXmlText(raw) {
  const s = String(raw ?? "");
  // CDATA 는 그대로, 나머지는 엔티티를 푼다.
  return s
    .split(/(<!\[CDATA\[[\s\S]*?\]\]>)/)
    .map((part) =>
      part.startsWith("<![CDATA[")
        ? part.slice(9, -3)
        : part.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
            if (e[0] === "#") {
              const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
              return Number.isFinite(code) ? String.fromCodePoint(code) : m;
            }
            return ENTITIES[e.toLowerCase()] ?? m;
          }),
    )
    .join("")
    .trim();
}

/** 문서에서 <tag> 요소들을 찾아 자식 요소를 객체로 반환. 태그명 비교는 대소문자 무시. */
export function parseXmlRecords(xml, tag = "item") {
  const records = [];
  const itemRe = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "gi");
  for (const [, inner] of String(xml).matchAll(itemRe)) {
    const rec = {};
    const childRe = /<([A-Za-z_][\w.:-]*)(?:\s[^>]*)?(?:\/>|>([\s\S]*?)<\/\1\s*>)/g;
    for (const [, name, value] of inner.matchAll(childRe)) {
      const v = decodeXmlText(value ?? "");
      rec[name] = rec[name] && v ? `${rec[name]},${v}` : rec[name] || v;
    }
    records.push(rec);
  }
  return records;
}

export function looksLikeXml(body) {
  return /^\s*(<\?xml|<rss|<[A-Za-z])/.test(String(body));
}
