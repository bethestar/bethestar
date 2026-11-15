import Link from "next/link";
import type { CaseList as CaseListData } from "@/lib/lawGoKr";

/** 판례 목록 + 페이지 이동. 상세는 /tax/[lawId]/rulings/[caseId]. */
export default function CaseList({ data, basePath }: { data: CaseListData; basePath: string }) {
  const lastPage = Math.max(1, Math.ceil(data.total / data.perPage));
  if (data.items.length === 0) {
    return <p className="rounded-xl border border-gray-200 p-10 text-center text-gray-500">관련 판례를 찾지 못했어요.</p>;
  }
  return (
    <div>
      <p className="mb-3 text-sm text-gray-500">총 {data.total.toLocaleString()}건 · 최신순</p>
      <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
        {data.items.map((c) => {
          const meta = (
            <>
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="font-medium text-gray-700">{c.court}</span>
                <span>{c.caseNo}</span>
                {c.date && <span>· {c.date}</span>}
                {c.kind && <span className="rounded bg-gray-100 px-1.5 py-0.5">{c.kind}</span>}
                {!c.hasDetail && <span className="text-gray-400">국가법령정보센터에서 열림 ↗</span>}
              </div>
              <div className="text-sm text-gray-900 line-clamp-2">{c.name}</div>
            </>
          );
          return (
            <li key={c.id}>
              {c.hasDetail ? (
                <Link href={`${basePath}/${c.id}`} className="block px-4 py-3 hover:bg-blue-50/50">
                  {meta}
                </Link>
              ) : (
                // 본문을 API 로 받을 수 없는 판례는 국가법령정보센터 공개 페이지로 바로 연결
                <a href={c.publicUrl} target="_blank" rel="noopener noreferrer" className="block px-4 py-3 hover:bg-blue-50/50">
                  {meta}
                </a>
              )}
            </li>
          );
        })}
      </ul>
      {lastPage > 1 && (
        <nav aria-label="페이지" className="mt-6 flex items-center justify-center gap-2 text-sm">
          {data.page > 1 && (
            <Link href={`${basePath}?page=${data.page - 1}`} className="rounded-lg border border-gray-200 px-3 py-1.5 hover:border-blue-300">
              &larr; 이전
            </Link>
          )}
          <span className="px-2 text-gray-500">
            {data.page} / {lastPage.toLocaleString()}
          </span>
          {data.page < lastPage && (
            <Link href={`${basePath}?page=${data.page + 1}`} className="rounded-lg border border-gray-200 px-3 py-1.5 hover:border-blue-300">
              다음 &rarr;
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
