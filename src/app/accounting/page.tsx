export const metadata = {
  title: "회계 | 택스허브",
  description: "회계 관련 법령 및 기준 - 준비 중",
};

export default function AccountingPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">회계</h1>
        <p className="text-gray-500 text-lg">
          회계 관련 법령 및 기준을 제공할 예정입니다.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-16 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">준비 중입니다</h2>
        <p className="text-gray-400">
          회계 관련 콘텐츠가 곧 업데이트될 예정입니다.
          <br />
          K-IFRS, 일반기업회계기준, 중소기업회계기준 등의 내용이 추가됩니다.
        </p>
      </div>
    </div>
  );
}
