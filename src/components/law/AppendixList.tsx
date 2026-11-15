import type { LawAppendix } from "@/lib/lawGoKr";

/** 별표·서식 목록. 원문 파일은 국가법령정보센터에서 내려받는다. */
export default function AppendixList({ groups, emptyText }: { groups: { source: string; items: LawAppendix[] }[]; emptyText: string }) {
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  if (total === 0) {
    return <p className="rounded-xl border border-gray-200 p-10 text-center text-gray-500">{emptyText}</p>;
  }
  return (
    <div className="space-y-10">
      {groups
        .filter((g) => g.items.length > 0)
        .map((g) => (
          <section key={g.source}>
            <h2 className="mb-3 text-lg font-bold text-gray-900">
              {g.source} <span className="text-sm font-normal text-gray-400">{g.items.length}건</span>
            </h2>
            <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
              {g.items.map((a) => {
                const deleted = /^삭제/.test(a.title);
                return (
                  <li key={a.key} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className={`min-w-0 ${deleted ? "text-gray-400" : ""}`}>
                      <span className="mr-2 text-xs font-medium text-gray-500">{a.label}</span>
                      <span className="text-sm text-gray-800">{a.title}</span>
                    </div>
                    {!deleted && (
                      <div className="flex shrink-0 gap-2">
                        {a.pdfUrl && <FileLink href={a.pdfUrl} label="PDF" />}
                        {a.fileUrl && <FileLink href={a.fileUrl} label="HWP" />}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
    </div>
  );
}

function FileLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-blue-300 hover:text-blue-700"
    >
      {label}
    </a>
  );
}
