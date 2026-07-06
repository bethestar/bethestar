import { describe, it, expect } from "vitest";
import {
  evaluateTrigger,
  filterClients,
  buildTasks,
  resolveFilter,
  type AutomationRule,
  type ClientLite,
} from "@/lib/automation";
import { type DeadlineRule } from "@/lib/deadlines";

const WHT: DeadlineRule = {
  code: "WHT_MONTHLY",
  name: "원천세",
  month: null,
  day: 10,
  frequency: "monthly",
  rollover: true,
};

const deadlineRule: AutomationRule = {
  id: "rule-1",
  org_id: "org-1",
  name: "원천세 D-3 태스크",
  trigger_type: "deadline",
  trigger_config: { rule_code: "WHT_MONTHLY", days_before: 3 },
  action_type: "create_tasks",
  action_config: { title: "원천세 준비", filter: "withholding", priority: "high" },
  active: true,
};

const monthlyRule: AutomationRule = {
  id: "rule-2",
  org_id: "org-1",
  name: "매월 1일 태스크",
  trigger_type: "monthly_day",
  trigger_config: { day: 1 },
  action_type: "create_tasks",
  action_config: { title: "월초 준비", filter: "all", priority: "normal" },
  active: true,
};

const clients: ClientLite[] = [
  { id: "c1", status: "active", vat_applicable: true, withholding: true, client_type: "corp", assignee_id: "u1", name: "한빛테크" },
  { id: "c2", status: "active", vat_applicable: false, withholding: true, client_type: "exempt", assignee_id: "u2", name: "행복요양병원" },
  { id: "c3", status: "active", vat_applicable: true, withholding: true, client_type: "general", assignee_id: null, name: "민들레카페" },
  { id: "c4", status: "terminated", vat_applicable: true, withholding: true, client_type: "corp", assignee_id: "u1", name: "폐업컨설팅" },
];

describe("automation", () => {
  it("U-A-01 deadline 트리거: 오늘 == 기한 - days_before → 실행", () => {
    // 2026-07 원천세 기한 = 2026-07-10(금). days_before=3 → 오늘 2026-07-07
    const today = new Date(Date.UTC(2026, 6, 7));
    const res = evaluateTrigger(deadlineRule, today, [WHT]);
    expect(res.fire).toBe(true);
    expect(res.deadlineDate && res.deadlineDate.getUTCDate()).toBe(10);
  });

  it("U-A-02 deadline 트리거: 날짜 불일치 → 실행 안 함", () => {
    const today = new Date(Date.UTC(2026, 6, 6)); // dday=4 ≠ 3
    const res = evaluateTrigger(deadlineRule, today, [WHT]);
    expect(res.fire).toBe(false);
  });

  it("U-A-03 monthly_day 트리거: 오늘 일자 일치 → 실행", () => {
    const today = new Date(Date.UTC(2026, 6, 1));
    const res = evaluateTrigger(monthlyRule, today, [WHT]);
    expect(res.fire).toBe(true);
    const notFirst = evaluateTrigger(monthlyRule, new Date(Date.UTC(2026, 6, 2)), [WHT]);
    expect(notFirst.fire).toBe(false);
  });

  it("U-A-04 동일 run_key 재실행 → 멱등 (키 안정성)", () => {
    const today = new Date(Date.UTC(2026, 6, 7));
    const a = evaluateTrigger(deadlineRule, today, [WHT]);
    const b = evaluateTrigger(deadlineRule, today, [WHT]);
    expect(a.runKey).toBe(b.runKey);
    expect(a.runKey).toContain("rule-1");
    // 실행 이력에 이미 존재하면 skip
    const existing = new Set([a.runKey]);
    expect(existing.has(b.runKey)).toBe(true);
  });

  it("U-A-05 create_tasks: vat 필터 → 부가세 대상만", () => {
    const targets = filterClients(clients, "vat");
    expect(targets.map((c) => c.id).sort()).toEqual(["c1", "c3"]);
  });

  it("U-A-06 create_tasks: 해지 거래처 제외", () => {
    const targets = filterClients(clients, "all");
    expect(targets.find((c) => c.id === "c4")).toBeUndefined();
    expect(targets.length).toBe(3);
  });

  it("U-A-07 태스크 period_key 중복 방지 (멱등키)", () => {
    const today = new Date(Date.UTC(2026, 6, 7));
    const evalRes = evaluateTrigger(deadlineRule, today, [WHT]);
    const targets = filterClients(clients, resolveFilter(deadlineRule));
    const tasks1 = buildTasks(deadlineRule, targets, evalRes);
    const tasks2 = buildTasks(deadlineRule, targets, evalRes);
    // 모든 태스크가 동일 period_key
    for (const t of tasks1) expect(t.period_key).toBe(evalRes.runKey);
    // (client_id, period_key) 유니크 → 두 번 생성해도 중복 제거 시 대상 수와 동일
    const merged = [...tasks1, ...tasks2];
    const keys = new Set(merged.map((t) => `${t.client_id}:${t.period_key}`));
    expect(keys.size).toBe(targets.length);
  });

  it("resolveFilter 는 잘못된 값을 all 로 정규화", () => {
    const r = { ...deadlineRule, action_config: { filter: "xxx" } } as AutomationRule;
    expect(resolveFilter(r)).toBe("all");
  });
});
