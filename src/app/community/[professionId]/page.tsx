import Link from "next/link";
import { notFound } from "next/navigation";
import { communityCategories } from "@/lib/menuData";

export function generateStaticParams() {
  return communityCategories.map((cat) => ({ professionId: cat.id }));
}

const sampleBoards = [
  { id: "free", label: "자유게시판", description: "자유롭게 소통하는 공간", postCount: 0 },
  { id: "qna", label: "질의응답", description: "실무 관련 질문과 답변", postCount: 0 },
  { id: "case-study", label: "사례공유", description: "실무 사례 공유 및 토론", postCount: 0 },
  { id: "news", label: "업계소식", description: "관련 뉴스 및 제도 변경", postCount: 0 },
  { id: "job", label: "구인·구직", description: "채용 및 구직 정보", postCount: 0 },
  { id: "study", label: "스터디·세미나", description: "스터디 모집 및 세미나 정보", postCount: 0 },
];

export default async function CommunityDetailPage({
  params,
}: {
  params: Promise<{ professionId: string }>;
}) {
  const { professionId } = await params;
  const community = communityCategories.find((c) => c.id === professionId);
  if (!community) notFound();

  const otherCommunities = communityCategories.filter(
    (c) => c.id !== professionId
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/community" className="hover:text-blue-600">
          커뮤니티
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{community.label}</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {community.label} 커뮤니티
          </h1>
          <p className="text-gray-500">{community.description}</p>
        </div>
        <Link
          href="/signup"
          className="shrink-0 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          자격 인증 &amp; 가입
        </Link>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 flex items-start gap-3">
        <svg
          className="w-5 h-5 text-amber-500 mt-0.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <div>
          <p className="text-sm font-semibold text-amber-800">
            자격 인증 필요
          </p>
          <p className="text-sm text-amber-700 mt-0.5">
            {community.label} 커뮤니티는 자격증 인증을 완료한 회원만 이용할 수
            있습니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {sampleBoards.map((board) => (
          <div
            key={board.id}
            className="p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                {board.label}
              </h3>
              <span className="text-xs text-gray-400">
                {board.postCount}개 글
              </span>
            </div>
            <p className="text-sm text-gray-500">{board.description}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 mb-12">
        <h2 className="text-lg font-bold text-gray-900 mb-4">최근 게시글</h2>
        <div className="text-center py-8">
          <svg
            className="w-12 h-12 mx-auto text-gray-300 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="text-gray-400 text-sm">
            아직 게시글이 없습니다. 첫 번째 글을 작성해보세요.
          </p>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          다른 전문가 커뮤니티
        </h2>
        <div className="flex flex-wrap gap-2">
          {otherCommunities.map((c) => (
            <Link
              key={c.id}
              href={`/community/${c.id}`}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-700 transition-colors"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
