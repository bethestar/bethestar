import { test } from "node:test";
import assert from "node:assert/strict";
import { searchBizinfo } from "../src/sources/bizinfo.mjs";
import { searchKstartup } from "../src/sources/kstartup.mjs";
import { searchGov24, getGov24Detail } from "../src/sources/gov24.mjs";
import { searchAll } from "../src/search.mjs";
import { getJson, redact, encodeServiceKey } from "../src/http.mjs";
import { splitPeriod, deadlineStatus, matchesRegion } from "../src/normalize.mjs";

const KEY = "abc+def/ghi==";
const ENV = { BIZINFO_API_KEY: "BIZKEY123", DATA_GO_KR_API_KEY: KEY };

/** 호출된 URL 을 기록하고 host 별로 준비된 응답을 돌려주는 가짜 fetch. */
function mockFetch(byHost, calls = []) {
  return async (url) => {
    calls.push(url);
    const host = new URL(url).hostname;
    const r = byHost[host];
    if (!r) throw new Error(`unexpected host ${host}`);
    const { status = 200, body } = typeof r === "function" ? r(url) : r;
    return { status, ok: status >= 200 && status < 300, text: async () => (typeof body === "string" ? body : JSON.stringify(body)) };
  };
}

const bizinfoBody = {
  jsonArray: [
    {
      pblancId: "PBLN_000001",
      pblancNm: "2026년 소상공인 세무·회계 교육 지원",
      pblancUrl: "/web/lay1/bbs/S1T122C128/AS/74/view.do?pblancId=PBLN_000001",
      bsnsSumryCn: "<p>소상공인 대상 세무 교육</p>",
      jrsdInsttNm: "중소벤처기업부",
      excInsttNm: "소상공인시장진흥공단",
      reqstBeginEndDe: "20991101 ~ 20991130",
      pldirSportRealmLclasCodeNm: "경영",
      hashtags: "서울,소상공인,교육",
      trgetNm: "소상공인",
      creatPnttm: "2026-11-01 09:00:00",
    },
    {
      pblancId: "PBLN_000002",
      pblancNm: "마감된 수출 바우처",
      reqstBeginEndDe: "20200101 ~ 20200131",
      pldirSportRealmLclasCodeNm: "수출",
      hashtags: "부산",
    },
  ],
};

const kstartupBody = {
  currentCount: 2,
  totalCount: 2,
  data: [
    {
      pbanc_sn: 170001,
      biz_pbanc_nm: "2027년 예비창업패키지 예비창업자 모집",
      supt_regin: "전국",
      aply_trgt: "예비창업자",
      biz_enyy: "예비창업자",
      pbanc_rcpt_bgng_dt: "20990201",
      pbanc_rcpt_end_dt: "20990301",
      rcrt_prgs_yn: "Y",
      supt_biz_clsfc: "사업화",
      pbanc_ntrp_nm: "창업진흥원",
      detl_pg_url: "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=170001",
    },
    {
      pbanc_sn: 170002,
      biz_pbanc_nm: "부산 창업 공간 입주기업 모집",
      supt_regin: "부산",
      aply_trgt: "일반기업",
      pbanc_rcpt_end_dt: "20990101",
      rcrt_prgs_yn: "Y",
    },
  ],
};

const gov24Body = {
  totalCount: 2,
  data: [
    {
      서비스ID: "000000465790",
      서비스명: "소상공인 고용보험료 지원",
      서비스목적요약: "1인 소상공인 고용보험료 일부 지원",
      소관기관명: "중소벤처기업부",
      사용자구분: "소상공인",
      서비스분야: "고용·창업",
      신청기한: "상시신청",
      상세조회URL: "https://www.gov.kr/portal/rcvfvrSvc/dtlEx/000000465790",
    },
    { 서비스ID: "1", 서비스명: "아동수당", 사용자구분: "개인" },
  ],
};

test("bizinfo: 정규화·키워드·마감 필터·상대 URL 보정", async () => {
  const calls = [];
  const r = await searchBizinfo({ keyword: "세무", openOnly: true }, ENV, mockFetch({ "www.bizinfo.go.kr": { body: bizinfoBody } }, calls));
  assert.equal(r.fetched, 2);
  assert.equal(r.items.length, 1);
  const i = r.items[0];
  assert.equal(i.title, "2026년 소상공인 세무·회계 교육 지원");
  assert.equal(i.summary, "소상공인 대상 세무 교육");
  assert.equal(i.applyStart, "2099-11-01");
  assert.equal(i.applyEnd, "2099-11-30");
  assert.equal(i.status, "upcoming");
  assert.ok(i.url.startsWith("https://www.bizinfo.go.kr/web/"));
  assert.match(calls[0], /crtfcKey=BIZKEY123/);
  assert.match(calls[0], /dataType=json/);
});

test("bizinfo: 분야 필터, 마감 포함", async () => {
  const r = await searchBizinfo({ category: "수출", openOnly: false }, ENV, mockFetch({ "www.bizinfo.go.kr": { body: bizinfoBody } }));
  assert.equal(r.items.length, 1);
  assert.equal(r.items[0].status, "closed");
});

test("bizinfo: 키 없으면 안내 오류", async () => {
  await assert.rejects(() => searchBizinfo({}, {}, mockFetch({})), /BIZINFO_API_KEY/);
});

