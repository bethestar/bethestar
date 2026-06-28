import Link from "next/link";
import { notFound } from "next/navigation";
import { taxLaws } from "@/lib/menuData";

export function generateStaticParams() {
  return taxLaws.flatMap((law) =>
    law.sections.map((section) => ({
      lawId: law.id,
      subSection: section.id,
    }))
  );
}

export default async function TaxSubSectionPage({
  params,
}: {
  params: Promise<{ lawId: string; subSection: string }>;
}) {
  const { lawId, subSection } = await params;
  const law = taxLaws.find((l) => l.id === lawId);
  if (!law) notFound();
  const section = law.sections.find((s) => s.id === subSection);
  if (!section) notFound();

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/tax" className="hover:text-blue-600">세무</Link>
        <span>/</span>
        <Link href={`/tax/${law.id}`} className="hover:text-blue-600">{law.label}</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{section.label}</span>
      </nav>

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {law.label} - {section.label}
        </h1>
        <p className="text-gray-500">
          {law.label}의 {section.label} 내용을 조회합니다.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-12 text-center">
        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-500 text-lg font-medium mb-2">
          {law.label} {section.label}
        </p>
        <p className="text-gray-400 text-sm">
          콘텐츠가 준비 중입니다. 곧 업데이트됩니다.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {law.sections
          .filter((s) => s.id !== subSection)
          .map((s) => (
            <Link
              key={s.id}
              href={`/tax/${law.id}/${s.id}`}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-700 transition-colors"
            >
              {s.label}
            </Link>
          ))}
      </div>
    </div>
  );
}
