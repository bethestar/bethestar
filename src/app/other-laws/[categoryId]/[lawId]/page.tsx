import Link from "next/link";
import { notFound } from "next/navigation";
import { otherLawCategories } from "@/lib/menuData";

export function generateStaticParams() {
  return otherLawCategories.flatMap((cat) =>
    cat.laws.map((law) => ({
      categoryId: cat.id,
      lawId: law.id,
    }))
  );
}

export default async function OtherLawDetailPage({
  params,
}: {
  params: Promise<{ categoryId: string; lawId: string }>;
}) {
  const { categoryId, lawId } = await params;
  const category = otherLawCategories.find((c) => c.id === categoryId);
  if (!category) notFound();
  const law = category.laws.find((l) => l.id === lawId);
  if (!law) notFound();

  const otherLaws = category.laws.filter((l) => l.id !== lawId);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/other-laws" className="hover:text-blue-600">
          기타법
        </Link>
        <span>/</span>
        <Link
          href={`/other-laws/${category.id}`}
          className="hover:text-blue-600"
        >
          {category.label}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{law.label}</span>
      </nav>

      <div className="mb-10">
        <div className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium mb-3">
          {category.label}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{law.label}</h1>
        <p className="text-gray-500">
          {law.label}의 법령 내용을 조회합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {["법령 원문", "시행령", "시행규칙"].map((section) => (
          <div
            key={section}
            className="p-6 rounded-xl border border-gray-200 text-center hover:border-blue-300 hover:shadow-lg transition-all group cursor-pointer"
          >
            <svg
              className="w-8 h-8 mx-auto text-gray-300 group-hover:text-blue-500 mb-3 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div className="text-sm font-semibold text-gray-700 group-hover:text-blue-700 transition-colors">
              {section}
            </div>
            <div className="text-xs text-gray-400 mt-1">준비 중</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-12 text-center mb-10">
        <svg
          className="w-16 h-16 mx-auto text-gray-300 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
        <p className="text-gray-500 text-lg font-medium mb-2">{law.label}</p>
        <p className="text-gray-400 text-sm">
          법령 콘텐츠가 준비 중입니다. 곧 업데이트됩니다.
        </p>
      </div>

      {otherLaws.length > 0 && (
        <div className="border-t border-gray-100 pt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {category.label}의 다른 법령
          </h2>
          <div className="flex flex-wrap gap-2">
            {otherLaws.map((l) => (
              <Link
                key={l.id}
                href={`/other-laws/${category.id}/${l.id}`}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-700 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
