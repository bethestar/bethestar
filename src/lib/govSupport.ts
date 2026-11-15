import "server-only";

// 정부지원사업 조회 — connectors/gov-support-mcp 의 클라이언트 코드를 그대로 재사용한다.
// API 키는 서버 환경변수에만 있고 브라우저로 전달되지 않는다.
import { searchAll as searchAllRaw, SOURCES as SOURCES_RAW } from "../../connectors/gov-support-mcp/src/search.mjs";

export type SupportSource = "bizinfo" | "kstartup" | "gov24";

export interface SupportItem {
  source: SupportSource;
  sourceName: string;
  id: string;
  title: string;
  summary: string;
  category: string;
  organization: string;
  executor: string;
  target: string;
  region: string;
  applyPeriodText: string;
  applyStart?: string;
  applyEnd?: string;
  status: "open" | "upcoming" | "closed" | "always" | "unknown";
  url: string;
}

export interface SourceReport {
  ok: boolean;
  error?: string;
  fetched?: number;
  matched?: number;
  returned?: number;
}

export interface SupportSearchResult {
  complete: boolean;
  sources: Partial<Record<SupportSource, SourceReport>>;
  count: number;
  items: SupportItem[];
}

export interface SupportQuery {
  keyword?: string;
  region?: string;
  target?: string;
  userType?: string;
  sources?: SupportSource[];
  includeClosed?: boolean;
}

export const SUPPORT_SOURCES = SOURCES_RAW as SupportSource[];

export const SOURCE_INFO: Record<SupportSource, { label: string; description: string; portal: string; envName: string }> = {
  bizinfo: {
    label: "기업마당",
    description: "중소벤처기업부 · 중소기업·소상공인 지원사업",
    portal: "https://www.bizinfo.go.kr",
    envName: "BIZINFO_API_KEY",
  },
  kstartup: {
    label: "K-Startup",
    description: "창업진흥원 · 창업지원사업 공고",
    portal: "https://www.k-startup.go.kr",
    envName: "DATA_GO_KR_API_KEY",
  },
  gov24: {
    label: "보조금24",
    description: "행정안전부 · 중앙부처·지자체 혜택",
    portal: "https://www.gov.kr/portal/rcvfvrSvc/main",
    envName: "DATA_GO_KR_API_KEY",
  },
};

/** 어떤 소스의 API 키가 설정되어 있는지 (값은 노출하지 않음). */
export function configuredSources(env: NodeJS.ProcessEnv = process.env): Record<SupportSource, boolean> {
  const dataGoKr = Boolean(env.DATA_GO_KR_API_KEY?.trim());
  return {
    bizinfo: Boolean(env.BIZINFO_API_KEY?.trim()),
    kstartup: dataGoKr || Boolean(env.KSTARTUP_API_KEY?.trim()),
    gov24: dataGoKr || Boolean(env.GOV24_API_KEY?.trim()),
  };
}

/** 정부 API 응답을 1시간 동안 Next.js Data Cache 에 보관하는 fetch. */
const cachedFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, next: { revalidate: 3600 } } as RequestInit);

export async function searchSupportPrograms(query: SupportQuery): Promise<SupportSearchResult> {
  const configured = configuredSources();
  const wanted = (query.sources?.length ? query.sources : SUPPORT_SOURCES).filter((s) => configured[s]);
  if (wanted.length === 0) {
    return { complete: false, sources: {}, count: 0, items: [] };
  }
  const result = (await searchAllRaw(
    {
      keyword: query.keyword,
      region: query.region,
      target: query.target,
      userType: query.userType,
      sources: wanted,
      openOnly: !query.includeClosed,
      limitPerSource: 20,
    },
    process.env,
    cachedFetch,
  )) as SupportSearchResult;
  return result;
}
