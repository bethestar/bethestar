/**
 * 자동화 엔진 (구현설계서 §4)
 *  - 트리거 평가 + 대상 필터 + 태스크 생성 + 멱등 run_key
 *  - 검증설계서 U-A-01 ~ U-A-07 충족
 *
 * 순수 함수로 구성하여 DB 없이 단위 테스트 가능. cron 라우트가 이 함수들을 조합한다.
 */

import {
  type DeadlineRule,
  generateYearDeadlines,
  computeDday,
} from "./deadlines";

export type TriggerType = "deadline" | "monthly_day" | "status";
export type ActionType = "create_tasks" | "notify";
export type ClientFilter = "all" | "vat" | "withholding" | "corp" | "individual";

export interface AutomationRule {
  id: string;
  org_id: string;
  name: string;
  trigger_type: TriggerType;
  trigger_config: Record<string, unknown>;
  action_type: ActionType;
  action_config: Record<string, unknown>;
  active: boolean;
}

export interface ClientLite {
  id: string;
  status: string;
  vat_applicable: boolean;
  withholding: boolean;
  client_type: string;
  assignee_id: string | null;
  name: string;
}

export interface TriggerEvaluation {
  fire: boolean;
  runKey: string;
  /** deadline 트리거일 때 대상 기한일 */
  deadlineDate: Date | null;
}

export interface NewTask {
  org_id: string;
  title: string;
  client_id: string;
  assignee_id: string | null;
  due_date: string | null;
  priority: string;
  status: "todo";
  source: "automation";
  rule_code: string | null;
  period_key: string;
}

/** 월 기간키 'YYYY-MM' (UTC) */
export function monthPeriodKey(today: Date): string {
  const y = today.getUTCFullYear();
  const m = String(today.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function isoDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * 트리거 평가 (U-A-01/02/03).
 * @param deadlineRules deadline 트리거가 참조할 신고기한 규칙 목록
 */
export function evaluateTrigger(
  rule: AutomationRule,
  today: Date,
  deadlineRules: DeadlineRule[],
  holidays: Set<string> = new Set(),
): TriggerEvaluation {
  if (!rule.active) {
    return { fire: false, runKey: "", deadlineDate: null };
  }

  if (rule.trigger_type === "deadline") {
    const ruleCode = String(rule.trigger_config.rule_code ?? "");
    const daysBefore = Number(rule.trigger_config.days_before ?? 0);
    const target = deadlineRules.find((r) => r.code === ruleCode);
    if (!target) return { fire: false, runKey: "", deadlineDate: null };

    const year = today.getUTCFullYear();
    const occ = [
      ...generateYearDeadlines([target], year, holidays),
      ...generateYearDeadlines([target], year + 1, holidays),
    ];
    for (const o of occ) {
      // 오늘 == 기한 - days_before  →  기한까지 남은 일수 == days_before
      if (computeDday(o.date, today) === daysBefore) {
        return {
          fire: true,
          runKey: `${rule.id}:${isoDate(o.date)}`,
          deadlineDate: o.date,
        };
      }
    }
    return { fire: false, runKey: "", deadlineDate: null };
  }

  if (rule.trigger_type === "monthly_day") {
    const day = Number(rule.trigger_config.day ?? 0);
    if (today.getUTCDate() === day) {
      return {
        fire: true,
        runKey: `${rule.id}:${monthPeriodKey(today)}`,
        deadlineDate: null,
      };
    }
    return { fire: false, runKey: "", deadlineDate: null };
  }

  // status 트리거는 이벤트 기반 (cron 미평가)
  return { fire: false, runKey: "", deadlineDate: null };
}

/**
 * 대상 거래처 필터 (U-A-05/06).
 * 해지(terminated) 거래처는 항상 제외.
 */
export function filterClients(
  clients: ClientLite[],
  filter: ClientFilter,
): ClientLite[] {
  return clients.filter((c) => {
    if (c.status !== "active") return false; // U-A-06
    switch (filter) {
      case "all":
        return true;
      case "vat":
        return c.vat_applicable; // U-A-05
      case "withholding":
        return c.withholding;
      case "corp":
        return c.client_type === "corp";
      case "individual":
        return c.client_type !== "corp";
      default:
        return true;
    }
  });
}

/**
 * create_tasks 액션의 태스크 행 생성 (U-A-07 멱등키 포함).
 * period_key = runKey → (org, client, period_key) 유니크 인덱스로 이중 생성 방지.
 */
export function buildTasks(
  rule: AutomationRule,
  targets: ClientLite[],
  evaluation: TriggerEvaluation,
): NewTask[] {
  const title = String(rule.action_config.title ?? rule.name);
  const priority = String(rule.action_config.priority ?? "normal");
  const dueDate = evaluation.deadlineDate ? isoDate(evaluation.deadlineDate) : null;
  const ruleCode = (rule.trigger_config.rule_code as string) ?? null;

  return targets.map((c) => ({
    org_id: rule.org_id,
    title: `${title} - ${c.name}`,
    client_id: c.id,
    assignee_id: c.assignee_id,
    due_date: dueDate,
    priority,
    status: "todo",
    source: "automation",
    rule_code: ruleCode,
    period_key: evaluation.runKey,
  }));
}

/** action_config.filter 를 ClientFilter 로 정규화 */
export function resolveFilter(rule: AutomationRule): ClientFilter {
  const f = String(rule.action_config.filter ?? "all");
  if (["all", "vat", "withholding", "corp", "individual"].includes(f)) {
    return f as ClientFilter;
  }
  return "all";
}
