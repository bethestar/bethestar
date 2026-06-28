import Link from "next/link";
import {
  taxLaws,
  calculatorCategories,
  communityCategories,
} from "@/lib/menuData";

function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoLTZWMzRoNnptMC0zMHY2aC02VjRoNnptMCAxMHY2aC02VjE0aDZ6bTAgMTB2NmgtNlYyNGg2em0wIDIwdjZoLTZWNDRoNnptMCAxMHY2aC02VjU0aDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
      <div className="max-w-7xl mx-auto px-6 py-20 sm:py-28 relative">
        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-6">
            세무 실무의 모든 것,
            <br />
            <span className="text-blue-300">택스허브</span>에서.
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 leading-relaxed mb-8">
            법령 조회부터 세액 계산, 실무 양식, 전문가 커뮤니티까지.
            <br />
            세무사, 회계사, 실무자를 위한 원스톱 플랫폼입니다.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/tax"
              className="px-6 py-3 bg-white text-blue-900 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
            >
              법령 조회
            </Link>
            <Link
              href="/calculator"
              className="px-6 py-3 bg-blue-700 text-white font-semibold rounded-lg border border-blue-500 hover:bg-blue-600 transition-colors"
            >
              세액 계산기
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { num: "9+", label: "개별세법" },
            { num: "16+", label: "세액 계산기" },
            { num: "50+", label: "관련 법령" },
            { num: "7+", label: "전문직 커뮤니티" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-white">{stat.num}</div>
              <div className="text-sm text-blue-200 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TaxLawSection() {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">세법 법령</h2>
          <p className="text-gray-500 text-lg">
            주요 개별세법의 법령, 시행령, 시행규칙, 통칙, 예규·판례, 집행기준을
            한 곳에서 조회하세요.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {taxLaws.map((law) => (
            <Link
              key={law.id}
              href={`/tax/${law.id}`}
              className="group flex items-center gap-4 p-5 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0 group-hover:bg-blue-100 transition-colors">
                {law.shortLabel || law.label.slice(0, 2)}
              </div>
              <div>
                <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                  {law.label}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  법 · 시행령 · 시행규칙 · 통칙 · 예규·판례
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function CalculatorSection() {
  const featured = calculatorCategories.slice(0, 6);
  return (
    <section className="py-16 sm:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">세액 계산기</h2>
          <p className="text-gray-500 text-lg">
            전문가용 정밀 계산기와 일반인을 위한 간편 계산기를 제공합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-4">
              전문가용
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              전문가용 계산기
            </h3>
            <p className="text-gray-500 mb-6">
              세무사, 회계사 등 업계 종사자를 위한 완성도 높은 세액 계산기.
              세부 항목별 입력과 정밀한 결과를 제공합니다.
            </p>
            <Link
              href="/calculator?mode=professional"
              className="inline-flex items-center gap-1 text-blue-600 font-medium text-sm hover:text-blue-800"
            >
              전문가용 계산기 바로가기 &rarr;
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold mb-4">
              간편
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              간편 계산기
            </h3>
            <p className="text-gray-500 mb-6">
              일반인도 간단한 정보 입력만으로 대략적인 세액을 빠르게 확인할 수
              있는 간편 계산기입니다.
            </p>
            <Link
              href="/calculator?mode=simple"
              className="inline-flex items-center gap-1 text-green-600 font-medium text-sm hover:text-green-800"
            >
              간편 계산기 바로가기 &rarr;
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {featured.map((calc) => (
            <Link
              key={calc.id}
              href={`/calculator/${calc.id}`}
              className="text-center p-4 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow transition-all group"
            >
              <div className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                {calc.label.replace(" 계산기", "")}
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-6">
          <Link
            href="/calculator"
            className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            전체 계산기 보기 &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}

function FormsSection() {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              실무 양식
            </h2>
            <p className="text-gray-500 text-lg mb-6">
              각 개별세법별 실무에서 사용하는 양식을 PDF, HWP, Excel 파일로
              제공합니다.
            </p>
            <div className="flex gap-3 mb-6">
              {["PDF", "HWP", "Excel"].map((format) => (
                <span
                  key={format}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                >
                  {format}
                </span>
              ))}
            </div>
            <Link
              href="/forms"
              className="inline-flex items-center gap-1 text-blue-600 font-medium hover:text-blue-800"
            >
              양식 다운로드 &rarr;
            </Link>
          </div>

          <div className="flex-1 grid grid-cols-3 gap-3">
            {taxLaws.slice(0, 6).map((law) => (
              <Link
                key={law.id}
                href={`/forms/${law.id}`}
                className="p-4 bg-gray-50 rounded-xl text-center hover:bg-blue-50 transition-colors group"
              >
                <div className="text-2xl mb-2">
                  <svg className="w-8 h-8 mx-auto text-gray-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-xs font-medium text-gray-600 group-hover:text-blue-700">
                  {law.shortLabel || law.label.slice(0, 4)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CommunitySection() {
  return (
    <section className="py-16 sm:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            전문가 커뮤니티
          </h2>
          <p className="text-gray-500 text-lg">
            자격 인증된 전문가들만의 커뮤니티. 세무사를 시작으로 다양한
            전문직으로 확장합니다.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {communityCategories.map((cat, i) => (
            <Link
              key={cat.id}
              href={`/community/${cat.id}`}
              className={`p-6 rounded-xl border text-center transition-all group ${
                i === 0
                  ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 col-span-2 sm:col-span-1"
                  : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-lg"
              }`}
            >
              <div
                className={`text-lg font-bold mb-1 ${
                  i === 0 ? "text-white" : "text-gray-900 group-hover:text-blue-700"
                }`}
              >
                {cat.label}
              </div>
              <div
                className={`text-sm ${
                  i === 0 ? "text-blue-100" : "text-gray-400"
                }`}
              >
                {cat.description}
              </div>
              {i === 0 && (
                <div className="mt-3 inline-flex items-center gap-1 text-sm text-blue-100 font-medium">
                  바로가기 &rarr;
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <HeroSection />
      <TaxLawSection />
      <CalculatorSection />
      <FormsSection />
      <CommunitySection />
    </>
  );
}
