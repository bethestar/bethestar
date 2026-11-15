// 2026-11 실제 API 호출에서 확인한 응답 형태로 만든 고정 데이터 테스트.
// (값은 실제 응답에서 일부만 남기고 줄였다. API 키는 포함하지 않는다.)
import { test } from "node:test";
import assert from "node:assert/strict";
import { searchBizinfo } from "../src/sources/bizinfo.mjs";
import { searchKstartup } from "../src/sources/kstartup.mjs";
import { searchGov24 } from "../src/sources/gov24.mjs";

const respond = (body, status = 200) => async () => ({
  status,
  ok: status < 300,
  text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
});

// 기업마당: dataType=json 요청 시 JSON (필드명은 실제 결과로 확인)
const BIZINFO_LIVE = {
  jsonArray: [
    {
      pblancId: "PBLN_000000000127928",
      pblancNm: "[전남광주] 보성군 2027년 청년어촌정착 지원사업 신청 공고",
      bsnsSumryCn: "<p>2027년도 청년어촌정착 지원사업 신청을 다음과 같이 공고하니...</p>",
      pldirSportRealmLclasCodeNm: "창업",
      jrsdInsttNm: "전남광주통합특별시",
      excInsttNm: "기초자치단체",
      trgetNm: "창업벤처",
      hashtags: "창업,전남광주,2026,전남광주통합특별시,기초자치단체,보성군,청년",
      reqstBeginEndDe: "20261112 ~ 20261204",
      creatPnttm: "2026-11-13 10:00:00",
    },
  ],
};

// K-Startup getAnnouncementInformation01 실제 응답 형태
const KSTARTUP_LIVE = {
  currentCount: 1,
  matchCount: 30590,
  page: 1,
  perPage: 100,
  totalCount: 30590,
  data: [
    {
      id: 1, // 행 번호 — 공고 ID 가 아님
      pbanc_sn: 179795,
      biz_pbanc_nm: "[창업 디자이너 양성과정] 마포 디자인 크리에이터 스쿨",
      pbanc_ctnt: "창업교육을 진행하오니, 많은 관심과 지원 부탁드립니다",
      intg_pbanc_biz_nm: "마포청년창업취업지원센터 나루 2026",
      intg_pbanc_yn: "N",
      aply_trgt: "대학생,일반인,대학,연구기관,일반기업,1인 창조기업",
      aply_trgt_ctnt: "예비 및 신입 청년 디자이너",
      biz_enyy: "예비창업자,1년미만,2년미만,3년미만",
      biz_trgt_age: "만 20세 이상 ~ 만 39세 이하",
      biz_prch_dprt_nm: "취창업지원",
      pbanc_ntrp_nm: "마포청년창업취업지원센터 나루",
      sprv_inst: "공공기관",
      supt_biz_clsfc: "창업교육",
      supt_regin: "전국",
      pbanc_rcpt_bgng_dt: "20261111",
      pbanc_rcpt_end_dt: "20261120",
      rcrt_prgs_yn: "Y",
      prch_cnpl_no: "0262611939",
      detl_pg_url: "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=179795",
      biz_aply_url: null,
      prfn_matr: null,
    },
  ],
};

test("기업마당 실제 형태: 필드 매핑", async () => {
  const r = await searchBizinfo({ openOnly: false }, { BIZINFO_API_KEY: "k" }, respond(BIZINFO_LIVE));
  assert.equal(r.format, "json");
  const i = r.items[0];
  assert.equal(i.id, "PBLN_000000000127928");
  assert.equal(i.category, "창업");
  assert.equal(i.organization, "전남광주통합특별시");
  assert.equal(i.target, "창업벤처");
  assert.equal(i.applyPeriodText, "2026-11-12 ~ 2026-12-04");
  assert.equal(i.registeredAt, "2026-11-13");
  assert.ok(!i.summary.includes("<p>"));
  assert.equal(i.url, "https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000127928");
});

test("기업마당: 잘못된 키는 HTTP 200 + reqErr → 인증 오류 안내", async () => {
  await assert.rejects(
    () => searchBizinfo({}, { BIZINFO_API_KEY: "bad" }, respond({ reqErr: "존재하지 않는 인증키 입니다." })),
    (err) => err.name === "AuthError" && /인증키 오류: 존재하지 않는 인증키 입니다/.test(err.message) && /BIZINFO_API_KEY/.test(err.message),
  );
});

