import Link from "next/link";
import {
  CheckSquare,
  AlertTriangle,
  CalendarClock,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveRulesAndHolidays, upcomingDeadlines } from "@/lib/data/deadlines";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { DdayBadge } from "@/components/ui/dday-badge";
import { TaskStatusBadge } from "@/components/ui/status-badge";
import { formatKRW, formatDate, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

function StatCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">{label}</span>
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
            {icon}
          </span>
        </div>
        <p className="mt-3 text-2xl font-bold tabular-nums text-base-fg">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const profile = await getSessionProfile();
  if (!profile) return null;
  const supabase = await createClient();
  const todayStr = new Date().toISOString().slice(0, 10);

  const [
    myTasksRes,
    overdueRes,
    invoicesRes,
    notifsRes,
    inProgressRes,
    deadlineData,
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("assignee_id", profile.userId)
      .in("status", ["todo", "doing"]),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .lt("due_date", todayStr)
      .neq("status", "done"),
    supabase
      .from("invoices")
      .select("amount, status")
      .in("status", ["issued", "overdue"]),
    supabase
      .from("notifications")
      .select("id, type, title, body, link, read_at, created_at")
      .eq("user_id", profile.userId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("tasks")
      .select("id, title, status, due_date, priority, clients(name)")
      .in("status", ["doing", "review"])
      .order("due_date", { ascending: true })
      .limit(6),
    getEffectiveRulesAndHolidays(profile.orgId),
  ]);

  const unpaidTotal = (invoicesRes.data ?? []).reduce((s, i) => s + i.amount, 0);
  const upcoming = upcomingDeadlines(
    deadlineData.rules,
    deadlineData.holidays,
  ).slice(0, 6);
  const d7Count = upcoming.filter((u) => u.dday <= 7).length;

  return (
    <>
      <PageHeader
        title={`안녕하세요, ${profile.name}님`}
        description="오늘의 사무소 현황을 한눈에 확인하세요."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<CheckSquare className="h-4 w-4 text-blue-600" />}
          label="내 할 일"
          value={`${myTasksRes.count ?? 0}건`}
          sub="대기·진행 중"
          tone="bg-blue-50 dark:bg-blue-950"
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
          label="지연 업무"
          value={`${overdueRes.count ?? 0}건`}
          sub="기한 경과·미완료"
          tone="bg-red-50 dark:bg-red-950"
        />
        <StatCard
          icon={<CalendarClock className="h-4 w-4 text-amber-600" />}
          label="임박 기한"
          value={`${d7Count}건`}
          sub="D-7 이내 신고기한"
          tone="bg-amber-50 dark:bg-amber-950"
        />
        <StatCard
          icon={<Wallet className="h-4 w-4 text-green-600" />}
          label="미수금"
          value={formatKRW(unpaidTotal)}
          sub="청구·연체 합계"
          tone="bg-green-50 dark:bg-green-950"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* 다가오는 기한 */}
        <Card>
          <CardHeader>
            <CardTitle>다가오는 신고 기한</CardTitle>
            <Link href="/calendar" className="text-xs text-[var(--color-primary)]">
              캘린더 <ArrowRight className="inline h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <EmptyState title="다가오는 기한이 없습니다" description="120일 이내 신고 기한이 없습니다." />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {upcoming.map((u) => (
                  <li key={`${u.code}-${u.date.toISOString()}`} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium text-base-fg">{u.name}</p>
                      <p className="text-xs text-muted">{formatDate(u.date)}</p>
                    </div>
                    <DdayBadge target={u.date} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* 최근 알림 */}
        <Card>
          <CardHeader>
            <CardTitle>최근 알림</CardTitle>
            <Link href="/notifications" className="text-xs text-[var(--color-primary)]">
              전체 <ArrowRight className="inline h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {(notifsRes.data ?? []).length === 0 ? (
              <EmptyState title="알림이 없습니다" />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {(notifsRes.data ?? []).map((n) => (
                  <li key={n.id} className="flex items-start gap-3 py-2.5">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read_at ? "bg-[var(--border)]" : "bg-[var(--color-primary)]"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-base-fg">{n.title}</p>
                      {n.body && <p className="truncate text-xs text-muted">{n.body}</p>}
                    </div>
                    <span className="shrink-0 text-xs text-muted">{timeAgo(n.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 진행 중 업무 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>진행 중인 업무</CardTitle>
          <Link href="/tasks" className="text-xs text-[var(--color-primary)]">
            업무 보드 <ArrowRight className="inline h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {(inProgressRes.data ?? []).length === 0 ? (
            <EmptyState title="진행 중인 업무가 없습니다" description="새 업무를 생성하거나 시즌 업무를 일괄 생성하세요." />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {(inProgressRes.data ?? []).map((t) => {
                const client = t.clients as unknown as { name: string } | null;
                return (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-base-fg">{t.title}</p>
                      <p className="text-xs text-muted">
                        {client?.name ?? "사무소 업무"}
                        {t.due_date && ` · 기한 ${formatDate(t.due_date)}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {t.due_date && <DdayBadge target={t.due_date} />}
                      <TaskStatusBadge status={t.status} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
