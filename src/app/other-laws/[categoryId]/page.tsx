import Link from "next/link";
import { notFound } from "next/navigation";
import { otherLawCategories } from "@/lib/menuData";

export function generateStaticParams() {
  return otherLawCategories.map((cat) => ({ categoryId: cat.id }));
}

export default async function OtherLawCategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  const category = otherLawCategories.find((c) => c.id === categoryId);
  if (!category) notFound();

  const currentIndex = otherLawCategories.findIndex((c) => c.id === categoryId);
  const relatedCategories = otherLawCategories.filter((c) => c.id !== categoryId);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/other-laws" className="hover:text-blue-600">
          기타법
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{category.label}</span>
      </nav>

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {category.label}
        </h1>
        <p className="text-gray-500">
          {category.label} 분야의 관련 법령 {category.laws.length}개를
          조회하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
        {category.laws.map((law) => (
          <Link
            key={law.id}
            href={`/other-laws/${category.id}/${law.id}`}
            className="group flex items-center gap-4 p-5 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                {law.label}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                법령 · 시행령 · 시행규칙
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="border-t border-gray-100 pt-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          다른 법령 카테고리
        </h2>
        <div className="flex flex-wrap gap-2">
          {relatedCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/other-laws/${cat.id}`}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-700 transition-colors"
            >
              {cat.label}
              <span className="text-gray-400 ml-1">({cat.laws.length})</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
