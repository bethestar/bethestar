import Link from "next/link";
import { communityCategories } from "@/lib/menuData";

export const metadata = {
  title: "커뮤니티 | 택스허브",
  description: "자격 인증 전문가 커뮤니티 - 세무사, 회계사, 감정평가사, 법무사, 노무사",
};

export default function CommunityPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">전문가 커뮤니티</h1>
        <p className="text-gray-500 text-lg">
          자격 인증된 전문가들이 소통하는 커뮤니티입니다. 세무사를 시작으로 다양한 전문직으로 확장합니다.
        </p>
      </div>

      <div className="bg-blue-50 rounded-xl p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900">자격 인증 필요</h3>
          <p className="text-sm text-blue-700 mt-1">
            커뮤니티 이용을 위해서는 해당 자격증 인증이 필요합니다.
          </p>
        </div>
        <Link
          href="/signup"
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shrink-0"
        >
          회원가입 &amp; 인증
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {communityCategories.map((cat, i) => (
          <Link
            key={cat.id}
            href={`/community/${cat.id}`}
            className={`rounded-xl border p-8 transition-all group ${
              i === 0
                ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 sm:col-span-2 lg:col-span-1"
                : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-lg"
            }`}
          >
            <div
              className={`text-xl font-bold mb-2 ${
                i === 0 ? "text-white" : "text-gray-900 group-hover:text-blue-700"
              }`}
            >
              {cat.label}
            </div>
            <p className={`text-sm ${i === 0 ? "text-blue-100" : "text-gray-500"}`}>
              {cat.description}
            </p>
            {i === 0 && (
              <div className="mt-4 inline-flex items-center gap-1 text-sm text-white/80 font-medium">
                커뮤니티 입장 &rarr;
              </div>
            )}
            {i > 0 && (
              <div className="mt-4 text-xs text-gray-400 group-hover:text-blue-500">
                바로가기 &rarr;
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
