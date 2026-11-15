#!/usr/bin/env node
// MCP 없이 터미널·스킬에서 바로 쓰는 CLI.
//   node src/cli.mjs all --keyword "세무" --region 서울
//   node src/cli.mjs kstartup --target 예비창업자 --limit 5
//   node src/cli.mjs bizinfo --category 창업
//   node src/cli.mjs gov24 --keyword 소상공인 --user-type 소상공인
//   node src/cli.mjs gov24-detail <서비스ID>
// 출력: JSON (stdout). --text 를 주면 사람이 읽기 쉬운 목록.

import { parseArgs } from "node:util";
import { searchBizinfo } from "./sources/bizinfo.mjs";
import { searchKstartup } from "./sources/kstartup.mjs";
import { searchGov24, getGov24Detail } from "./sources/gov24.mjs";
import { searchAll } from "./search.mjs";

const USAGE = `사용법: gov-support <all|bizinfo|kstartup|gov24|gov24-detail> [옵션]
  --keyword <검색어>     --region <지역>        --target <신청대상>
  --user-type <구분>     --category <분야>      --business-age <업력>
  --organization <기관>  --sources a,b          --limit <n>
  --include-closed       --text                 --help
환경변수: BIZINFO_API_KEY, DATA_GO_KR_API_KEY`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    keyword: { type: "string" },
    region: { type: "string" },
    target: { type: "string" },
    "user-type": { type: "string" },
    category: { type: "string" },
    "business-age": { type: "string" },
    organization: { type: "string" },
    sources: { type: "string" },
    limit: { type: "string" },
    "include-closed": { type: "boolean", default: false },
    text: { type: "boolean", default: false },
    help: { type: "boolean", default: false },
  },
});

const [cmd, arg] = positionals;
if (values.help || !cmd) {
  console.log(USAGE);
  process.exit(values.help ? 0 : 1);
}

const limit = values.limit ? Number(values.limit) : undefined;
const openOnly = !values["include-closed"];

const commands = {
  all: () =>
    searchAll({
      keyword: values.keyword,
      region: values.region,
      target: values.target,
      userType: values["user-type"],
      sources: values.sources?.split(",").map((s) => s.trim()),
      openOnly,
      limitPerSource: limit,
    }),
  bizinfo: () => searchBizinfo({ keyword: values.keyword, region: values.region, category: values.category, openOnly, limit }),
  kstartup: () =>
    searchKstartup({
      keyword: values.keyword,
      region: values.region,
      target: values.target,
      businessAge: values["business-age"],
      category: values.category,
      openOnly,
      limit,
    }),
  gov24: () =>
    searchGov24({ keyword: values.keyword, userType: values["user-type"], category: values.category, organization: values.organization, limit }),
  "gov24-detail": () => getGov24Detail(arg),
};

if (!commands[cmd]) {
  console.error(`알 수 없는 명령: ${cmd}\n${USAGE}`);
  process.exit(1);
}

try {
  const result = await commands[cmd]();
  if (!values.text) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printText(result);
  }
  process.exit(result?.complete === false ? 2 : 0);
} catch (err) {
  console.error(err?.message ?? String(err));
  process.exit(1);
}

function printText(result) {
  if (result.sources) {
    for (const [s, r] of Object.entries(result.sources)) {
      console.log(r.ok ? `✔ ${s}: ${r.returned}건 (조건 일치 ${r.matched})` : `✘ ${s}: ${r.error}`);
    }
    console.log("");
  }
  const items = result.items ?? [result];
  items.forEach((i, n) => {
    console.log(`${n + 1}. [${i.sourceName}] ${i.title}`);
    if (i.organization) console.log(`   기관: ${i.organization}${i.executor ? ` / ${i.executor}` : ""}`);
    if (i.applyPeriodText) console.log(`   기간: ${i.applyPeriodText} (${i.status})`);
    if (i.target) console.log(`   대상: ${i.target}`);
    if (i.url) console.log(`   링크: ${i.url}`);
  });
}
