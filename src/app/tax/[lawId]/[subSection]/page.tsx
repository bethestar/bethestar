import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { taxLaws } from "@/lib/menuData";
import {
  getLawDocument,
  lawApiConfigured,
  NTS_TAXLAW_URL,
  CASE_QUERY,
  searchCases,
  TAX_LAW_IDS,
  type LawDocument,
  type LawLevel,
} from "@/lib/lawGoKr";
import LawText from "@/components/law/LawText";
import AppendixList from "@/components/law/AppendixList";
import CaseList from "@/components/law/CaseList";

type Params = Promise<{ lawId: string; subSection: string }>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const LEVEL_BY_SECTION: Record<string, LawLevel> = {
  law: "law",
  "enforcement-decree": "decree",
  "enforcement-rules": "rule",
};

function resolve(lawId: string, subSection: string) {
  const law = taxLaws.find((l) => l.id === lawId);
  const section = law?.sections.find((s) => s.id === subSection);
  const ids = TAX_LAW_IDS[lawId];
  if (!law || !section || !ids) notFound();
  return { law, section, ids };
}

export async function generateMetadata({ params }: { params: Params }) {
  const { lawId, subSection } = await params;
  const law = taxLaws.find((l) => l.id === lawId);
  const section = law?.sections.find((s) => s.id === subSection);
  if (!law || !section) return {};
  return { title: `${law.label} ${section.label} | 택스허브` };
}

