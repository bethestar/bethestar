import Link from "next/link";
import { taxLaws } from "@/lib/menuData";

export const metadata = {
  title: "양식 | 택스허브",
  description: "세법별 실무 양식 다운로드 - PDF, HWP, Excel",
};

export default function FormsPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">실무 양식</h1>
        <p className="text-gray-500 text-lg">
          각 개별세법별 실무에서 사용하는 양식을 PDF, HWP, Excel 형식으로 제공합니다.
        </p>
      </div>

      <div className="mb-8 flex gap-3">
        {["PDF", "HWP", "Excel"].map((format) => (
          <span
            key={format}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
          >
            {format}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {taxLaws.map((law) => (
          <Link
            key={law.id}
            href={`/forms/${law.id}`}
            className="p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-blue-50">
                <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900 group-hover:text-blue-700">
                  {law.label}
                </div>
                <div className="text-xs text-gray-400 mt-1">PDF · HWP · Excel</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
