// 행정안전부 대한민국 공공서비스(혜택) 정보 (보조금24) — 공공데이터포털 데이터셋 15113968.
// https://www.data.go.kr/data/15113968/openapi.do (활용신청 자동승인, data.go.kr 일반 인증키 사용)
// 중앙부처·지자체·공공기관의 상시 혜택(보조금·바우처·감면 등) 약 1만여 건.
//
// ⚠️ cond[필드::LIKE] 서버 필터는 odcloud 계열 API 의 일반 규칙을 따른 것으로, 이 API 에서 모든 필드에
//    동작하는지는 직접 검증하지 못했다. 결과는 클라이언트에서 한 번 더 거른다.

import { buildUrl, encodeServiceKey, getJson, MissingKeyError, SourceError } from "../http.mjs";
import { clamp, cleanText, matchesKeyword, pick, toIsoDate } from "../normalize.mjs";

export const SOURCE = "gov24";
const BASE = "https://api.odcloud.kr/api/gov24/v3";

export function normalizeGov24(row, { full = false } = {}) {
  const id = pick(row, "서비스ID", "SVC_ID", "svcId", "serviceId");
  const max = full ? 4000 : 300;
  const item = {
    source: SOURCE,
    sourceName: "보조금24",
    id,
    title: cleanText(pick(row, "서비스명"), 200),
    summary: cleanText(pick(row, "서비스목적요약", "서비스목적"), max),
    category: pick(row, "서비스분야"),
    supportType: pick(row, "지원유형"),
    userType: pick(row, "사용자구분"),
    organization: pick(row, "소관기관명"),
    executor: pick(row, "부서명"),
    receivingOrg: pick(row, "접수기관명", "접수기관"),
    target: cleanText(pick(row, "지원대상"), max),
    criteria: cleanText(pick(row, "선정기준"), max),
    content: cleanText(pick(row, "지원내용"), max),
    howToApply: cleanText(pick(row, "신청방법"), max),
    applyPeriodText: cleanText(pick(row, "신청기한"), 200),
    contact: pick(row, "전화문의", "문의처전화번호"),
    registeredAt: toIsoDate(pick(row, "수정일시", "등록일시")),
    url: pick(row, "상세조회URL", "온라인신청사이트URL") || (id ? `https://www.gov.kr/portal/rcvfvrSvc/dtlEx/${encodeURIComponent(id)}` : ""),
    status: "always", // 대부분 상시 신청 — 신청기한(applyPeriodText) 원문을 확인
  };
  if (full) {
    item.documents = cleanText(pick(row, "구비서류"), max);
    item.onlineApplyUrl = pick(row, "온라인신청사이트URL");
    item.laws = cleanText(pick(row, "법령"), max);
  }
  return item;
}

function getKey(env) {
  const key = (env.GOV24_API_KEY || env.DATA_GO_KR_API_KEY)?.trim();
  if (!key) throw new MissingKeyError(SOURCE, "DATA_GO_KR_API_KEY", "공공데이터포털에서 데이터셋 15113968 활용신청(자동승인)");
  return key;
}

function rowsOf(payload) {
  if (payload?.code && Number(payload.code) < 0) {
    throw new SourceError(SOURCE, `API 오류 ${payload.code}: ${payload.msg ?? ""}`);
  }
  if (!Array.isArray(payload?.data)) {
    throw new SourceError(SOURCE, `예상과 다른 응답 형식 (응답 키: ${Object.keys(payload ?? {}).slice(0, 8).join(", ")})`);
  }
  return payload.data;
}

/**
 * @param {object} opts
 * @param {string} [opts.keyword]   서비스명 키워드 (서버 LIKE + 클라이언트 필터)
 * @param {string} [opts.userType]  사용자구분 (예: 개인, 소상공인, 법인/시설/단체) — 클라이언트 필터
 * @param {string} [opts.category]  서비스분야 (예: 고용·창업, 보육·교육, 주거·자립) — 클라이언트 필터
 * @param {string} [opts.organization] 소관기관명 일부 (예: 서울특별시, 중소벤처기업부)
 * @param {number} [opts.limit]
 */
export async function searchGov24(opts = {}, env = process.env, fetchImpl) {
  const key = getKey(env);
  const limit = clamp(opts.limit ?? 20, 1, 100);
  const firstToken = String(opts.keyword ?? "").trim().split(/\s+/)[0];
  const params = { page: 1, perPage: clamp(Math.max(limit * 5, 100), 1, 500), returnType: "JSON" };
  if (firstToken) params["cond[서비스명::LIKE]"] = firstToken;
  if (opts.organization) params["cond[소관기관명::LIKE]"] = opts.organization;
  const url = buildUrl(`${BASE}/serviceList`, params, { serviceKey: encodeServiceKey(key) });
  const payload = await getJson(SOURCE, url, { secret: key, fetchImpl });
  const all = rowsOf(payload).map((r) => normalizeGov24(r)).filter((i) => i.title);
  const filtered = all.filter(
    (i) =>
      matchesKeyword(`${i.title} ${i.summary} ${i.target} ${i.content}`, opts.keyword) &&
      (!opts.userType || i.userType.includes(opts.userType)) &&
      (!opts.category || i.category.includes(opts.category)) &&
      (!opts.organization || i.organization.includes(opts.organization)),
  );
  return {
    source: SOURCE,
    totalCount: payload.totalCount ?? payload.matchCount,
    fetched: all.length,
    matched: filtered.length,
    items: filtered.slice(0, limit),
  };
}

/** 서비스 ID 로 상세(지원내용·신청방법·구비서류 등) 조회. */
export async function getGov24Detail(serviceId, env = process.env, fetchImpl) {
  const key = getKey(env);
  if (!serviceId) throw new SourceError(SOURCE, "serviceId 가 필요합니다.");
  const url = buildUrl(
    `${BASE}/serviceDetail`,
    { page: 1, perPage: 1, returnType: "JSON", "cond[서비스ID::EQ]": serviceId },
    { serviceKey: encodeServiceKey(key) },
  );
  const payload = await getJson(SOURCE, url, { secret: key, fetchImpl });
  const row = rowsOf(payload)[0];
  if (!row) throw new SourceError(SOURCE, `서비스 ID ${serviceId} 를 찾을 수 없습니다.`);
  return normalizeGov24(row, { full: true });
}
