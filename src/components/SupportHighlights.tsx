import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import SupportCard from "@/components/SupportCard";
import { configuredSources, searchSupportPrograms, SOURCE_INFO, SUPPORT_SOURCES } from "@/lib/govSupport";

const MAX_ITEMS = 6;

/** 홈 화면 "정부지원사업" 섹션: 마감 임박 공고를 보여 주고 /support 로 안내한다. */
export default function SupportHighlights() {
  return (
    <section className="py-16 sm:py-20 bg-blue-50/60">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">정부지원사업</h2>
            <p className="text-gray-500 text-lg">
              기업마당·K-Startup·보조금24의 지원사업 중 마감이 가까운 공고예요.
            </p>
          </div>
          <Link
            href="/support"
            className="inline-flex items-center gap-1 self-start sm:self-auto px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            전체 지원사업 검색 &rarr;
          </Link>
        </div>

        <Suspense fallback={<HighlightsSkeleton />}>
          <Highlights />
        </Suspense>
      </div>
    </section>
  );
}

async function Highlights() {
  // 빌드 시점이 아니라 요청이 올 때 키를 확인하고 조회한다 (응답은 1시간 캐시).
  // 키 확인보다 먼저 호출해야 빌드 환경에 키가 없을 때 "키 없음" 화면이 정적으로 굳지 않는다.
  await connection();

  const configured = configuredSources();
  // 마감일이 있는 공고 출처만 (보조금24는 대부분 상시 신청)
  const sources = SUPPORT_SOURCES.filter((s) => s !== "gov24" && configured[s]);
  if (sources.length === 0) return <PortalLinks />;

  let items;
  try {
    const result = await searchSupportPrograms({ sources });
    items = result.items.filter((i) => i.status === "open" && i.applyEnd).slice(0, MAX_ITEMS);
  } catch {
    return <PortalLinks />;
  }
  if (items.length === 0) return <PortalLinks />;

  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        // 휴대폰에서는 3개만 보여 주고, 태블릿 이상에서 6개
        <SupportCard key={`${item.source}-${item.id}-${item.title}`} item={item} hideOnMobile={i >= 3} />
      ))}
    </ul>
  );
}

/** 키가 없거나 조회에 실패했을 때: 섹션을 깨뜨리지 않고 바로가기만 보여 준다. */
function PortalLinks() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {SUPPORT_SOURCES.map((s) => (
        <Link
          key={s}
          href={`/support?source=${s}`}
          className="group rounded-xl bg-white border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="text-lg font-bold text-gray-900 group-hover:text-blue-700">{SOURCE_INFO[s].label}</div>
          <div className="text-sm text-gray-500 mt-1">{SOURCE_INFO[s].description}</div>
          <div className="mt-4 text-sm font-medium text-blue-600">공고 보기 &rarr;</div>
        </Link>
      ))}
    </div>
  );
}

function HighlightsSkeleton() {
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="지원사업 공고를 불러오는 중">
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i} className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse">
          <div className="h-3 w-24 bg-gray-200 rounded mb-3" />
          <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-full bg-gray-100 rounded mb-1" />
          <div className="h-3 w-2/3 bg-gray-100 rounded" />
        </li>
      ))}
    </ul>
  );
}
