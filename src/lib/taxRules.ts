import "server-only";

// 국세청 기본통칙 데이터 (data/tax-rules/*.pdf → scripts/build-tax-rules.mjs → src/data/tax-rules/*.json)

export interface TaxRuleHeading {
  kind: "heading";
  level: number; // 0 편, 1 장, 2 절, 3 관
  text: string;
}

export interface TaxRule {
  kind: "rule";
  no: string; // 2-0…1
  anchor: string; // r2-0-1
  lawArticle: string; // 2, 2의2
  lawAnchor: string; // 법 조문 앵커 a2, a2-2
  title: string;
  paragraphs: string[];
  deleted: boolean;
}

export interface TaxRuleDoc {
  id: string;
  lawName: string;
  title: string; // 법인세법 2024년 기본통칙
  year: number;
  sourceFile: string;
  source: string;
  ruleCount: number;
  items: (TaxRuleHeading | TaxRule)[];
}

/** 메뉴 세목 id → 통칙 데이터. 새 세법 PDF 를 추가하면 여기에도 등록한다. */
const LOADERS: Record<string, () => Promise<unknown>> = {
  "corporate-tax": () => import("@/data/tax-rules/corporate-tax.json"),
  "national-tax-basic": () => import("@/data/tax-rules/national-tax-basic.json"),
};

export function hasTaxRules(lawId: string): boolean {
  return lawId in LOADERS;
}

export async function getTaxRules(lawId: string): Promise<TaxRuleDoc | null> {
  const load = LOADERS[lawId];
  if (!load) return null;
  const mod = (await load()) as { default: TaxRuleDoc };
  return mod.default;
}

export interface RuleRef {
  no: string;
  title: string;
  anchor: string;
}

/** 법 조문 앵커(a2) → 그 조문에 딸린 통칙 목록 (삭제된 통칙 제외). */
export async function getRulesByLawArticle(lawId: string): Promise<Record<string, RuleRef[]>> {
  const doc = await getTaxRules(lawId);
  const map: Record<string, RuleRef[]> = {};
  for (const it of doc?.items ?? []) {
    if (it.kind !== "rule" || it.deleted) continue;
    (map[it.lawAnchor] ??= []).push({ no: it.no, title: it.title, anchor: it.anchor });
  }
  return map;
}
