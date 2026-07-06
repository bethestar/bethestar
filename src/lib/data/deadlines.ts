import { createClient } from "@/lib/supabase/server";
import {
  type DeadlineRule,
  generateYearDeadlines,
  computeDday,
  type DeadlineOccurrence,
} from "@/lib/deadlines";

interface RuleRow {
  org_id: string | null;
  code: string;
  name: string;
  description: string | null;
  month: number | null;
  day: number;
  frequency: DeadlineRule["frequency"];
  applies_to: string;
  rollover: boolean;
  active: boolean;
}

/** 전역 + org 오버라이드 병합 → 유효 규칙 목록 (org 우선) */
export function mergeRules(rows: RuleRow[], orgId: string): DeadlineRule[] {
  const byCode = new Map<string, RuleRow>();
  for (const r of rows) {
    const existing = byCode.get(r.code);
    // org 로컬이 전역보다 우선
    if (!existing || (r.org_id === orgId && existing.org_id === null)) {
      byCode.set(r.code, r);
    }
  }
  return [...byCode.values()]
    .filter((r) => r.active)
    .map((r) => ({
      code: r.code,
      name: r.name,
      month: r.month,
      day: r.day,
      frequency: r.frequency,
      rollover: r.rollover,
      applies_to: r.applies_to,
    }));
}

export async function getEffectiveRulesAndHolidays(orgId: string): Promise<{
  rules: DeadlineRule[];
  holidays: Set<string>;
  allRows: RuleRow[];
}> {
  const supabase = await createClient();
  const [{ data: ruleRows }, { data: holidayRows }] = await Promise.all([
    supabase
      .from("tax_deadline_rules")
      .select("org_id, code, name, description, month, day, frequency, applies_to, rollover, active")
      .or(`org_id.is.null,org_id.eq.${orgId}`),
    supabase.from("holidays").select("date"),
  ]);

  const rows = (ruleRows ?? []) as RuleRow[];
  const holidays = new Set<string>((holidayRows ?? []).map((h) => h.date));
  return { rules: mergeRules(rows, orgId), holidays, allRows: rows };
}

/** 오늘 이후 다가오는 기한 (기본 90일 이내) 정렬 목록 */
export function upcomingDeadlines(
  rules: DeadlineRule[],
  holidays: Set<string>,
  today = new Date(),
  withinDays = 120,
): (DeadlineOccurrence & { dday: number })[] {
  const year = today.getUTCFullYear();
  const all = [
    ...generateYearDeadlines(rules, year, holidays),
    ...generateYearDeadlines(rules, year + 1, holidays),
  ];
  return all
    .map((o) => ({ ...o, dday: computeDday(o.date, today) }))
    .filter((o) => o.dday >= 0 && o.dday <= withinDays)
    .sort((a, b) => a.dday - b.dday);
}