test("K-Startup 실제 형태: 행 번호(id)가 아닌 pbanc_sn 을 ID 로, 연락처 포함", async () => {
  const r = await searchKstartup({}, { DATA_GO_KR_API_KEY: "k" }, respond(KSTARTUP_LIVE));
  assert.equal(r.totalCount, 30590);
  const i = r.items[0];
  assert.equal(i.id, "179795");
  assert.equal(i.organization, "마포청년창업취업지원센터 나루");
  assert.equal(i.target, "대학생,일반인,대학,연구기관,일반기업,1인 창조기업 / 예비 및 신입 청년 디자이너");
  assert.equal(i.businessAge, "예비창업자,1년미만,2년미만,3년미만");
  assert.equal(i.applyPeriodText, "2026-11-11 ~ 2026-11-20");
  assert.equal(i.contact, "0262611939");
  assert.match(i.url, /pbancSn=179795/);
});

test("보조금24: 활용신청 안 된 키는 HTTP 401 + code -4 → 서버 메시지 표시", async () => {
  await assert.rejects(
    () =>
      searchGov24({}, { DATA_GO_KR_API_KEY: "k" }, respond({ code: -4, msg: "등록되지 않은 인증키 입니다." }, 401)),
    (err) => err.name === "AuthError" && /등록되지 않은 인증키 입니다/.test(err.message) && /활용신청/.test(err.message),
  );
});

test("보조금24: HTTP 200 + code -4 도 인증 오류로", async () => {
  await assert.rejects(
    () => searchGov24({}, { DATA_GO_KR_API_KEY: "k" }, respond({ code: -4, msg: "등록되지 않은 인증키 입니다." })),
    (err) => err.name === "AuthError",
  );
});

// 보조금24 serviceList / serviceDetail 실제 응답 형태 (2026-11 확인, 값은 줄임)
const GOV24_LIST_LIVE = {
  currentCount: 1,
  matchCount: 10942,
  page: 1,
  perPage: 100,
  totalCount: 10942,
  data: [
    {
      서비스ID: "105100000001",
      서비스명: "근로·자녀장려금",
      서비스목적요약: "소득과 재산이 적은 근로소득자에게 근로장려금을 지급",
      서비스분야: "주거·자립",
      사용자구분: "가구",
      소관기관명: "국세청",
      부서명: "장려세제과",
      접수기관: "관할 세무서",
      지원유형: "현금",
      신청기한: "○ 정기신청 : 5.1.~5.31.",
      전화문의: "해당지역 지자체(세무서)/관할 세무서",
      상세조회URL: "https://plus.gov.kr/portal/benefitV2/benefitTotalSrvcList/benefitSrvcDtl?svcSeq=556551&bnefType=all&svcId=105100000001",
      등록일시: "20201217142613",
      수정일시: "20260430093900",
    },
  ],
};

const GOV24_DETAIL_LIVE = {
  data: [
    {
      서비스ID: "105100000001",
      서비스명: "근로·자녀장려금",
      서비스목적: "○ 근로장려세제 - 저소득계층의 빈곤 탈출을 지원",
      소관기관명: "국세청",
      접수기관명: "관할 세무서",
      지원유형: "현금",
      문의처: "국세상담센터 / 126",
      구비서류: "○ 소득재산 등 증거자료",
      온라인신청사이트URL: "https://www.hometax.go.kr",
      법령: "조세특례제한법(제100조의10, 제0항)",
      수정일시: "20260430093900",
    },
  ],
};

test("보조금24 목록 실제 형태: 상세조회URL·사용자구분·분야", async () => {
  const calls = [];
  const f = async (url) => {
    calls.push(url);
    return respond(GOV24_LIST_LIVE)();
  };
  const r = await searchGov24({ keyword: "장려금" }, { DATA_GO_KR_API_KEY: "k" }, f);
  assert.equal(r.totalCount, 10942);
  const i = r.items[0];
  assert.equal(i.id, "105100000001");
  assert.equal(i.userType, "가구");
  assert.equal(i.category, "주거·자립");
  assert.equal(i.receivingOrg, "관할 세무서");
  assert.equal(i.registeredAt, "2026-04-30");
  assert.match(i.url, /^https:\/\/plus\.gov\.kr\/.*svcId=105100000001/);
});

test("보조금24 상세 실제 형태: 문의처, 안내 페이지 URL(신청 사이트와 분리)", async () => {
  const { getGov24Detail } = await import("../src/sources/gov24.mjs");
  const d = await getGov24Detail("105100000001", { DATA_GO_KR_API_KEY: "k" }, respond(GOV24_DETAIL_LIVE));
  assert.equal(d.contact, "국세상담센터 / 126");
  assert.equal(d.onlineApplyUrl, "https://www.hometax.go.kr");
  assert.match(d.url, /^https:\/\/plus\.gov\.kr\/.*svcId=105100000001/);
  assert.equal(d.documents, "○ 소득재산 등 증거자료");
});