export default async function TaxSubSectionPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { lawId, subSection } = await params;
  const { law, section, ids } = resolve(lawId, subSection);
  const sp = await searchParams;
  const page = Math.max(1, Math.min(500, parseInt(String(Array.isArray(sp.page) ? sp.page[0] : sp.page ?? "1"), 10) || 1));

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/tax" className="hover:text-blue-600">세무</Link>
        <span>/</span>
        <Link href={`/tax/${law.id}`} className="hover:text-blue-600">{law.label}</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{section.label}</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 mb-5">
        {law.label} <span className="text-blue-700">{section.label}</span>
      </h1>

      <div className="mb-8 -mx-1 flex gap-1 overflow-x-auto border-b border-gray-200 px-1">
        {law.sections.map((s) => (
          <Link
            key={s.id}
            href={`/tax/${law.id}/${s.id}`}
            aria-current={s.id === subSection ? "page" : undefined}
            className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              s.id === subSection ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <Suspense key={`${subSection}-${page}`} fallback={<LoadingText />}>
        <SectionContent lawId={law.id} subSection={subSection} page={page} ids={ids} />
      </Suspense>
    </div>
  );
}

async function SectionContent({
  lawId,
  subSection,
  page,
  ids,
}: {
  lawId: string;
  subSection: string;
  page: number;
  ids: (typeof TAX_LAW_IDS)[string];
}) {
  if (subSection === "general-rules" || subSection === "execution-standards") {
    return <NtsNotice lawId={lawId} what={subSection === "general-rules" ? "기본통칙" : "집행기준"} lawName={ids.law.name} />;
  }

  // 빌드 시점이 아니라 요청 시점에 조회한다 (OC 는 런타임 환경변수).
  await connection();
  if (!lawApiConfigured()) return <SetupNotice />;

  // 데이터만 try 안에서 가져오고, 렌더링은 try 밖에서 한다.
  type Loaded =
    | { kind: "law"; doc: LawDocument }
    | { kind: "appendix"; type: "별표" | "서식"; docs: LawDocument[] }
    | { kind: "cases"; data: Awaited<ReturnType<typeof searchCases>> };
  let loaded: Loaded;
  try {
    const level = LEVEL_BY_SECTION[subSection];
    if (level) {
      loaded = { kind: "law", doc: await getLawDocument(ids[level].id) };
    } else if (subSection === "appendix" || subSection === "forms") {
      const docs = await Promise.all((["law", "decree", "rule"] as LawLevel[]).map((l) => getLawDocument(ids[l].id)));
      loaded = { kind: "appendix", type: subSection === "appendix" ? "별표" : "서식", docs };
    } else if (subSection === "rulings") {
      loaded = { kind: "cases", data: await searchCases(CASE_QUERY[lawId] ?? ids.law.name, page) };
    } else {
      notFound();
    }
  } catch (err) {
    return <ErrorNotice message={err instanceof Error ? err.message : String(err)} lawName={ids.law.name} />;
  }

  if (loaded.kind === "law") {
    return (
      <>
        <LawMeta doc={loaded.doc} />
        <LawText doc={loaded.doc} />
      </>
    );
  }
  if (loaded.kind === "appendix") {
    const type = loaded.type;
    return (
      <AppendixList
        groups={loaded.docs.map((d) => ({ source: d.name, items: d.appendices.filter((a) => a.type === type) }))}
        emptyText={`${ids.law.name}과 하위 법령에 ${type}이 없어요.`}
      />
    );
  }
  return (
    <>
      <p className="mb-4 text-sm text-gray-500">
        국가법령정보센터에서 &lsquo;{CASE_QUERY[lawId] ?? ids.law.name}&rsquo;(으)로 검색한 판례예요. 국세청 예규·질의회신은{" "}
        <a href={NTS_TAXLAW_URL} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          국세법령정보시스템
        </a>
        에서 볼 수 있어요.
      </p>
      <CaseList data={loaded.data} basePath={`/tax/${lawId}/rulings`} />
    </>
  );
}

function LawMeta({ doc }: { doc: LawDocument }) {
  return (
    <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
      <span className="font-semibold text-gray-900">{doc.name}</span>
      <span>
        {doc.kind} 제{doc.promulgationNo}호 · {doc.promulgatedAt} {doc.amendType}
      </span>
      <span>시행 {doc.effectiveAt}</span>
      {doc.ministry && <span>{doc.ministry}</span>}
      <a href={doc.sourceUrl} target="_blank" rel="noopener noreferrer" className="ml-auto text-blue-600 hover:underline">
        국가법령정보센터 원문 &rarr;
      </a>
    </div>
  );
}

function NtsNotice({ lawId, what, lawName }: { lawId: string; what: string; lawName: string }) {
  const isLocal = lawId === "local-tax";
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-8">
      <h2 className="mb-2 text-lg font-semibold text-gray-900">
        {lawName} {what}은 국세법령정보시스템에서 볼 수 있어요
      </h2>
      <p className="mb-5 text-sm text-gray-600">
        {what}은 국세청이 제공하는 자료라서 법령 API로는 가져올 수 없어요.{" "}
        {isLocal && "지방세는 국세청이 아니라 행정안전부 소관이라, 지방세 운영예규는 행정안전부·지방세법령정보시스템에서 확인해 주세요."}
      </p>
      <a
        href={NTS_TAXLAW_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        국세법령정보시스템 열기 &rarr;
      </a>
    </div>
  );
}

function SetupNotice() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
      <p className="mb-1 font-semibold">국가법령정보 API 설정이 필요해요</p>
      <p>
        서버 환경변수 <code className="rounded bg-white px-1">LAW_GO_KR_OC</code>에 국가법령정보 공동활용(open.law.go.kr)에서 신청한 OC 값을 넣어 주세요.
      </p>
    </div>
  );
}

function ErrorNotice({ message, lawName }: { message: string; lawName: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
      <p className="mb-1 font-semibold">법령 정보를 불러오지 못했어요</p>
      <p className="mb-3">{message}</p>
      <a
        href={`https://www.law.go.kr/법령/${encodeURIComponent(lawName)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-700 underline"
      >
        국가법령정보센터에서 직접 보기
      </a>
    </div>
  );
}

function LoadingText() {
  return (
    <div aria-busy="true" aria-label="불러오는 중" className="space-y-4 animate-pulse">
      <div className="h-10 rounded-lg bg-gray-100" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2 border-b border-gray-100 pb-4">
          <div className="h-4 w-48 rounded bg-gray-200" />
          <div className="h-3 w-full rounded bg-gray-100" />
          <div className="h-3 w-5/6 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}
