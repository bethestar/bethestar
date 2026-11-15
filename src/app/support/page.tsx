import { Suspense } from "react";
import Form from "next/form";
import Link from "next/link";
import SupportCard from "@/components/SupportCard";
import {
  configuredSources,
  searchSupportPrograms,
  SOURCE_INFO,
  SUPPORT_SOURCES,
  type SupportQuery,
  type SupportSource,
} from "@/lib/govSupport";

export const metadata = {
  title: "정부지원사업 | 택스허브",
  description: "기업마당·K-Startup·보조금24의 정부지원사업과 보조금 정보를 한 곳에서 조회하세요.",
};

const REGIONS = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기",
  "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

const TARGETS = ["예비창업자", "일반기업", "대학생", "청소년", "일반인"];

const QUICK_KEYWORDS = ["세무", "회계", "소상공인", "청년 창업", "수출", "R&D", "고용"];

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function one(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  const t = s?.trim();
  return t ? t.slice(0, 50) : undefined;
}

function parseQuery(sp: { [key: string]: string | string[] | undefined }): SupportQuery {
  const source = one(sp.source);
  return {
    keyword: one(sp.keyword),
    region: one(sp.region),
    target: one(sp.target),
    sources: source && (SUPPORT_SOURCES as string[]).includes(source) ? [source as SupportSource] : undefined,
    includeClosed: one(sp.closed) === "1",
  };
}

export default async function SupportPage({ searchParams }: { searchParams: SearchParams }) {
  const query = parseQuery(await searchParams);
  const configured = configuredSources();
  const anyConfigured = Object.values(configured).some(Boolean);
  const resultKey = JSON.stringify(query);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">정부지원사업</h1>
        <p className="text-gray-500 text-lg">
          기업마당·K-Startup·보조금24의 지원사업과 보조금 정보를 한 번에 조회하세요.
        </p>
      </div>

      <SearchForm query={query} />

      <div className="flex flex-wrap gap-2 mt-4 mb-8">
        {QUICK_KEYWORDS.map((k) => (
          <Link
            key={k}
            href={`/support?keyword=${encodeURIComponent(k)}`}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            #{k}
          </Link>
        ))}
      </div>

      {!anyConfigured ? (
        <SetupNotice />
      ) : (
        <Suspense key={resultKey} fallback={<ResultsSkeleton />}>
          <Results query={query} />
        </Suspense>
      )}

      <Disclaimer />
    </div>
  );
}

function SearchForm({ query }: { query: SupportQuery }) {
  const inputCls =
    "w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  return (
    <Form action="/support" className="rounded-xl border border-gray-200 bg-gray-50 p-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <label className="md:col-span-4">
          <span className="block text-xs font-medium text-gray-500 mb-1">검색어</span>
          <input name="keyword" defaultValue={query.keyword} placeholder="예: 세무 교육, 청년 창업" className={inputCls} />
        </label>
        <label className="md:col-span-2">
          <span className="block text-xs font-medium text-gray-500 mb-1">지역</span>
          <select name="region" defaultValue={query.region ?? ""} className={inputCls}>
            <option value="">전체</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="md:col-span-2">
          <span className="block text-xs font-medium text-gray-500 mb-1">신청대상 (K-Startup)</span>
          <select name="target" defaultValue={query.target ?? ""} className={inputCls}>
            <option value="">전체</option>
            {TARGETS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="md:col-span-2">
          <span className="block text-xs font-medium text-gray-500 mb-1">출처</span>
          <select name="source" defaultValue={query.sources?.[0] ?? ""} className={inputCls}>
            <option value="">전체</option>
            {SUPPORT_SOURCES.map((s) => (
              <option key={s} value={s}>{SOURCE_INFO[s].label}</option>
            ))}
          </select>
        </label>
        <div className="md:col-span-2 flex items-end">
          <button
            type="submit"
            className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            검색
          </button>
        </div>
      </div>
      <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" name="closed" value="1" defaultChecked={query.includeClosed} className="rounded border-gray-300" />
        마감된 공고 포함
      </label>
    </Form>
  );
}

async function Results({ query }: { query: SupportQuery }) {
  const result = await searchSupportPrograms(query);
  const configured = configuredSources();
  const requested = query.sources?.length ? query.sources : SUPPORT_SOURCES;

  return (
    <section>
      <div className="flex flex-wrap gap-2 mb-5">
        {requested.map((s) => {
          const report = result.sources[s];
          const state = !configured[s] ? "nokey" : report?.ok ? "ok" : "error";
          return (
            <span
              key={s}
              title={state === "error" ? report?.error : state === "nokey" ? `${SOURCE_INFO[s].envName} 미설정` : undefined}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                state === "ok"
                  ? "bg-green-50 text-green-700"
                  : state === "nokey"
                    ? "bg-gray-100 text-gray-500"
                    : "bg-red-50 text-red-700"
              }`}
            >
              {SOURCE_INFO[s].label}
              {state === "ok" && ` ${report?.returned ?? 0}건`}
              {state === "nokey" && " · 키 미설정"}
              {state === "error" && " · 조회 실패"}
            </span>
          );
        })}
      </div>

      {!result.complete && result.items.length > 0 && (
        <p className="mb-4 text-sm text-amber-700 bg-amber-50 rounded-lg px-4 py-2.5">
          일부 출처를 조회하지 못했어요. 누락된 공고가 있을 수 있으니 각 포털에서도 확인해 주세요.
        </p>
      )}

      {result.items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-600 font-medium mb-1">조건에 맞는 공고가 없어요.</p>
          <p className="text-sm text-gray-400">검색어를 줄이거나 지역·대상 조건을 빼고 다시 검색해 보세요.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {result.items.map((item) => (
            <SupportCard key={`${item.source}-${item.id}-${item.title}`} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ResultsSkeleton() {
  return (
    <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2" aria-busy="true" aria-label="공고를 불러오는 중">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="rounded-xl border border-gray-200 p-5 animate-pulse">
          <div className="h-3 w-24 bg-gray-200 rounded mb-3" />
          <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-full bg-gray-100 rounded mb-1" />
          <div className="h-3 w-2/3 bg-gray-100 rounded" />
        </li>
      ))}
    </ul>
  );
}

function SetupNotice() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
      <h2 className="font-semibold text-amber-900 mb-2">API 키 설정이 필요해요</h2>
      <p className="text-sm text-amber-800 mb-4">
        서버 환경변수에 API 키를 설정하면 공고가 표시돼요. 그 전에는 아래 포털에서 직접 확인할 수 있어요.
      </p>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {SUPPORT_SOURCES.map((s) => (
          <li key={s}>
            <a
              href={SOURCE_INFO[s].portal}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg bg-white border border-amber-100 p-4 hover:border-blue-300 transition-colors"
            >
              <div className="font-medium text-gray-900">{SOURCE_INFO[s].label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{SOURCE_INFO[s].description}</div>
              <div className="text-xs text-gray-400 mt-2 font-mono">{SOURCE_INFO[s].envName}</div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Disclaimer() {
  return (
    <p className="mt-10 text-xs text-gray-400 leading-relaxed">
      이 정보는 각 기관의 공개 API에서 가져온 목록이며 최대 1시간 늦게 반영될 수 있어요. 지원 자격·마감일·제외 조건은
      반드시 공식 공고문에서 확인하세요. 택스허브는 신청을 대행하지 않아요.
    </p>
  );
}
