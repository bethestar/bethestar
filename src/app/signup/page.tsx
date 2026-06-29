"use client";

import Link from "next/link";
import { useState } from "react";

const professionalTypes = [
  { id: "tax-accountant", label: "세무사" },
  { id: "cpa", label: "공인회계사" },
  { id: "appraiser", label: "감정평가사" },
  { id: "judicial-scrivener", label: "법무사" },
  { id: "labor-attorney", label: "공인노무사" },
  { id: "customs-broker", label: "관세사" },
  { id: "licensed-realtor", label: "공인중개사" },
  { id: "general", label: "일반 회원" },
];

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
    professionalType: "",
    agreeTerms: false,
    agreePrivacy: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-700 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">TH</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">회원가입</h1>
          <p className="text-gray-500 mt-2">택스허브와 함께 시작하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
              이름
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-1.5">
              이메일
            </label>
            <input
              id="signup-email"
              type="email"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="example@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1.5">
              비밀번호
            </label>
            <input
              id="signup-password"
              type="password"
              value={formData.password}
              onChange={(e) => updateField("password", e.target.value)}
              placeholder="8자 이상 입력하세요"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              minLength={8}
            />
          </div>

          <div>
            <label htmlFor="password-confirm" className="block text-sm font-medium text-gray-700 mb-1.5">
              비밀번호 확인
            </label>
            <input
              id="password-confirm"
              type="password"
              value={formData.passwordConfirm}
              onChange={(e) => updateField("passwordConfirm", e.target.value)}
              placeholder="비밀번호를 다시 입력하세요"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              전문가 유형
            </label>
            <div className="grid grid-cols-2 gap-2">
              {professionalTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => updateField("professionalType", type.id)}
                  className={`px-4 py-2.5 text-sm rounded-lg border transition-colors ${
                    formData.professionalType === type.id
                      ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.agreeTerms}
                onChange={(e) => updateField("agreeTerms", e.target.checked)}
                className="rounded border-gray-300 mt-0.5"
                required
              />
              <span>
                <Link href="/terms" className="text-blue-600 underline">이용약관</Link>에
                동의합니다 (필수)
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.agreePrivacy}
                onChange={(e) => updateField("agreePrivacy", e.target.checked)}
                className="rounded border-gray-300 mt-0.5"
                required
              />
              <span>
                <Link href="/privacy" className="text-blue-600 underline">개인정보처리방침</Link>에
                동의합니다 (필수)
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors mt-4"
          >
            회원가입
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          이미 회원이신가요?{" "}
          <Link href="/login" className="text-blue-600 font-medium hover:text-blue-800">
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
