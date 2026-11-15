#!/usr/bin/env node
// 정부지원사업·보조금 정보 조회 MCP 서버 (stdio).
// 환경변수: BIZINFO_API_KEY (기업마당), DATA_GO_KR_API_KEY (공공데이터포털: K-Startup·보조금24)

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { searchBizinfo, BIZINFO_CATEGORIES } from "./sources/bizinfo.mjs";
import { searchKstartup } from "./sources/kstartup.mjs";
import { searchGov24, getGov24Detail } from "./sources/gov24.mjs";
import { searchAll, SOURCES } from "./search.mjs";
import { todayKst } from "./normalize.mjs";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

const NOTE =
  "목록 메타데이터만으로 지원 자격을 확정하지 마세요. 신청 전 각 항목의 url(공식 공고)에서 자격요건·마감일·제외조건을 확인해야 합니다.";

function ok(data) {
  return {
    content: [{ type: "text", text: JSON.stringify({ today: todayKst(), note: NOTE, ...data }, null, 2) }],
  };
}

function fail(err) {
  return { isError: true, content: [{ type: "text", text: err?.message ?? String(err) }] };
}

const wrap = (fn) => async (args) => {
  try {
    return ok(await fn(args));
  } catch (err) {
    return fail(err);
  }
};

const limit = z.number().int().min(1).max(100).optional().describe("반환 개수 (기본 20)");
const readOnly = { readOnlyHint: true, openWorldHint: true };

export function createServer(env = process.env) {
  const server = new McpServer({ name: "gov-support", version: "0.1.0" });

  server.registerTool(
    "search_support_programs",
    {
      title: "정부지원사업 통합 검색",
      description:
        "기업마당·K-Startup·보조금24를 동시에 검색해 공고를 마감 임박순으로 합쳐 반환합니다. 한 소스가 실패해도 나머지 결과와 소스별 오류(sources)를 함께 돌려줍니다.",
      inputSchema: {
        keyword: z.string().optional().describe("검색어. 공백으로 구분하면 모두 포함된 항목만 (예: '세무 교육', '청년 창업')"),
        region: z.string().optional().describe("지역 (예: 서울, 경기, 부산). 기업마당·K-Startup에 적용"),
        target: z.string().optional().describe("K-Startup 신청대상 (예: 예비창업자, 일반기업, 대학생)"),
        userType: z.string().optional().describe("보조금24 사용자구분 (예: 개인, 소상공인, 법인/시설/단체)"),
        bizinfoCategory: z.enum(BIZINFO_CATEGORIES).optional().describe("기업마당 지원분야"),
        sources: z.array(z.enum(SOURCES)).optional().describe("조회할 소스 (기본 전체)"),
        openOnly: z.boolean().optional().describe("마감 공고 제외 (기본 true)"),
        limitPerSource: z.number().int().min(1).max(50).optional().describe("소스별 최대 개수 (기본 10)"),
      },
      annotations: readOnly,
    },
    wrap((a) => searchAll(a, env)),
  );

  server.registerTool(
    "search_bizinfo",
    {
      title: "기업마당 지원사업 공고 검색",
      description: "중소벤처기업부 기업마당의 중소기업·소상공인 지원사업 공고(금융·기술·인력·수출·내수·창업·경영)를 검색합니다. BIZINFO_API_KEY 필요.",
      inputSchema: {
        keyword: z.string().optional().describe("제목·개요·해시태그 검색어"),
        category: z.enum(BIZINFO_CATEGORIES).optional().describe("지원분야"),
        region: z.string().optional().describe("지역 (해시태그 기반 추정)"),
        hashtags: z.string().optional().describe("서버 측 해시태그 검색 (쉼표 구분)"),
        openOnly: z.boolean().optional().describe("마감 공고 제외"),
        limit,
      },
      annotations: readOnly,
    },
    wrap((a) => searchBizinfo(a, env)),
  );

  server.registerTool(
    "search_kstartup",
    {
      title: "K-Startup 창업지원사업 공고 검색",
      description: "창업진흥원 K-Startup의 창업지원사업 공고(예비·초기·도약패키지, 사관학교 등)를 검색합니다. DATA_GO_KR_API_KEY 필요 (데이터셋 15125364 활용신청).",
      inputSchema: {
        keyword: z.string().optional().describe("공고명 검색어"),
        region: z.string().optional().describe("지원지역 (예: 서울, 경기)"),
        target: z.string().optional().describe("신청대상 (예: 예비창업자, 일반기업, 대학생)"),
        businessAge: z.string().optional().describe("창업업력 (예: 예비창업자, 1년미만, 3년미만, 7년미만)"),
        category: z.string().optional().describe("지원분야 (예: 사업화, 기술개발(R&D), 멘토링ㆍ컨설팅ㆍ교육, 시설ㆍ공간ㆍ보육)"),
        openOnly: z.boolean().optional().describe("모집중만 (기본 true)"),
        limit,
      },
      annotations: readOnly,
    },
    wrap((a) => searchKstartup(a, env)),
  );

  server.registerTool(
    "search_gov24_benefits",
    {
      title: "보조금24 공공서비스(혜택) 검색",
      description: "행정안전부 보조금24의 중앙부처·지자체·공공기관 혜택(보조금·바우처·감면 등)을 서비스명으로 검색합니다. DATA_GO_KR_API_KEY 필요 (데이터셋 15113968).",
      inputSchema: {
        keyword: z.string().optional().describe("서비스명 검색어 (예: 고용, 청년, 소상공인)"),
        userType: z.string().optional().describe("사용자구분 (예: 개인, 소상공인, 법인/시설/단체)"),
        category: z.string().optional().describe("서비스분야 (예: 고용·창업, 보육·교육, 주거·자립)"),
        organization: z.string().optional().describe("소관기관명 일부 (예: 서울특별시, 고용노동부)"),
        limit,
      },
      annotations: readOnly,
    },
    wrap((a) => searchGov24(a, env)),
  );

  server.registerTool(
    "get_gov24_benefit_detail",
    {
      title: "보조금24 혜택 상세 조회",
      description: "보조금24 서비스 ID로 지원대상·선정기준·지원내용·신청방법·구비서류 등 상세를 조회합니다.",
      inputSchema: { serviceId: z.string().min(1).describe("search_gov24_benefits 결과의 id") },
      annotations: readOnly,
    },
    wrap(({ serviceId }) => getGov24Detail(serviceId, env)),
  );

  return server;
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const server = createServer();
  await server.connect(new StdioServerTransport());
  console.error("gov-support MCP 서버 실행 중 (stdio)");
}
