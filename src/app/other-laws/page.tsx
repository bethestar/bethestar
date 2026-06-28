import Link from "next/link";
import { otherLawCategories } from "@/lib/menuData";

export const metadata = {
  title: "기타법 | 택스허브",
  description: "세법과 관련된 민사법, 상사법, 부동산법, 행정법, 금융법 등 관련 법령",
};

export default function OtherLawsPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">기타법</h1>
        <p className="text-gray-500 text-lg">
          세법과 관련된 민사법, 상사법, 부동산법, 행정법, 금융·외환법 등을 조회하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {otherLawCategories.map((category) => (
          <div
            key={category.id}
            className="rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">{category.label}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{category.laws.length}개 법령</p>
            </div>
            <div className="p-4">
              <ul className="space-y-1">
                {category.laws.map((law) => (
                  <li key={law.id}>
                    <Link
                      href={`/other-laws/${category.id}/${law.id}`}
                      className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors leading-snug"
                    >
                      {law.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
