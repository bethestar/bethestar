"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { use } from "react";
import { calculatorCategories } from "@/lib/menuData";

export default function CalculatorDetailPage({
  params,
}: {
  params: Promise<{ calcId: string }>;
}) {
  const { calcId } = use(params);
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "professional";
  const calc = calculatorCategories.find((c) => c.id === calcId);

  if (!calc) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 text-center">
        <p className="text-gray-500">존재하지 않는 계산기입니다.</p>
        <Link href="/calculator" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          계산기 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const isProfessional = mode === "professional";
  const otherCalcs = calculatorCategories.filter((c) => c.id !== calcId);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/calculator" className="hover:text-blue-600">
          계산기
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{calc.label}</span>
      </nav>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
              isProfessional
                ? "bg-blue-100 text-blue-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {isProfessional ? "전문가용" : "간편"}
          </span>
          <Link
            href={`/calculator/${calcId}?mode=${isProfessional ? "simple" : "professional"}`}
            className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
          >
            {isProfessional ? "간편 계산기로 전환" : "전문가용으로 전환"} &rarr;
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {calc.label}
        </h1>
        <p className="text-gray-500">{calc.description}</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-8 mb-8">
        {isProfessional ? (
          <ProfessionalCalculatorPlaceholder name={calc.label} />
        ) : (
          <SimpleCalculatorPlaceholder name={calc.label} />
        )}
      </div>

      <div className="border-t border-gray-100 pt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          다른 계산기
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {otherCalcs.slice(0, 6).map((c) => (
            <Link
              key={c.id}
              href={`/calculator/${c.id}?mode=${mode}`}
              className="px-4 py-3 text-sm border border-gray-200 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-700 transition-colors text-center"
            >
              {c.label.replace(" 계산기", "")}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfessionalCalculatorPlaceholder({ name }: { name: string }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        {name} - 전문가용
      </h3>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              과세표준
            </label>
            <div className="flex">
              <input
                type="text"
                placeholder="금액을 입력하세요"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="px-4 py-3 bg-gray-50 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-500">
                원
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              세율 구간
            </label>
            <select className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>자동 계산</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              세액공제
            </label>
            <div className="flex">
              <input
                type="text"
                placeholder="0"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="px-4 py-3 bg-gray-50 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-500">
                원
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              기납부세액
            </label>
            <div className="flex">
              <input
                type="text"
                placeholder="0"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="px-4 py-3 bg-gray-50 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-500">
                원
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            계산하기
          </button>
          <button className="px-6 py-3 border border-gray-300 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors">
            초기화
          </button>
        </div>

        <div className="mt-6 p-6 bg-gray-50 rounded-xl">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">
            계산 결과
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {["산출세액", "세액공제", "가산세", "납부할 세액"].map(
              (label) => (
                <div key={label}>
                  <div className="text-xs text-gray-400 mb-1">{label}</div>
                  <div className="text-lg font-bold text-gray-900">0 원</div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SimpleCalculatorPlaceholder({ name }: { name: string }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {name} - 간편
      </h3>
      <p className="text-sm text-gray-400 mb-6">
        간단한 정보만 입력하면 대략적인 세액을 확인할 수 있습니다.
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            예상 금액
          </label>
          <div className="flex">
            <input
              type="text"
              placeholder="금액을 입력하세요"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <span className="px-4 py-3 bg-gray-50 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-500">
              원
            </span>
          </div>
        </div>

        <button className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">
          간편 계산하기
        </button>

        <div className="p-6 bg-green-50 rounded-xl text-center">
          <div className="text-sm text-green-600 mb-1">예상 세액</div>
          <div className="text-3xl font-bold text-green-800">0 원</div>
          <p className="text-xs text-green-500 mt-2">
            * 본 결과는 참고용이며, 정확한 세액은 전문가와 상담하세요.
          </p>
        </div>
      </div>
    </div>
  );
}
