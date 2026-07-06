import { Zap, Clock, CheckSquare, Bell } from "lucide-react";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { RuleToggle } from "@/components/automation/rule-toggle";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TRIGGER_LABEL: Record<string, string> = {
  deadline: "신고기한 기준",
  monthly_day: "매월 지정일",
  status: "상태 변화",
};

function describeTrigger(type: string, config: Record<string, unknown>): string {
  if (type === "deadline")
    return `${config.rule_code} 기한 D-${config.days_before}`;
  if (type === "monthly_day") return `매월 ${config.day}일`;
  return "상태 변화 시";
}

export default async function AutomationPage() {
  const profile = await getSessionProfile();
  if (!profile) return null;
  const supabase = await createClient();
  const isAdmin = profile.role === "admin";

  const [{ data: rules }, { data: runs }] = await Promise.all([
    supabase
      .from("automation_rules")
      .select("id, name, trigger_type, trigger_config, action_type, action_config, active")
      .eq("org_id", profile.orgId)
      .order("created_at"),
    supabase
      .from("automation_runs")
      .select("id, run_key, ran_at, result, automation_rules(name)")
      .order("ran_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <>
      <PageHeader
        title="자동화"
        description="신고기한·일자 트리거로 업무와 알림을 자동 생성합니다. 매일 00:10(KST) 실행."
      />

      {!isAdmin && (
        <p className="mb-4 rounded-[var(--radius)] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          자동화 규칙 변경은 대표(admin) 권한이 필요합니다. 조회만 가능합니다.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {(rules ?? []).length === 0 ? (
          <div className="md:col-span-2">
            <EmptyState icon={<Zap className="h-8 w-8" />} title="자동화 규칙이 없습니다" />
          </div>
        ) : (
          (rules ?? []).map((r) => (
            <Card key={r.id}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary-50)] text-[var(--color-primary-700)] dark:bg-surface-2">
                      {r.action_type === "create_tasks" ? <CheckSquare className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                    </span>
                    <div>
                      <p className="font-semibold text-base-fg">{r.name}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <Badge tone="info"><Clock className="h-3 w-3" /> {TRIGGER_LABEL[r.trigger_type]}</Badge>
                        <Badge tone="neutral">{describeTrigger(r.trigger_type, r.trigger_config)}</Badge>
                        <Badge tone="primary">{r.action_type === "create_tasks" ? "태스크 생성" : "알림"}</Badge>
                      </div>
                    </div>
                  </div>
                  {isAdmin ? (
                    <RuleToggle id={r.id} active={r.active} />
                  ) : (
                    <Badge tone={r.active ? "success" : "neutral"}>{r.active ? "ON" : "OFF"}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>실행 이력</CardTitle></CardHeader>
        <CardContent>
          {(runs ?? []).length === 0 ? (
            <EmptyState title="실행 이력이 없습니다" description="자동화가 실행되면 여기에 기록됩니다." />
          ) : (
            <Table>
              <THead>
                <TR><TH>규칙</TH><TH>실행 키</TH><TH>결과</TH><TH>실행 시각</TH></TR>
              </THead>
              <TBody>
                {(runs ?? []).map((run) => {
                  const rule = run.automation_rules as unknown as { name: string } | null;
                  const result = run.result as { created?: number; skipped?: number } | null;
                  return (
                    <TR key={run.id}>
                      <TD className="font-medium">{rule?.name ?? "-"}</TD>
                      <TD className="font-mono text-xs text-muted">{run.run_key}</TD>
                      <TD>
                        {result?.created !== undefined && <Badge tone="success">생성 {result.created}</Badge>}{" "}
                        {result?.skipped ? <Badge tone="neutral">건너뜀 {result.skipped}</Badge> : null}
                      </TD>
                      <TD className="text-muted">{formatDateTime(run.ran_at)}</TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
