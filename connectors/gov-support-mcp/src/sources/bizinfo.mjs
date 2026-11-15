// 기업마당(bizinfo.go.kr) 지원사업정보 API — 중소벤처기업부.
// 인증키(crtfcKey)는 기업마당 사이트에서 별도 발급 (data.go.kr 키와 다름).
//
// ⚠️ 엔드포인트·파라미터·응답 필드명은 공개된 제3자 구현과 기존 사용 예시를 바탕으로 작성했으며
//    공식 명세서로 직접 검증하지 못했다. 필드명은 여러 후보를 순서대로 시도한다.
//    공식 문서: https://www.bizinfo.go.kr/web/lay1/program/S1T175C174/apiDetail.do

import { buildUrl, getJson, MissingKeyError, SourceError } from "../http.mjs";
import { clamp, cleanText, deadlineStatus, matchesKeyword, matchesRegion, pick, splitPeriod, toIsoDate } from "../normalize.mjs";

export const SOURCE = "bizinfo";
const ENDPOINT = "https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do";
const DETAIL_BASE = "https://www.bizinfo.go.kr";

/** 기업마당 지원분야 (응답의 분야명과 클라이언트 측 필터에 사용). */
export const BIZINFO_CATEGORIES = ["금융", "기술", "인력", "수출", "내수", "창업", "경영", "기타"];

function extractRows(payload) {
  const arr = payload?.jsonArray ?? payload?.items ?? payload?.data;
  if (Array.isArray(arr)) return arr;
  if (Array.isArray(arr?.item)) return arr.item;
  if (arr && typeof arr === "object") return [arr];
  return null;
}

export function normalizeBizinfo(row) {
  const periodText = pick(row, "reqstBeginEndDe", "reqstDt", "rceptPd");
  const { start, end } = splitPeriod(periodText);
  let url = pick(row, "pblancUrl", "link", "url");
  if (url && url.startsWith("/")) url = DETAIL_BASE + url;
  const id = pick(row, "pblancId", "seq", "id");
  if (!url && id) url = `${DETAIL_BASE}/sii/siia/selectSIIA200Detail.do?pblancId=${encodeURIComponent(id)}`;
  const item = {
    source: SOURCE,
    sourceName: "기업마당",
    id,
    title: cleanText(pick(row, "pblancNm", "title"), 200),
    summary: cleanText(pick(row, "bsnsSumryCn", "description")),
    category: pick(row, "pldirSportRealmLclasCodeNm", "lcategory", "category"),
    organization: pick(row, "jrsdInsttNm", "author"),
    executor: pick(row, "excInsttNm"),
    target: cleanText(pick(row, "trgetNm", "trgetCn"), 200),
    region: "",
    hashtags: pick(row, "hashtags", "hashTags"),
    applyPeriodText: periodText,
    applyStart: start,
    applyEnd: end,
    registeredAt: toIsoDate(pick(row, "creatPnttm", "pubDate", "registDt")),
    url,
  };
  item.status = deadlineStatus(item);
  // 기업마당은 지역 필드가 없어 해시태그·제목에서 지역을 추정한다.
  item.region = item.hashtags;
  return item;
}

/**
 * @param {object} opts
 * @param {string} [opts.keyword]   제목·개요·해시태그 키워드 (클라이언트 측 필터)
 * @param {string} [opts.category]  BIZINFO_CATEGORIES 중 하나 (클라이언트 측 필터)
 * @param {string} [opts.region]    "서울", "경기" 등 (해시태그 기반, 클라이언트 측 필터)
 * @param {string} [opts.hashtags]  서버 측 해시태그 검색 (쉼표 구분)
 * @param {boolean} [opts.openOnly] 마감된 공고 제외
 * @param {number} [opts.limit]     반환 개수 (기본 20)
 * @param {number} [opts.fetchCount] 서버에서 가져올 개수 (기본 200)
 */
export async function searchBizinfo(opts = {}, env = process.env, fetchImpl) {
  const key = env.BIZINFO_API_KEY?.trim();
  if (!key) throw new MissingKeyError(SOURCE, "BIZINFO_API_KEY", "기업마당 > 정책정보 > 지원사업 API 에서 인증키 신청");
  const limit = clamp(opts.limit ?? 20, 1, 100);
  const fetchCount = clamp(opts.fetchCount ?? 200, 1, 1000);
  const url = buildUrl(
    ENDPOINT,
    { dataType: "json", searchCnt: fetchCount, pageUnit: fetchCount, pageIndex: 1, hashtags: opts.hashtags },
    { crtfcKey: encodeURIComponent(key) },
  );
  const payload = await getJson(SOURCE, url, { secret: key, fetchImpl });
  const rows = extractRows(payload);
  if (!rows) {
    const msg = payload?.reqErr ?? payload?.errMsg ?? payload?.message;
    throw new SourceError(SOURCE, `예상과 다른 응답 형식${msg ? `: ${msg}` : ""} (응답 키: ${Object.keys(payload ?? {}).slice(0, 8).join(", ")})`);
  }
  const all = rows.map(normalizeBizinfo).filter((i) => i.title);
  const filtered = all.filter(
    (i) =>
      matchesKeyword(`${i.title} ${i.summary} ${i.hashtags} ${i.target}`, opts.keyword) &&
      (!opts.category || i.category.includes(opts.category)) &&
      matchesRegion(`${i.region} ${i.title}`, opts.region) &&
      (!opts.openOnly || i.status !== "closed"),
  );
  return { source: SOURCE, fetched: all.length, matched: filtered.length, items: filtered.slice(0, limit) };
}
