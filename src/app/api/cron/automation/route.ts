import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mergeRules } from "@/lib/data/deadlines";
import {
  evaluateTrigger,
  filterClients,
  buildTasks,
  resolveFilter,
  type AutomationRule,
  type ClientLite,
} from "@/lib/automation";
import { type DeadlineRule } from "@/lib/deadlines";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron → 자동화 엔진 (구현설계서 §4).
 * 멱등성은 automation_runs(run_key) 및 tasks(period_key) 유니크로 보장.
 */
async function handle(request: NextRequest) {
  // CRON_SECRET 검증 (I-01)
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const headerSecret = request.headers.get("x-cron-secret");
  const authorized =
    !!secret && (auth === `Bearer ${secret}` || headerSecret === secret);
  if (!authorized) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    );
  }

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // 공통 데이터 로드
  const [{ data: rules }, { data: ruleRows }, { data: holidayRows }] =
    await Promise.all([
      admin.from("automation_rules").select("*").eq("active", true),
      admin
        .from("tax_deadline_rules")
        .select("org_id, code, name, description, month, day, frequency, applies_to, rollover, active"),
      admin.from("holidays").select("date"),
    ]);

  const holidays = new Set<string>((holidayRows ?? []).map((h) => h.date));
  const summary: Record<string, unknown>[] = [];

  for (const rule of (rules ?? []) as AutomationRule[]) {
    const orgRules: DeadlineRule[] = mergeRules(
      (ruleRows ?? []).filter(
        (r) => r.org_id === null || r.org_id === rule.org_id,
      ) as never,
      rule.org_id,
    );

    const evalRes = evaluateTrigger(rule, today, orgRules, holidays);
    if (!evalRes.fire) continue;

    // 멱등: run_key 존재 확인
    const { data: existing } = await admin
      .from("automation_runs")
      .select("id")
      .eq("rule_id", rule.id)
      .eq("run_key", evalRes.runKey)
      .maybeSingle();
    if (existing) {
      summary.push({ rule: rule.name, skipped: true });
      continue;
    }

    let created = 0;
    let skipped = 0;

    if (rule.action_type === "create_tasks") {
      const { data: clients } = await admin
        .from("clients")
        .select("id, status, vat_applicable, withholding, client_type, assignee_id, name")
        .eq("org_id", rule.org_id);
      const targets = filterClients((clients ?? []) as ClientLite[], resolveFilter(rule));
      const rows = buildTasks(rule, targets, evalRes).map((t) => ({
        ...t,
        created_at: new Date().toISOString(),
      }));

      if (rows.length > 0) {
        const { data: inserted } = await admin
          .from("tasks")
          .upsert(rows, {
            onConflict: "org_id,client_id,period_key",
            ignoreDuplicates: true,
          })
          .select("id, assignee_id, title");
        created = inserted?.length ?? 0;
        skipped = rows.length - created;

        // 담당자 알림
        const notifs = (inserted ?? [])
          .filter((t) => t.assignee_id)
          .map((t) => ({
            org_id: rule.org_id,
            user_id: t.assignee_id as string,
            type: "task_assigned" as const,
            title: "자동 생성된 업무",
            body: t.title,
            link: "/tasks",
          }));
        if (notifs.length > 0) await admin.from("notifications").insert(notifs);
      }
    } else if (rule.action_type === "notify") {
      // 대상: 활성 거래처 담당자에게 기한 알림
      const { data: members } = await admin
        .from("profiles")
        .select("id")
        .eq("org_id", rule.org_id)
        .eq("is_active", true);
      const notifs = (members ?? []).map((m) => ({
        org_id: rule.org_id,
        user_id: m.id,
        type: "deadline" as const,
        title: rule.name,
        body: String(rule.action_config.message ?? "신고 기한이 임박했습니다."),
        link: "/calendar",
      }));
      if (notifs.length > 0) await admin.from("notifications").insert(notifs);
      created = notifs.length;
    }

    await admin.from("automation_runs").insert({
      rule_id: rule.id,
      run_key: evalRes.runKey,
      result: { created, skipped },
    });
    summary.push({ rule: rule.name, created, skipped });
  }

  // 지연 태스크 스캔 → task_overdue 알림 (org별 1일 1회)
  const { data: orgs } = await admin.from("orgs").select("id");
  for (const org of orgs ?? []) {
    const overdueRunKey = `overdue:${todayStr}`;
    // org별 멱등: automation_runs 대용으로 rule_id 없는 키를 쓸 수 없으므로
    // 오늘 이미 생성된 task_overdue 알림 존재 여부로 판정
    const { data: overdueTasks } = await admin
      .from("tasks")
      .select("id, title, assignee_id")
      .eq("org_id", org.id)
      .lt("due_date", todayStr)
      .neq("status", "done")
      .not("assignee_id", "is", null);

    if (!overdueTasks || overdueTasks.length === 0) continue;

    const { data: alreadyToday } = await admin
      .from("notifications")
      .select("id")
      .eq("org_id", org.id)
      .eq("type", "task_overdue")
      .gte("created_at", `${todayStr}T00:00:00Z`)
      .limit(1);
    if (alreadyToday && alreadyToday.length > 0) continue;

    const notifs = overdueTasks.map((t) => ({
      org_id: org.id,
      user_id: t.assignee_id as string,
      type: "task_overdue" as const,
      title: "지연된 업무가 있습니다",
      body: t.title,
      link: "/tasks",
    }));
    await admin.from("notifications").insert(notifs);
    summary.push({ org: org.id, overdue_notified: notifs.length, key: overdueRunKey });
  }

  return NextResponse.json({ ok: true, ran_at: today.toISOString(), summary });
}

export async function POST(request: NextRequest) {
  return handle(request);
}

// Vercel Cron 은 GET 으로 호출
export async function GET(request: NextRequest) {
  return handle(request);
}
