import { test } from "node:test";
import assert from "node:assert/strict";
import { searchBizinfo, parseBizinfoBody, extractRows } from "../src/sources/bizinfo.mjs";
import { parseXmlRecords, decodeXmlText } from "../src/xml.mjs";

const ENV = { BIZINFO_API_KEY: "BIZKEY123" };
const respond = (body, status = 200) => async () => ({ status, ok: status < 300, text: async () => body });

const RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>기업마당</title>
  <item>
    <title><![CDATA[2099년 소상공인 세무 & 회계 교육]]></title>
    <link>https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?pblancId=PBLN_9</link>
    <description><![CDATA[<p>세무 &amp; 회계 교육</p>]]></description>
    <author>중소벤처기업부</author>
    <excInsttNm>소상공인시장진흥공단</excInsttNm>
    <category>경영</category>
    <reqstDt>20990101 ~ 20990131</reqstDt>
    <hashtags>서울,세무</hashtags>
    <pubDate>2026-11-01</pubDate>
    <pblancId>PBLN_9</pblancId>
  </item>
  <item>
    <title>수출 바우처 &lt;2차&gt;</title>
    <link>https://www.bizinfo.go.kr/x?pblancId=PBLN_10</link>
    <category>수출</category>
    <reqstDt>예산 소진시까지</reqstDt>
  </item>
</channel></rss>`;

test("XML(RSS) 응답: dataType=json 을 무시하고 XML 이 와도 읽는다", async () => {
  const r = await searchBizinfo({ keyword: "세무" }, ENV, respond(RSS));
  assert.equal(r.format, "xml");
  assert.equal(r.fetched, 2);
  assert.equal(r.items.length, 1);
  const i = r.items[0];
  assert.equal(i.title, "2099년 소상공인 세무 & 회계 교육");
  assert.equal(i.summary, "세무 & 회계 교육");
  assert.equal(i.organization, "중소벤처기업부");
  assert.equal(i.executor, "소상공인시장진흥공단");
  assert.equal(i.category, "경영");
  assert.equal(i.applyPeriodText, "2099-01-01 ~ 2099-01-31");
  assert.equal(i.registeredAt, "2026-11-01");
  assert.equal(i.id, "PBLN_9");
  assert.match(i.url, /^https:\/\/www\.bizinfo\.go\.kr\//);
});

test("XML: 날짜 범위가 아닌 기간은 원문 유지, 엔티티 해석", async () => {
  const r = await searchBizinfo({ category: "수출" }, ENV, respond(RSS));
  assert.equal(r.items[0].title, "수출 바우처 <2차>");
  assert.equal(r.items[0].applyPeriodText, "예산 소진시까지");
  assert.equal(r.items[0].status, "unknown");
});

test("XML 오류 응답은 메시지와 함께 실패", async () => {
  const xml = `<?xml version="1.0"?><response><reqErr>인증키가 유효하지 않습니다</reqErr></response>`;
  await assert.rejects(() => searchBizinfo({}, ENV, respond(xml)), /인증키가 유효하지 않습니다/);
});

test("공고 0건인 정상 RSS 는 빈 결과", async () => {
  const r = await searchBizinfo({}, ENV, respond(`<rss><channel><title>x</title></channel></rss>`));
  assert.equal(r.fetched, 0);
});

test("JSON 래퍼 형태 여러 가지", () => {
  const row = { pblancNm: "A" };
  assert.deepEqual(extractRows({ jsonArray: [row] }), [row]);
  assert.deepEqual(extractRows([row]), [row]);
  assert.deepEqual(extractRows({ jsonArray: { item: [row] } }), [row]);
  assert.deepEqual(extractRows({ response: { body: { items: { item: [row] } } } }), [row]);
  assert.deepEqual(extractRows({ jsonArray: row }), [row]);
  assert.deepEqual(extractRows({ whatever: [row] }), [row]);
  assert.equal(extractRows({ reqErr: "x" }), null);
});

test("JSON 오류·BOM·알 수 없는 형식", () => {
  assert.throws(() => parseBizinfoBody(`{"reqErr":"인증키 오류"}`), /인증키 오류/);
  assert.equal(parseBizinfoBody(`﻿{"jsonArray":[{"pblancNm":"A"}]}`).rows.length, 1);
  assert.throws(() => parseBizinfoBody("hello"), /알 수 없는 응답 형식/);
});

test("xml 유틸", () => {
  assert.equal(decodeXmlText("a &amp; b &#44; &#x41;"), "a & b , A");
  assert.equal(decodeXmlText("<![CDATA[<b>&amp;</b>]]>"), "<b>&amp;</b>");
  const recs = parseXmlRecords("<list><item><a>1</a><b/><a>2</a></item></list>");
  assert.deepEqual(recs, [{ a: "1,2", b: "" }]);
});
