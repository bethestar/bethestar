import Link from "next/link";
import { notFound } from "next/navigation";
import { taxLaws } from "@/lib/menuData";

export function generateStaticParams() {
  return taxLaws.map((law) => ({ lawId: law.id }));
}

export default async function TaxLawPage({
  params,
}: {
  params: Promise<{ lawId: string }>;
}) {
  const { lawId } = await params;
  const law = taxLaws.find((l) => l.id === lawId);
  if (!law) notFound();

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/tax" className="hover:text-blue-600">세무</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{law.label}</span>
      </nav>

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{law.label}</h1>
        <p className="text-gray-500">
          {law.label}의 법령 체계를 아래에서 선택하여 조회하세요.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {law.sections.map((section) => (
          <Link
            key={section.id}
            href={`/tax/${law.id}/${section.id}`}
            className="p-6 rounded-xl border border-gray-200 text-center hover:border-blue-300 hover:shadow-lg transition-all group"
          >
            <div className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
              {section.label}
            </div>
            <div className="text-xs text-gray-400 mt-2">
              {law.shortLabel || law.label} {section.label}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
