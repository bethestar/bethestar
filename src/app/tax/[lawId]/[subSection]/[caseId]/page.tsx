import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { taxLaws } from "@/lib/menuData";
import { casePublicUrl, getCase, lawApiConfigured } from "@/lib/lawGoKr";

type Params = Promise<{ lawId: string; subSection: string; caseId: string }>;

export const metadata = { title: "판례 | 택스허브" };

/** 판례 상세: /tax/[lawId]/rulings/[caseId] */
export default async function CasePage({ params }: { params: Params }) {
  const { lawId, subSection, caseId } = await params;
  const law = taxLaws.find((l) => l.id === lawId);
  if (!law || subSection !== "rulings" || !/^\d{1,12}$/.test(caseId)) notFound();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/tax" className="hover:text-blue-600">세무</Link>
        <span>/</span>
        <Link href={`/tax/${law.id}`} className="hover:text-blue-600">{law.label}</Link>
        <span>/</span>
        <Link href={`/tax/${law.id}/rulings`} className="hover:text-blue-600">예규·판례</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">판례</span>
      </nav>
      <Suspense fallback={<p className="text-gray-400">불러오는 중…</p>}>
        <CaseDetailView caseId={caseId} />
      </Suspense>
    </div>
  );
}

async function CaseDetailView({ caseId }: { caseId: string }) {
  await connection();
  if (!lawApiConfigured()) {
    return <p className="text-gray-500">국가법령정보 API(LAW_GO_KR_OC)가 설정되지 않았어요.</p>;
  }
  let detail;
  try {
    detail = await getCase(caseId);
  } catch (err) {
    return <ExternalOnly caseId={caseId} reason={err instanceof Error ? err.message : String(err)} />;
  }
  if (!detail) {
    return <ExternalOnly caseId={caseId} reason="이 판례는 국가법령정보 API에서 본문을 제공하지 않아요 (국세법령정보시스템 출처 등)." />;
  }

  const sections: [string, string][] = [
    ["판시사항", detail.holdings],
    ["판결요지", detail.summary],
    ["참조조문", detail.refArticles],
    ["참조판례", detail.refCases],
    ["전문", detail.body],
  ];

  return (
    <article>
      <div className="mb-2 flex flex-wrap gap-2 text-sm text-gray-500">
        <span className="font-medium text-gray-700">{detail.court}</span>
        <span>{detail.date} 선고</span>
        <span>{detail.caseNo}</span>
        {detail.verdictType && <span>{detail.verdictType}</span>}
      </div>
      <h1 className="mb-8 text-2xl font-bold text-gray-900">{detail.name}</h1>
      {sections
        .filter(([, text]) => text)
        .map(([title, text]) => (
          <section key={title} className="mb-8">
            <h2 className="mb-2 text-lg font-semibold text-gray-900">{title}</h2>
            <div className="whitespace-pre-line text-[15px] leading-relaxed text-gray-700">{text}</div>
          </section>
        ))}
      <a href={detail.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
        국가법령정보센터에서 보기 &rarr;
      </a>
    </article>
  );
}

function ExternalOnly({ caseId, reason }: { caseId: string; reason: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-8">
      <p className="mb-4 text-gray-600">{reason}</p>
      <a
        href={casePublicUrl(caseId)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        국가법령정보센터에서 열기 &rarr;
      </a>
    </div>
  );
}
