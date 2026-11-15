import Link from "next/link";
import type { TaxRule, TaxRuleDoc, TaxRuleHeading } from "@/lib/taxRules";

const HEADING_CLS = [
  "text-xl font-bold text-gray-900",
  "text-lg font-bold text-blue-900",
  "text-base font-semibold text-gray-800",
  "text-sm font-semibold text-gray-700",
];

/** 기본통칙 본문: 왼쪽 목차, 오른쪽 통칙. 통칙마다 #r{번호} 앵커와 관련 법 조문 링크가 있다. */
export default function TaxRuleText({ doc, lawPath }: { doc: TaxRuleDoc; lawPath: string }) {
  // 삭제된 통칙은 번호만 남아 있어 목록에서 뺀다.
  const items = doc.items.filter((i) => i.kind === "heading" || !i.deleted);
  const live = items.filter((i): i is TaxRule => i.kind === "rule");
  const deletedCount = doc.items.filter((i) => i.kind === "rule" && i.deleted).length;

  return (
    <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-10">
      <aside className="mb-6 lg:mb-0">
        <details className="lg:hidden rounded-lg border border-gray-200 bg-gray-50">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-700">목차 ({live.length}개 통칙)</summary>
          <div className="max-h-80 overflow-y-auto px-4 pb-4">
            <Toc items={items} />
          </div>
        </details>
        <nav aria-label="통칙 목차" className="hidden lg:block sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
          <p className="text-xs font-semibold text-gray-400 mb-2">목차 · {live.length}개 통칙</p>
          <Toc items={items} />
        </nav>
      </aside>

      <article className="min-w-0">
        <div className="mb-8 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{doc.title}</span>
          <span className="ml-3">현행 {live.length}개{deletedCount > 0 && ` (삭제된 통칙 ${deletedCount}개는 숨김)`}</span>
          <p className="mt-1 text-xs text-gray-500">
            국세청 국세법령정보시스템에서 내려받은 {doc.year}년 기본통칙 PDF를 바탕으로 만들었어요. 그 뒤의 개정은 반영되지 않았을 수 있으니, 실무 적용 전에{" "}
            <a href="https://taxlaw.nts.go.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              국세법령정보시스템
            </a>
            에서 최신 내용을 확인하세요.
          </p>
        </div>
        {items.map((item, i) =>
          item.kind === "heading" ? <Heading key={`h${i}`} item={item} /> : <Rule key={item.anchor} item={item} lawPath={lawPath} />,
        )}
      </article>
    </div>
  );
}

function Toc({ items }: { items: (TaxRuleHeading | TaxRule)[] }) {
  return (
    <ul className="space-y-0.5 text-sm">
      {items.map((item, i) =>
        item.kind === "heading" ? (
          <li key={`h${i}`} className={`pt-3 pb-1 font-semibold text-gray-800 ${item.level >= 2 ? "pl-2 text-xs text-gray-600" : ""}`}>
            {item.text}
          </li>
        ) : (
          <li key={item.anchor}>
            <a href={`#${item.anchor}`} className="block truncate rounded px-2 py-1 text-gray-600 hover:bg-blue-50 hover:text-blue-700">
              <span className="text-gray-400 mr-1">{item.no}</span>
              {item.title}
            </a>
          </li>
        ),
      )}
    </ul>
  );
}

function Heading({ item }: { item: TaxRuleHeading }) {
  return <h2 className={`${HEADING_CLS[item.level] ?? HEADING_CLS[1]} mt-10 mb-4 first:mt-0`}>{item.text}</h2>;
}

function Rule({ item, lawPath }: { item: TaxRule; lawPath: string }) {
  const lawArticleLabel = `제${item.lawArticle}조`;
  return (
    <section id={item.anchor} className="scroll-mt-28 border-b border-gray-100 py-5">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-semibold text-gray-900">
          <a href={`#${item.anchor}`} className="hover:text-blue-700">
            <span className="mr-2 text-blue-700">{item.no}</span>
            {item.title}
          </a>
        </h3>
        <Link href={`${lawPath}#${item.lawAnchor}`} className="shrink-0 text-xs text-gray-500 hover:text-blue-700">
          관련 법 {lawArticleLabel} &rarr;
        </Link>
      </div>
      <div className="space-y-1.5 text-[15px] leading-relaxed text-gray-700">
        {item.paragraphs.map((p, i) => (
          <p key={i} className={/^\d+(?:의\d+)?\.\s|^[가-힣]\.\s|^\(\d+\)/.test(p) ? "pl-5" : ""}>
            {renderParagraph(p)}
          </p>
        ))}
      </div>
    </section>
  );
}

/** "<개정 2024.03.15.>" 같은 개정 이력은 작게 표시한다. */
function renderParagraph(text: string) {
  const parts = text.split(/(<[^<>]*\d{4}[^<>]*>)/);
  return parts.map((part, i) =>
    /^<[^<>]*\d{4}[^<>]*>$/.test(part) ? (
      <span key={i} className="text-xs text-gray-400">
        {part}
      </span>
    ) : (
      part
    ),
  );
}
