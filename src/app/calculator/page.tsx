"use client";

import Link from "next/link";
import { useState } from "react";
import { calculatorCategories } from "@/lib/menuData";

export default function CalculatorPage() {
  const [mode, setMode] = useState<"professional" | "simple">("professional");

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">세액 계산기</h1>
        <p className="text-gray-500 text-lg">
          전문가용 정밀 계산기와 일반인을 위한 간편 계산기를 선택하세요.
        </p>
      </div>

      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setMode("professional")}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            mode === "professional"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          전문가용 계산기
        </button>
        <button
          onClick={() => setMode("simple")}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            mode === "simple"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          간편 계산기
        </button>
      </div>

      {mode === "professional" && (
        <div>
          <p className="text-gray-500 mb-6">
            세무사, 회계사 등 전문가를 위한 정밀 계산기입니다. 세부 항목별 입력과 정확한 결과를 제공합니다.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {calculatorCategories.map((calc) => (
              <Link
                key={calc.id}
                href={`/calculator/${calc.id}?mode=professional`}
                className="p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="font-semibold text-gray-900 group-hover:text-blue-700">
                    {calc.label}
                  </div>
                </div>
                <p className="text-sm text-gray-400">{calc.description}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {mode === "simple" && (
        <div>
          <p className="text-gray-500 mb-6">
            간단한 정보 입력만으로 대략적인 세액을 빠르게 확인할 수 있는 간편 계산기입니다.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {calculatorCategories.map((calc) => (
              <Link
                key={calc.id}
                href={`/calculator/${calc.id}?mode=simple`}
                className="p-6 rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-green-100">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="font-semibold text-gray-900 group-hover:text-green-700">
                    {calc.label}
                  </div>
                </div>
                <p className="text-sm text-gray-400">{calc.description}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
