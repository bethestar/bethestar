"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  mainMenuItems,
  taxLaws,
  otherLawCategories,
  calculatorCategories,
  communityCategories,
} from "@/lib/menuData";

function TaxMegaMenu() {
  return (
    <div className="absolute left-0 top-full w-screen bg-white shadow-xl border-t border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-6 lg:grid-cols-4 xl:grid-cols-5">
          {taxLaws.map((law) => (
            <div key={law.id} className="group">
              <Link
                href={`/tax/${law.id}`}
                className="block text-sm font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors"
              >
                {law.label}
              </Link>
              <ul className="space-y-1.5">
                {law.sections.map((section) => (
                  <li key={section.id}>
                    <Link
                      href={`/tax/${law.id}/${section.id}`}
                      className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      {section.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OtherLawsMegaMenu() {
  return (
    <div className="absolute left-0 top-full w-screen bg-white shadow-xl border-t border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-3 xl:grid-cols-4">
          {otherLawCategories.map((category) => (
            <div key={category.id}>
              <h3 className="text-sm font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                {category.label}
              </h3>
              <ul className="space-y-1.5">
                {category.laws.map((law) => (
                  <li key={law.id}>
                    <Link
                      href={`/other-laws/${category.id}/${law.id}`}
                      className="text-sm text-gray-500 hover:text-blue-600 transition-colors leading-snug block"
                    >
                      {law.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CalculatorMegaMenu() {
  return (
    <div className="absolute left-0 top-full w-screen bg-white shadow-xl border-t border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-12">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              전문가용 계산기
            </h3>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {calculatorCategories.map((calc) => (
                <Link
                  key={calc.id}
                  href={`/calculator/${calc.id}?mode=professional`}
                  className="group p-3 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700">
                    {calc.label}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {calc.description}
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div className="w-px bg-gray-200" />
          <div className="w-64 shrink-0">
            <h3 className="text-sm font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              간편 계산기
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              간단한 정보 입력으로 대략적인 세액을 확인하세요.
            </p>
            <Link
              href="/calculator?mode=simple"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              간편 계산기 바로가기
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommunityMegaMenu() {
  return (
    <div className="absolute left-0 top-full bg-white shadow-xl border-t border-gray-200 z-50 rounded-b-lg min-w-[320px]">
      <div className="p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4">전문가 커뮤니티</h3>
        <ul className="space-y-2">
          {communityCategories.map((cat) => (
            <li key={cat.id}>
              <Link
                href={`/community/${cat.id}`}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                  {cat.label}
                </span>
                <span className="text-xs text-gray-400">{cat.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function FormsMegaMenu() {
  return (
    <div className="absolute left-0 top-full bg-white shadow-xl border-t border-gray-200 z-50 rounded-b-lg min-w-[280px]">
      <div className="p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4">세법별 양식</h3>
        <ul className="space-y-1.5">
          {taxLaws.map((law) => (
            <li key={law.id}>
              <Link
                href={`/forms/${law.id}`}
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors block py-1"
              >
                {law.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">PDF, HWP, Excel 형식 제공</p>
        </div>
      </div>
    </div>
  );
}

function AccountingMegaMenu() {
  return (
    <div className="absolute left-0 top-full bg-white shadow-xl border-t border-gray-200 z-50 rounded-b-lg min-w-[280px]">
      <div className="p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-3">회계</h3>
        <p className="text-sm text-gray-500">
          회계 관련 콘텐츠가 준비 중입니다.
        </p>
        <div className="mt-4 px-3 py-2 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-400">Coming Soon</p>
        </div>
      </div>
    </div>
  );
}

function MobileMenu({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [expandedLaw, setExpandedLaw] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <span className="text-lg font-bold text-blue-800">택스허브</span>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 flex gap-2">
          <Link
            href="/login"
            onClick={onClose}
            className="flex-1 text-center py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            onClick={onClose}
            className="flex-1 text-center py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            회원가입
          </Link>
        </div>

        <nav className="p-2">
          {mainMenuItems.map((item) => (
            <div key={item.id} className="border-b border-gray-50">
              <button
                onClick={() =>
                  setExpandedMenu(expandedMenu === item.id ? null : item.id)
                }
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 rounded-lg"
              >
                {item.label}
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${expandedMenu === item.id ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedMenu === "tax" && item.id === "tax" && (
                <div className="pl-4 pb-2">
                  {taxLaws.map((law) => (
                    <div key={law.id}>
                      <button
                        onClick={() =>
                          setExpandedLaw(expandedLaw === law.id ? null : law.id)
                        }
                        className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded"
                      >
                        {law.label}
                        <svg
                          className={`w-3 h-3 text-gray-400 transition-transform ${expandedLaw === law.id ? "rotate-180" : ""}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {expandedLaw === law.id && (
                        <div className="pl-4 pb-1">
                          {law.sections.map((section) => (
                            <Link
                              key={section.id}
                              href={`/tax/${law.id}/${section.id}`}
                              onClick={onClose}
                              className="block px-4 py-1.5 text-xs text-gray-500 hover:text-blue-600"
                            >
                              {section.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {expandedMenu === "other-laws" && item.id === "other-laws" && (
                <div className="pl-4 pb-2">
                  {otherLawCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/other-laws/${cat.id}`}
                      onClick={onClose}
                      className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-600"
                    >
                      {cat.label}
                    </Link>
                  ))}
                </div>
              )}

              {expandedMenu === "calculator" && item.id === "calculator" && (
                <div className="pl-4 pb-2">
                  {calculatorCategories.slice(0, 8).map((calc) => (
                    <Link
                      key={calc.id}
                      href={`/calculator/${calc.id}`}
                      onClick={onClose}
                      className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-600"
                    >
                      {calc.label}
                    </Link>
                  ))}
                  <Link
                    href="/calculator"
                    onClick={onClose}
                    className="block px-4 py-2 text-sm text-blue-600 font-medium"
                  >
                    전체보기 &rarr;
                  </Link>
                </div>
              )}

              {expandedMenu === "community" && item.id === "community" && (
                <div className="pl-4 pb-2">
                  {communityCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/community/${cat.id}`}
                      onClick={onClose}
                      className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-600"
                    >
                      {cat.label}
                    </Link>
                  ))}
                </div>
              )}

              {expandedMenu === "forms" && item.id === "forms" && (
                <div className="pl-4 pb-2">
                  {taxLaws.map((law) => (
                    <Link
                      key={law.id}
                      href={`/forms/${law.id}`}
                      onClick={onClose}
                      className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-600"
                    >
                      {law.label}
                    </Link>
                  ))}
                </div>
              )}

              {expandedMenu === "accounting" && item.id === "accounting" && (
                <div className="pl-4 pb-2">
                  <p className="px-4 py-2 text-sm text-gray-400">준비 중</p>
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default function Navbar() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuEnter = (menuId: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveMenu(menuId);
  };

  const handleMenuLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 150);
  };

  const renderMegaMenu = () => {
    switch (activeMenu) {
      case "tax":
        return <TaxMegaMenu />;
      case "accounting":
        return <AccountingMegaMenu />;
      case "other-laws":
        return <OtherLawsMegaMenu />;
      case "calculator":
        return <CalculatorMegaMenu />;
      case "forms":
        return <FormsMegaMenu />;
      case "community":
        return <CommunityMegaMenu />;
      default:
        return null;
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40" ref={navRef}>
        {/* Top bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-10 text-xs border-b border-gray-100">
            <div className="text-gray-400">세무 전문가를 위한 통합 플랫폼</div>
            <div className="hidden sm:flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                회원가입
              </Link>
            </div>
          </div>
        </div>

        {/* Main nav */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TH</span>
              </div>
              <span className="text-xl font-bold text-blue-800 tracking-tight">
                택스허브
              </span>
            </Link>

            {/* Desktop menu */}
            <nav className="hidden lg:flex items-center gap-1">
              {mainMenuItems.map((item) => (
                <div
                  key={item.id}
                  onMouseEnter={() => handleMenuEnter(item.id)}
                  onMouseLeave={handleMenuLeave}
                >
                  <Link
                    href={item.href}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeMenu === item.id
                        ? "text-blue-700 bg-blue-50"
                        : "text-gray-700 hover:text-blue-700 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
            </nav>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mega menu dropdown */}
        <div onMouseEnter={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }} onMouseLeave={handleMenuLeave}>
          {renderMegaMenu()}
        </div>
      </header>

      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