test("kstartup: 서비스키 인코딩, 지역 클라이언트 필터(전국 포함)", async () => {
  const calls = [];
  const r = await searchKstartup({ region: "서울특별시" }, ENV, mockFetch({ "apis.data.go.kr": { body: kstartupBody } }, calls));
  assert.equal(r.items.length, 1, "부산 공고는 제외, 전국 공고는 포함");
  assert.equal(r.items[0].title, "2027년 예비창업패키지 예비창업자 모집");
  assert.equal(r.items[0].applyEnd, "2099-03-01");
  assert.match(calls[0], new RegExp(`serviceKey=${encodeURIComponent(KEY).replace(/[+]/g, "\\+")}`));
  assert.match(calls[0], /rcrt_prgs_yn=Y/);
  assert.match(calls[0], /getAnnouncementInformation01/);
});

test("kstartup: resultCode 오류 전달", async () => {
  await assert.rejects(
    () => searchKstartup({}, ENV, mockFetch({ "apis.data.go.kr": { body: { resultCode: "30", resultMsg: "SERVICE KEY IS NOT REGISTERED" } } })),
    /SERVICE KEY IS NOT REGISTERED/,
  );
});

test("kstartup: XML 오류 응답 안내", async () => {
  const xml = "<OpenAPI_ServiceResponse><cmmMsgHeader><returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg></cmmMsgHeader></OpenAPI_ServiceResponse>";
  await assert.rejects(() => searchKstartup({}, ENV, mockFetch({ "apis.data.go.kr": { body: xml } })), /SERVICE_KEY_IS_NOT_REGISTERED_ERROR/);
});

test("gov24: cond LIKE 파라미터, 사용자구분 필터", async () => {
  const calls = [];
  const r = await searchGov24({ keyword: "소상공인", userType: "소상공인" }, ENV, mockFetch({ "api.odcloud.kr": { body: gov24Body } }, calls));
  assert.equal(r.items.length, 1);
  assert.equal(r.items[0].id, "000000465790");
  assert.match(decodeURIComponent(calls[0]), /cond\[서비스명::LIKE\]=소상공인/);
});

test("gov24 상세: cond EQ, 전체 필드", async () => {
  const calls = [];
  const d = await getGov24Detail("000000465790", ENV, mockFetch({ "api.odcloud.kr": { body: { data: [{ ...gov24Body.data[0], 구비서류: "신분증" }] } } }, calls));
  assert.equal(d.documents, "신분증");
  assert.match(decodeURIComponent(calls[0]), /serviceDetail\?.*cond\[서비스ID::EQ\]=000000465790/);
});

test("searchAll: 한 소스 실패해도 나머지 반환, complete=false", async () => {
  const f = mockFetch({
    "www.bizinfo.go.kr": { status: 500, body: "err" },
    "apis.data.go.kr": { body: kstartupBody },
    "api.odcloud.kr": { body: gov24Body },
  });
  const r = await searchAll({}, ENV, f);
  assert.equal(r.complete, false);
  assert.equal(r.sources.bizinfo.ok, false);
  assert.equal(r.sources.kstartup.ok, true);
  assert.ok(r.items.length >= 3);
  // 마감 임박순: 2099-01-01 이 2099-03-01 보다 앞
  const ends = r.items.map((i) => i.applyEnd).filter(Boolean);
  assert.deepEqual(ends, [...ends].sort());
});

test("http: 허용되지 않은 호스트 차단, 리다이렉트 차단, 오류에서 키 마스킹", async () => {
  await assert.rejects(() => getJson("t", "https://evil.example.com/x", { retries: 0 }), /허용되지 않은 호스트/);
  await assert.rejects(
    () => getJson("t", "https://api.odcloud.kr/x", { retries: 0, fetchImpl: async () => ({ status: 302, ok: false, text: async () => "" }) }),
    /리다이렉트/,
  );
  await assert.rejects(
    () =>
      getJson("t", "https://api.odcloud.kr/x", {
        secret: KEY,
        retries: 0,
        fetchImpl: async () => {
          throw new Error(`failed https://api.odcloud.kr/x?serviceKey=${encodeURIComponent(KEY)}`);
        },
      }),
    (err) => !err.message.includes(KEY) && !err.message.includes(encodeURIComponent(KEY)),
  );
  assert.equal(redact(`k=${KEY}`, KEY), "k=***");
  assert.equal(encodeServiceKey("a%2Bb"), "a%2Bb");
  assert.equal(encodeServiceKey("a+b"), "a%2Bb");
});

test("normalize: 기간 분리·상태·지역", () => {
  assert.deepEqual(splitPeriod("2026.01.02 ~ 2026.1.31"), { start: "2026-01-02", end: "2026-01-31" });
  assert.deepEqual(splitPeriod("예산 소진시까지"), { start: "", end: "" });
  assert.equal(deadlineStatus({ applyEnd: "2026-01-01" }, "2026-02-01"), "closed");
  assert.equal(deadlineStatus({ applyStart: "", applyEnd: "" }, "2026-02-01"), "unknown");
  assert.ok(matchesRegion("서울,경기", "서울특별시"));
  assert.ok(!matchesRegion("부산", "서울"));
});
