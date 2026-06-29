import Link from "next/link";
import { taxLaws } from "@/lib/menuData";

export const metadata = {
  title: "세무 | 택스허브",
  description: "주요 개별세법 법령 조회 - 법, 시행령, 시행규칙, 통칙, 예규·판례, 집행기준",
};

export default function TaxPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">세무</h1>
        <p className="text-gray-500 text-lg">
          주요 개별세법의 법령, 시행령, 시행규칙, 통칙, 예규·판례, 집행기준을 조회하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {taxLaws.map((law) => (
          <div
            key={law.id}
            className="rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
              <Link href={`/tax/${law.id}`} className="text-lg font-bold text-blue-800 hover:text-blue-600">
                {law.label}
              </Link>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-2">
                {law.sections.map((section) => (
                  <Link
                    key={section.id}
                    href={`/tax/${law.id}/${section.id}`}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    {section.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
