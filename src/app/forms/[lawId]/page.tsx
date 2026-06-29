import Link from "next/link";
import { notFound } from "next/navigation";
import { taxLaws } from "@/lib/menuData";

export function generateStaticParams() {
  return taxLaws.map((law) => ({ lawId: law.id }));
}

const sampleForms: Record<
  string,
  { name: string; formats: string[] }[]
> = {
  "corporate-tax": [
    { name: "법인세 과세표준 및 세액신고서", formats: ["PDF", "HWP", "Excel"] },
    { name: "법인세 과세표준 및 세액조정계산서", formats: ["PDF", "HWP", "Excel"] },
    { name: "소득금액조정합계표", formats: ["PDF", "HWP"] },
    { name: "세무조정계산서", formats: ["PDF", "HWP", "Excel"] },
    { name: "이월결손금명세서", formats: ["PDF", "HWP"] },
    { name: "자본금과 적립금 조정명세서", formats: ["PDF", "HWP", "Excel"] },
  ],
  "income-tax": [
    { name: "종합소득세 과세표준 확정신고서", formats: ["PDF", "HWP", "Excel"] },
    { name: "사업소득 원천징수영수증", formats: ["PDF", "HWP"] },
    { name: "근로소득 원천징수영수증", formats: ["PDF", "HWP"] },
    { name: "기타소득 지급명세서", formats: ["PDF", "HWP", "Excel"] },
    { name: "성실신고확인서", formats: ["PDF", "HWP"] },
  ],
  "vat": [
    { name: "부가가치세 확정신고서", formats: ["PDF", "HWP", "Excel"] },
    { name: "매출·매입처별 세금계산서합계표", formats: ["PDF", "HWP", "Excel"] },
    { name: "영세율 매출명세서", formats: ["PDF", "HWP"] },
    { name: "공제받지 못할 매입세액 명세서", formats: ["PDF", "HWP"] },
    { name: "부동산임대 공급가액 명세서", formats: ["PDF", "HWP", "Excel"] },
  ],
  "inheritance-gift-tax": [
    { name: "상속세 과세표준 신고 및 자진납부계산서", formats: ["PDF", "HWP"] },
    { name: "증여세 과세표준 신고 및 자진납부계산서", formats: ["PDF", "HWP"] },
    { name: "상속재산명세서", formats: ["PDF", "HWP", "Excel"] },
    { name: "증여재산 및 평가명세서", formats: ["PDF", "HWP", "Excel"] },
  ],
};

const formatIcons: Record<string, string> = {
  PDF: "text-red-600 bg-red-50",
  HWP: "text-sky-600 bg-sky-50",
  Excel: "text-green-600 bg-green-50",
};

export default async function FormsDetailPage({
  params,
}: {
  params: Promise<{ lawId: string }>;
}) {
  const { lawId } = await params;
  const law = taxLaws.find((l) => l.id === lawId);
  if (!law) notFound();

  const forms = sampleForms[lawId] || [];
  const otherLaws = taxLaws.filter((l) => l.id !== lawId);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/forms" className="hover:text-blue-600">
          양식
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{law.label}</span>
      </nav>

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {law.label} 양식
        </h1>
        <p className="text-gray-500">
          {law.label} 관련 실무 양식을 PDF, HWP, Excel 파일로 다운로드하세요.
        </p>
      </div>

      {forms.length > 0 ? (
        <div className="space-y-3 mb-12">
          {forms.map((form, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors gap-4"
            >
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-gray-400 shrink-0"
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
                <span className="text-sm font-medium text-gray-800">
                  {form.name}
                </span>
              </div>
              <div className="flex gap-2 shrink-0">
                {form.formats.map((format) => (
                  <button
                    key={format}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80 ${formatIcons[format] || "text-gray-600 bg-gray-50"}`}
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-12 text-center mb-12">
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-gray-500 text-lg font-medium mb-2">
            양식 준비 중
          </p>
          <p className="text-gray-400 text-sm">
            {law.label} 관련 양식이 곧 업데이트됩니다.
          </p>
        </div>
      )}

      <div className="border-t border-gray-100 pt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          다른 세법 양식
        </h2>
        <div className="flex flex-wrap gap-2">
          {otherLaws.map((l) => (
            <Link
              key={l.id}
              href={`/forms/${l.id}`}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-700 transition-colors"
            >
              {l.shortLabel || l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
