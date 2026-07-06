import Link from "next/link";
import { List, LayoutGrid, CheckSquare } from "lucide-react";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { DdayBadge } from "@/components/ui/dday-badge";
import { PriorityBadge } from "@/components/ui/status-badge";
import {
  NewTaskButton,
  BulkCreateButton,
  TaskStatusSelect,
} from "@/components/tasks/task-controls";
import { formatDate, TASK_STATUS_LABEL, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const COLUMNS = ["todo", "doing", "review", "done"] as const;

interface TaskRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  source: string;
  clients: { name: string } | null;
  profiles: { name: string } | null;
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const sp = await searchParams;
  const view = sp.view === "list" ? "list" : "board";
  const profile = await getSessionProfile();
  if (!profile) return null;
  const supabase = await createClient();

  const [{ data: tasks }, { data: members }, { data: clients }, { data: templates }] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("id, title, status, priority, due_date, source, clients(name), profiles:assignee_id(name)")
        .eq("org_id", profile.orgId)
        .order("due_date", { ascending: true, nullsFirst: false }),
      supabase.from("profiles").select("id, name").eq("org_id", profile.orgId).eq("is_active", true),
      supabase.from("clients").select("id, name").eq("org_id", profile.orgId).eq("status", "active"),
      supabase.from("task_templates").select("id, name").eq("org_id", profile.orgId),
    ]);

  const rows = (tasks ?? []) as unknown as TaskRow[];
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader
        title="업무"
        description={`총 ${rows.length}건 · 지연 ${rows.filter((t) => t.due_date && t.due_date < todayStr && t.status !== "done").length}건`}
        action={
          <div className="flex gap-2">
            <NewTaskButton members={members ?? []} clients={clients ?? []} />
            <BulkCreateButton templates={templates ?? []} />
          </div>
        }
      />

      <div className="mb-4 inline-flex rounded-[var(--radius)] border border-base bg-surface p-0.5">
        <Link href="/tasks?view=board" className={cn("inline-flex items-center gap-1.5 rounded-[calc(var(--radius)-2px)] px-3 py-1.5 text-sm font-medium", view === "board" ? "bg-surface-2 text-base-fg" : "text-muted")}>
          <LayoutGrid className="h-4 w-4" /> 칸반
        </Link>
        <Link href="/tasks?view=list" className={cn("inline-flex items-center gap-1.5 rounded-[calc(var(--radius)-2px)] px-3 py-1.5 text-sm font-medium", view === "list" ? "bg-surface-2 text-base-fg" : "text-muted")}>
          <List className="h-4 w-4" /> 리스트
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="h-8 w-8" />}
          title="업무가 없습니다"
          description="업무를 추가하거나 시즌 일괄생성으로 신고 업무를 한 번에 만드세요."
        />
      ) : view === "board" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => {
            const colTasks = rows.filter((t) => t.status === col);
            return (
              <div key={col} className="rounded-[var(--radius)] bg-surface-2/60 p-2">
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-sm font-semibold text-base-fg">{TASK_STATUS_LABEL[col]}</span>
                  <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted">{colTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {colTasks.map((t) => {
                    const overdue = t.due_date && t.due_date < todayStr && t.status !== "done";
                    return (
                      <Card key={t.id} className={cn("p-3", overdue && "border-red-300 dark:border-red-900")}>
                        <p className="mb-2 text-sm font-medium text-base-fg">{t.title}</p>
                        <div className="mb-2 flex flex-wrap items-center gap-1.5">
                          <PriorityBadge priority={t.priority} />
                          {t.due_date && t.status !== "done" && <DdayBadge target={t.due_date} />}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted">
                          <span className="truncate">{t.clients?.name ?? "사무소"} · {t.profiles?.name ?? "미배정"}</span>
                        </div>
                        <div className="mt-2"><TaskStatusSelect taskId={t.id} status={t.status} /></div>
                      </Card>
                    );
                  })}
                  {colTasks.length === 0 && <p className="px-1 py-6 text-center text-xs text-muted">없음</p>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <Table>
            <THead>
              <TR><TH>업무</TH><TH>거래처</TH><TH>담당자</TH><TH>기한</TH><TH>D-day</TH><TH>우선순위</TH><TH>상태</TH></TR>
            </THead>
            <TBody>
              {rows.map((t) => {
                const overdue = t.due_date && t.due_date < todayStr && t.status !== "done";
                return (
                  <TR key={t.id} className={cn(overdue && "bg-red-50/50 dark:bg-red-950/20")}>
                    <TD className="font-medium">{t.title}</TD>
                    <TD className="text-muted">{t.clients?.name ?? "사무소"}</TD>
                    <TD className="text-muted">{t.profiles?.name ?? "미배정"}</TD>
                    <TD className="text-muted">{formatDate(t.due_date)}</TD>
                    <TD>{t.due_date && t.status !== "done" ? <DdayBadge target={t.due_date} /> : "-"}</TD>
                    <TD><PriorityBadge priority={t.priority} /></TD>
                    <TD><TaskStatusSelect taskId={t.id} status={t.status} /></TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </Card>
      )}
    </>
  );
}
