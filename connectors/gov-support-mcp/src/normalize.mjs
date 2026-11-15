// 소스별 응답을 하나의 공고 형식으로 맞추기 위한 도우미.

/** 후보 키 중 처음으로 값이 있는 필드를 반환 (API 버전별 필드명 차이 대응). */
export function pick(row, ...keys) {
  for (const k of keys) {
    const v = row?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

/** HTML 태그·엔티티 제거 후 공백 정리, 길이 제한. */
export function cleanText(text, max = 400) {
  const s = String(text ?? "")
    .replace(/<\/?[A-Za-z][^>]*>/g, " ")
    .replace(/&(#x[0-9a-f]+|#\d+|nbsp|amp|lt|gt|quot|apos);/gi, (m, e) => {
      const named = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[e.toLowerCase()];
      if (named) return named;
      const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m;
    })
    .replace(/\s+/g, " ")
    .trim();
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

/** "20251101", "2025-11-01", "2025.11.01" 등을 "2025-11-01" 로. 아니면 "". */
export function toIsoDate(text) {
  const m = String(text ?? "").match(/(\d{4})[.\-/]?\s?(\d{1,2})[.\-/]?\s?(\d{1,2})/);
  if (!m) return "";
  const [, y, mo, d] = m;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

/** "2025-11-01 ~ 2025-11-30" 형태의 기간 문자열을 시작/종료일로 분리. */
export function splitPeriod(text) {
  const parts = String(text ?? "").split(/~|∼|〜/);
  // "예산 소진시까지" 처럼 날짜 범위가 아니면 둘 다 비워 둔다 (원문은 applyPeriodText 로 유지).
  if (parts.length < 2) return { start: "", end: "" };
  return { start: toIsoDate(parts[0]), end: toIsoDate(parts[1]) };
}

/** 오늘(KST) 날짜 "YYYY-MM-DD". */
export function todayKst(now = new Date()) {
  return new Date(now.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

/** 마감 상태: open | closed | upcoming | unknown */
export function deadlineStatus({ applyStart, applyEnd }, today = todayKst()) {
  if (applyEnd && applyEnd < today) return "closed";
  if (applyStart && applyStart > today) return "upcoming";
  if (applyEnd) return "open";
  return "unknown";
}

/** 공백으로 나눈 모든 키워드가 haystack 에 포함되는지 (대소문자·공백 무시). */
export function matchesKeyword(haystack, keyword) {
  if (!keyword) return true;
  const hay = String(haystack).toLowerCase().replace(/\s+/g, "");
  return String(keyword)
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((t) => hay.includes(t));
}

const REGION_SHORT = {
  서울특별시: "서울", 서울시: "서울", 부산광역시: "부산", 부산시: "부산", 대구광역시: "대구",
  인천광역시: "인천", 광주광역시: "광주", 대전광역시: "대전", 울산광역시: "울산",
  세종특별자치시: "세종", 세종시: "세종", 경기도: "경기", 강원특별자치도: "강원", 강원도: "강원",
  충청북도: "충북", 충청남도: "충남", 전북특별자치도: "전북", 전라북도: "전북", 전라남도: "전남",
  경상북도: "경북", 경상남도: "경남", 제주특별자치도: "제주", 제주도: "제주",
};

export function shortRegion(region) {
  const r = String(region ?? "").trim();
  return REGION_SHORT[r] ?? r;
}

/** 지역 필터: 공고 지역에 요청 지역 또는 "전국" 이 포함되면 통과. 지역 정보가 없으면 통과. */
export function matchesRegion(itemRegion, wanted) {
  if (!wanted) return true;
  const hay = String(itemRegion ?? "");
  if (!hay) return true;
  const w = shortRegion(wanted);
  return hay.includes(w) || hay.includes(wanted) || hay.includes("전국");
}

/** 정수로 변환해 [lo, hi] 범위로 자른다. */
export function clamp(n, lo, hi) {
  const x = Number.isFinite(Number(n)) ? Math.trunc(Number(n)) : lo;
  return Math.min(hi, Math.max(lo, x));
}
