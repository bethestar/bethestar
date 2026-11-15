// 기업마당(bizinfo.go.kr) 지원사업정보 API — 중소벤처기업부.
// 인증키(crtfcKey)는 기업마당 사이트에서 별도 발급 (data.go.kr 키와 다름).
//
// 2026-11 실제 호출로 확인: dataType=json 요청 시 JSON 응답, 필드명(pblancNm·bsnsSumryCn·jrsdInsttNm·
//    excInsttNm·reqstBeginEndDe·pldirSportRealmLclasCodeNm·trgetNm·hashtags·creatPnttm·pblancId) 일치.
//    해외 IP 에서는 연결이 끊긴다 (국내 서버에서 호출해야 함, 원인 추정).
//    XML(RSS) 응답 보고도 있어 JSON·XML 을 모두 읽는다. 필드명은 여러 후보를 순서대로 시도한다.
//    공식 문서: https://www.bizinfo.go.kr/apiDetail.do?id=bizinfoApi (API 목록: https://www.bizinfo.go.kr/apiList.do)

import { AuthError, buildUrl, getText, MissingKeyError, SourceError, xmlErrorMessage } from "../http.mjs";
import { looksLikeXml, parseXmlRecords } from "../xml.mjs";
import { clamp, cleanText, deadlineStatus, matchesKeyword, matchesRegion, pick, splitPeriod, toIsoDate } from "../normalize.mjs";

export const SOURCE = "bizinfo";
const ENDPOINT = "https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do";
const DETAIL_BASE = "https://www.bizinfo.go.kr";

/** 기업마당 지원분야 (응답의 분야명과 클라이언트 측 필터에 사용). */
export const BIZINFO_CATEGORIES = ["금융", "기술", "인력", "수출", "내수", "창업", "경영", "기타"];

const LIST_KEYS = ["jsonArray", "items", "item", "data", "list", "result", "results"];

function isRecordArray(v) {
  return Array.isArray(v) && (v.length === 0 || (typeof v[0] === "object" && v[0] !== null));
}

/** JSON 응답에서 공고 목록 배열을 찾는다. 래퍼 키가 확인되지 않아 여러 형태를 허용한다. */
export function extractRows(payload, depth = 0) {
  if (isRecordArray(payload)) return payload;
  if (!payload || typeof payload !== "object" || depth > 3) return null;
  for (const k of LIST_KEYS) {
    const v = payload[k];
    if (isRecordArray(v)) return v;
    if (v && typeof v === "object") {
      const inner = extractRows(v, depth + 1);
      if (inner) return inner;
      if (depth === 0 && (v.pblancNm || v.title)) return [v]; // 결과가 1건이면 배열이 아닐 수 있다
    }
  }
  // 알려진 키가 없으면 공고처럼 보이는 객체 배열을 찾는다.
  for (const v of Object.values(payload)) {
    if (isRecordArray(v) && v.some((r) => r && (r.pblancNm || r.title))) return v;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const inner = extractRows(v, depth + 1);
      if (inner) return inner;
    }
  }
  return null;
}

/**
 * 응답 본문을 공고 목록으로 바꾼다. dataType=json 을 요청해도 XML(RSS)이 온다는 보고가 있어
 * JSON 을 먼저 시도하고, 아니면 RSS <item> 을 읽는다.
 * @returns {{ rows: object[], format: "json" | "xml" }}
 */
export function parseBizinfoBody(body) {
  const text = String(body ?? "").replace(/^\uFEFF/, "").trim();
  if (text.startsWith("{") || text.startsWith("[")) {
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      throw new SourceError(SOURCE, "JSON 응답을 해석하지 못했습니다.");
    }
    // 잘못된 키는 HTTP 200 + {"reqErr": "존재하지 않는 인증키 입니다."} 로 온다 (실호출 확인).
    if (payload?.reqErr) {
      throw new AuthError(SOURCE, `인증키 오류: ${payload.reqErr} BIZINFO_API_KEY 를 확인하세요`);
    }
    const rows = extractRows(payload);
    if (!rows) {
      const msg = payload?.reqErr ?? payload?.errMsg ?? payload?.message ?? payload?.resultMsg;
      throw new SourceError(SOURCE, `예상과 다른 응답 형식${msg ? `: ${msg}` : ""} (응답 키: ${Object.keys(payload ?? {}).slice(0, 8).join(", ")})`);
    }
    return { rows, format: "json" };
  }
  if (looksLikeXml(text)) {
    const rows = parseXmlRecords(text, "item");
    if (rows.length === 0) {
      const msg = xmlErrorMessage(text);
      // 정상 RSS 인데 공고가 0건인 경우와 오류 응답을 구분한다.
      if (!msg && /<(rss|channel)[\s>]/i.test(text)) return { rows: [], format: "xml" };
      throw new SourceError(SOURCE, `XML 응답에 공고(<item>)가 없습니다${msg ? `: ${msg}` : ""} — 인증키를 확인하세요.`);
    }
    return { rows, format: "xml" };
  }
  throw new SourceError(SOURCE, `알 수 없는 응답 형식: ${text.slice(0, 80)}`);
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
    applyPeriodText: start && end ? `${start} ~ ${end}` : periodText,
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
  if (!key) throw new MissingKeyError(SOURCE, "BIZINFO_API_KEY", "기업마당 로그인 > 활용정보 > 정책정보 개방 > 지원사업정보 API 사용신청 (https://www.bizinfo.go.kr/apiList.do)");
  const limit = clamp(opts.limit ?? 20, 1, 100);
  const fetchCount = clamp(opts.fetchCount ?? 200, 1, 1000);
  const url = buildUrl(
    ENDPOINT,
    { dataType: "json", searchCnt: fetchCount, pageUnit: fetchCount, pageIndex: 1, hashtags: opts.hashtags },
    { crtfcKey: encodeURIComponent(key) },
  );
  const body = await getText(SOURCE, url, {
    secret: key,
    fetchImpl,
    accept: "application/json, application/rss+xml;q=0.9, application/xml;q=0.9, */*;q=0.8",
  });
  const { rows, format } = parseBizinfoBody(body);
  const all = rows.map(normalizeBizinfo).filter((i) => i.title);
  const filtered = all.filter(
    (i) =>
      matchesKeyword(`${i.title} ${i.summary} ${i.hashtags} ${i.target}`, opts.keyword) &&
      (!opts.category || i.category.includes(opts.category)) &&
      matchesRegion(`${i.region} ${i.title}`, opts.region) &&
      (!opts.openOnly || i.status !== "closed"),
  );
  return { source: SOURCE, format, fetched: all.length, matched: filtered.length, items: filtered.slice(0, limit) };
}
