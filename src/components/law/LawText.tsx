import Link from "next/link";
import type { LawArticle, LawDocument, LawHeading } from "@/lib/lawGoKr";
import type { RuleRef } from "@/lib/taxRules";

const HEADING_CLS = [
  "text-xl font-bold text-gray-900", // 편
  "text-lg font-bold text-blue-900", // 장
  "text-base font-semibold text-gray-800", // 절
  "text-sm font-semibold text-gray-700", // 관
];

const LINE_INDENT = ["", "pl-5", "pl-10"];

/** 법령 본문: 왼쪽 목차(장·조), 오른쪽 조문. 조문마다 #a{번호} 앵커가 있다. */
export default function LawText({
  doc,
  rulesByArticle,
  rulesPath,
}: {
  doc: LawDocument;
  /** 법 조문 앵커 → 관련 기본통칙 (법률 페이지에서만) */
  rulesByArticle?: Record<string, RuleRef[]>;
  rulesPath?: string;
}) {
  const articles = doc.items.filter((i): i is LawArticle => i.kind === "article");
  return (
    <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-10">
      <aside className="mb-6 lg:mb-0">
        <details className="lg:hidden rounded-lg border border-gray-200 bg-gray-50">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-700">목차 ({articles.length}개 조문)</summary>
          <div className="max-h-80 overflow-y-auto px-4 pb-4">
            <Toc items={doc.items} />
          </div>
        </details>
        <nav aria-label="조문 목차" className="hidden lg:block sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
          <p className="text-xs font-semibold text-gray-400 mb-2">목차 · {articles.length}개 조문</p>
          <Toc items={doc.items} />
        </nav>
      </aside>

      <article className="min-w-0">
        {doc.items.map((item) =>
          item.kind === "heading" ? (
            <Heading key={item.key} item={item} />
          ) : (
            <Article key={item.key} item={item} rules={rulesByArticle?.[item.anchor]} rulesPath={rulesPath} />
          ),
        )}
      </article>
    </div>
  );
}

function Toc({ items }: { items: (LawHeading | LawArticle)[] }) {
  return (
    <ul className="space-y-0.5 text-sm">
      {items.map((item) =>
        item.kind === "heading" ? (
          <li key={item.key} className={`pt-3 pb-1 font-semibold text-gray-800 ${item.level >= 2 ? "pl-2 text-xs text-gray-600" : ""}`}>
            {stripAmendNote(item.text)}
          </li>
        ) : item.deleted ? null : (
          <li key={item.key}>
            <a href={`#${item.anchor}`} className="block truncate rounded px-2 py-1 text-gray-600 hover:bg-blue-50 hover:text-blue-700">
              <span className="text-gray-400 mr-1">{item.label}</span>
              {item.title}
            </a>
          </li>
        ),
      )}
    </ul>
  );
}

function Heading({ item }: { item: LawHeading }) {
  return <h2 className={`${HEADING_CLS[item.level] ?? HEADING_CLS[1]} mt-10 mb-4 first:mt-0`}>{item.text}</h2>;
}

function Article({ item, rules, rulesPath }: { item: LawArticle; rules?: RuleRef[]; rulesPath?: string }) {
  if (item.deleted) {
    return (
      <section id={item.anchor} className="scroll-mt-28 py-2 text-sm text-gray-400">
        {item.lines[0]?.text ?? `${item.label} 삭제`}
      </section>
    );
  }
  return (
    <section id={item.anchor} className="scroll-mt-28 border-b border-gray-100 py-5">
      <h3 className="mb-2 font-semibold text-gray-900">
        <a href={`#${item.anchor}`} className="hover:text-blue-700">
          {item.label}
          {item.title && <span className="ml-1">({item.title})</span>}
        </a>
      </h3>
      <div className="space-y-1.5 text-[15px] leading-relaxed text-gray-700">
        {item.lines.map((line, i) => (
          <p key={i} className={`whitespace-pre-line ${LINE_INDENT[line.depth] ?? ""}`}>
            {/* 첫 줄의 "제n조(제목)" 머리말은 위 제목과 겹치므로 뺀다 */}
            {i === 0 ? stripArticleHead(line.text) : line.text}
          </p>
        ))}
      </div>
      {item.note && <p className="mt-2 text-xs text-gray-400">{item.note}</p>}
      {rules && rules.length > 0 && rulesPath && (
        <details className="mt-3 rounded-lg bg-blue-50/60 px-3 py-2 text-sm">
          <summary className="cursor-pointer text-blue-800">관련 기본통칙 {rules.length}개</summary>
          <ul className="mt-2 space-y-1">
            {rules.map((r) => (
              <li key={r.anchor}>
                <Link href={`${rulesPath}#${r.anchor}`} className="text-gray-700 hover:text-blue-700">
                  <span className="mr-2 text-blue-700">{r.no}</span>
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function stripArticleHead(text: string): string {
  return text.replace(/^제\d+조(?:의\d+)?\s*(?:\([^)]*\))?\s*/, "");
}

function stripAmendNote(text: string): string {
  return text.replace(/\s*<[^>]*>\s*$/, "");
}
