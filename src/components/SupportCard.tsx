import type { SupportItem } from "@/lib/govSupport";

// 지원사업 공고 카드 — /support 페이지와 홈 화면에서 함께 쓴다.

const STATUS_LABEL: Record<SupportItem["status"], { text: string; cls: string }> = {
  open: { text: "모집중", cls: "bg-blue-50 text-blue-700" },
  upcoming: { text: "접수예정", cls: "bg-purple-50 text-purple-700" },
  closed: { text: "마감", cls: "bg-gray-100 text-gray-500" },
  always: { text: "상시", cls: "bg-green-50 text-green-700" },
  unknown: { text: "기간 확인", cls: "bg-gray-100 text-gray-500" },
};

export function daysLeft(end?: string): number | null {
  if (!end) return null;
  const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  return Math.round((Date.parse(end) - Date.parse(today)) / 86400000);
}

function safeUrl(url: string): string | null {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export default function SupportCard({ item, hideOnMobile = false }: { item: SupportItem; hideOnMobile?: boolean }) {
  const status = STATUS_LABEL[item.status] ?? STATUS_LABEL.unknown;
  const left = item.status === "open" ? daysLeft(item.applyEnd) : null;
  const href = safeUrl(item.url);
  return (
    <li className={`${hideOnMobile ? "hidden md:flex" : "flex"} flex-col rounded-xl border border-gray-200 bg-white p-5 hover:border-blue-300 hover:shadow-md transition-all`}>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-gray-500">{item.sourceName}</span>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.cls}`}>{status.text}</span>
        {left !== null && left >= 0 && left <= 7 && (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-600">
            {left === 0 ? "오늘 마감" : `D-${left}`}
          </span>
        )}
        {item.category && <span className="text-xs text-gray-400">{item.category}</span>}
      </div>
      <h3 className="font-semibold text-gray-900 leading-snug mb-2">{item.title}</h3>
      {item.summary && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{item.summary}</p>}
      <dl className="mt-auto grid grid-cols-[4.5rem_1fr] gap-x-2 gap-y-1 text-xs">
        {item.organization && (
          <>
            <dt className="text-gray-400">기관</dt>
            <dd className="text-gray-700">{[item.organization, item.executor].filter(Boolean).join(" / ")}</dd>
          </>
        )}
        {item.applyPeriodText && (
          <>
            <dt className="text-gray-400">신청기간</dt>
            <dd className="text-gray-700">{item.applyPeriodText}</dd>
          </>
        )}
        {item.target && (
          <>
            <dt className="text-gray-400">대상</dt>
            <dd className="text-gray-700 line-clamp-1">{item.target}</dd>
          </>
        )}
      </dl>
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          공식 공고 보기
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )}
    </li>
  );
}
