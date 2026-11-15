// 창업진흥원 K-Startup 조회서비스 — 공공데이터포털 데이터셋 15125364.
// https://www.data.go.kr/data/15125364/openapi.do (활용신청 필요, data.go.kr 일반 인증키 사용)
//
// ⚠️ 파라미터·필드명은 공개된 제3자 구현(실호출 검증을 주장)을 참고했으며 공식 명세로 직접 확인하지 못했다.
//    지역·대상·업력 필터는 서버가 무시하는 사례가 보고되어 클라이언트에서 한 번 더 거른다.

import { buildUrl, encodeServiceKey, getJson, MissingKeyError, SourceError } from "../http.mjs";
import { clamp, cleanText, deadlineStatus, matchesKeyword, matchesRegion, pick, toIsoDate } from "../normalize.mjs";

export const SOURCE = "kstartup";
const BASE = "https://apis.data.go.kr/B552735/kisedKstartupService01";

export function normalizeKstartup(row) {
  const id = pick(row, "pbanc_sn", "id");
  const item = {
    source: SOURCE,
    sourceName: "K-Startup",
    id,
    title: cleanText(pick(row, "biz_pbanc_nm", "intg_pbanc_biz_nm"), 200),
    summary: cleanText(pick(row, "pbanc_ctnt")),
    category: pick(row, "supt_biz_clsfc"),
    organization: pick(row, "pbanc_ntrp_nm", "sprv_inst"),
    executor: pick(row, "biz_prch_dprt_nm"),
    target: cleanText([pick(row, "aply_trgt"), pick(row, "aply_trgt_ctnt")].filter(Boolean).join(" / "), 300),
    region: pick(row, "supt_regin"),
    businessAge: pick(row, "biz_enyy"),
    targetAge: pick(row, "biz_trgt_age"),
    applyPeriodText: "",
    applyStart: toIsoDate(pick(row, "pbanc_rcpt_bgng_dt")),
    applyEnd: toIsoDate(pick(row, "pbanc_rcpt_end_dt")),
    registeredAt: "",
    contact: pick(row, "prch_cnpl_no"),
    recruiting: pick(row, "rcrt_prgs_yn") || undefined,
    url: pick(row, "detl_pg_url", "biz_gdnc_url", "aply_mthd_onli_rcpt_istc"),
  };
  item.applyPeriodText = [item.applyStart, item.applyEnd].filter(Boolean).join(" ~ ");
  item.status = item.recruiting === "N" ? "closed" : deadlineStatus(item);
  if (!item.url && id) item.url = `https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${encodeURIComponent(id)}`;
  return item;
}

/**
 * @param {object} opts
 * @param {string} [opts.keyword]      공고명 키워드 (서버 biz_pbanc_nm + 클라이언트 필터)
 * @param {string} [opts.region]       지원지역 (예: 서울, 경기)
 * @param {string} [opts.target]       신청대상 (예: 예비창업자, 일반기업, 대학생)
 * @param {string} [opts.businessAge]  창업업력 (예: "3년미만", "예비창업자")
 * @param {string} [opts.category]    지원분야 (예: 사업화, 기술개발(R&D), 멘토링ㆍ컨설팅ㆍ교육)
 * @param {boolean} [opts.openOnly]   모집중(rcrt_prgs_yn=Y)만 (기본 true)
 * @param {number} [opts.limit]       반환 개수 (기본 20)
 */
export async function searchKstartup(opts = {}, env = process.env, fetchImpl) {
  const key = (env.KSTARTUP_API_KEY || env.DATA_GO_KR_API_KEY)?.trim();
  if (!key) throw new MissingKeyError(SOURCE, "DATA_GO_KR_API_KEY", "공공데이터포털에서 데이터셋 15125364 활용신청");
  const limit = clamp(opts.limit ?? 20, 1, 100);
  const openOnly = opts.openOnly ?? true;
  // 클라이언트 측 필터 때문에 넉넉히 받아온다.
  const perPage = clamp(Math.max(limit * 5, 100), 1, 500);
  const url = buildUrl(
    `${BASE}/getAnnouncementInformation01`,
    {
      page: 1,
      perPage,
      returnType: "json",
      biz_pbanc_nm: opts.keyword && !/\s/.test(opts.keyword) ? opts.keyword : undefined,
      supt_biz_clsfc: opts.category,
      rcrt_prgs_yn: openOnly ? "Y" : undefined,
    },
    { serviceKey: encodeServiceKey(key) },
  );
  const payload = await getJson(SOURCE, url, { secret: key, fetchImpl });
  if (payload?.resultCode && payload.resultCode !== "00") {
    throw new SourceError(SOURCE, `API 오류 ${payload.resultCode}: ${payload.resultMsg ?? ""}`);
  }
  const rows = payload?.data ?? payload?.items;
  if (!Array.isArray(rows)) {
    throw new SourceError(SOURCE, `예상과 다른 응답 형식 (응답 키: ${Object.keys(payload ?? {}).slice(0, 8).join(", ")})`);
  }
  const all = rows.map(normalizeKstartup).filter((i) => i.title);
  const filtered = all.filter(
    (i) =>
      matchesKeyword(`${i.title} ${i.summary} ${i.target}`, opts.keyword) &&
      matchesRegion(i.region, opts.region) &&
      (!opts.target || i.target.includes(opts.target)) &&
      (!opts.businessAge || i.businessAge.includes(opts.businessAge)) &&
      (!opts.category || i.category.includes(opts.category)) &&
      (!openOnly || i.status !== "closed"),
  );
  return {
    source: SOURCE,
    totalCount: payload.totalCount,
    fetched: all.length,
    matched: filtered.length,
    items: filtered.slice(0, limit),
  };
}
