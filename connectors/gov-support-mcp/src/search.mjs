// 여러 소스를 동시에 조회해 하나의 결과로 합친다. 한 소스가 실패해도 나머지는 반환한다.

import { searchBizinfo } from "./sources/bizinfo.mjs";
import { searchKstartup } from "./sources/kstartup.mjs";
import { searchGov24 } from "./sources/gov24.mjs";

export const SOURCES = ["bizinfo", "kstartup", "gov24"];

export async function searchAll(opts = {}, env = process.env, fetchImpl) {
  const sources = (opts.sources?.length ? opts.sources : SOURCES).filter((s) => SOURCES.includes(s));
  const perSource = opts.limitPerSource ?? 10;
  const runners = {
    bizinfo: () =>
      searchBizinfo({ keyword: opts.keyword, region: opts.region, category: opts.bizinfoCategory, openOnly: opts.openOnly ?? true, limit: perSource }, env, fetchImpl),
    kstartup: () =>
      searchKstartup({ keyword: opts.keyword, region: opts.region, target: opts.target, openOnly: opts.openOnly ?? true, limit: perSource }, env, fetchImpl),
    gov24: () => searchGov24({ keyword: opts.keyword, userType: opts.userType, limit: perSource }, env, fetchImpl),
  };
  const settled = await Promise.allSettled(sources.map((s) => runners[s]()));
  const report = {};
  const items = [];
  settled.forEach((r, i) => {
    const s = sources[i];
    if (r.status === "fulfilled") {
      report[s] = { ok: true, fetched: r.value.fetched, matched: r.value.matched, returned: r.value.items.length };
      items.push(...r.value.items);
    } else {
      report[s] = { ok: false, error: r.reason?.message ?? String(r.reason) };
    }
  });
  // 마감 임박순 (마감일 없는 상시 공고는 뒤로)
  items.sort((a, b) => (a.applyEnd || "9999").localeCompare(b.applyEnd || "9999"));
  return { complete: Object.values(report).every((r) => r.ok), sources: report, count: items.length, items };
}
