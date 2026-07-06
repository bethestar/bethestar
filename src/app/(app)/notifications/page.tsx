import Link from "next/link";
import {
  Bell,
  CalendarClock,
  UserPlus,
  AlertTriangle,
  AtSign,
  Wallet,
  Settings as SettingsIcon,
} from "lucide-react";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  MarkReadButton,
  MarkAllReadButton,
} from "@/components/notifications/notification-actions";
import { timeAgo, NOTIFICATION_TYPE_LABEL, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ICONS: Record<string, React.ReactNode> = {
  deadline: <CalendarClock className="h-4 w-4 text-amber-600" />,
  task_assigned: <UserPlus className="h-4 w-4 text-blue-600" />,
  task_overdue: <AlertTriangle className="h-4 w-4 text-red-600" />,
  mention: <AtSign className="h-4 w-4 text-purple-600" />,
  billing: <Wallet className="h-4 w-4 text-green-600" />,
  system: <SettingsIcon className="h-4 w-4 text-slate-500" />,
};

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const sp = await searchParams;
  const profile = await getSessionProfile();
  if (!profile) return null;
  const supabase = await createClient();

  let query = supabase
    .from("notifications")
    .select("id, type, title, body, link, read_at, created_at")
    .eq("user_id", profile.userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (sp.type) query = query.eq("type", sp.type);

  const { data: notifs } = await query;
  const rows = notifs ?? [];

  const filters = [{ key: "", label: "전체" }, ...Object.entries(NOTIFICATION_TYPE_LABEL).map(([k, v]) => ({ key: k, label: v }))];

  return (
    <>
      <PageHeader
        title="알림"
        description="자동화·업무 배정·기한 임박 알림을 확인합니다."
        action={<MarkAllReadButton />}
      />

      <div className="mb-4 flex flex-wrap gap-1">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={f.key ? `/notifications?type=${f.key}` : "/notifications"}
            className={cn("rounded-full px-3 py-1.5 text-sm font-medium", (sp.type ?? "") === f.key ? "bg-[var(--color-primary)] text-white" : "bg-surface text-muted hover:bg-surface-2")}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<Bell className="h-8 w-8" />} title="알림이 없습니다" description="새로운 알림이 도착하면 여기에 표시됩니다." />
      ) : (
        <Card>
          <ul className="divide-y divide-[var(--border)]">
            {rows.map((n) => (
              <li key={n.id} className={cn("flex items-start gap-3 px-4 py-3", !n.read_at && "bg-[var(--color-primary-50)]/40 dark:bg-surface-2/40")}>
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2">{ICONS[n.type]}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-base-fg">{n.title}</p>
                    {!n.read_at && <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />}
                  </div>
                  {n.body && <p className="mt-0.5 text-sm text-muted">{n.body}</p>}
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted">
                    <span>{timeAgo(n.created_at)}</span>
                    {n.link && <Link href={n.link} className="text-[var(--color-primary)] hover:underline">바로가기</Link>}
                  </div>
                </div>
                {!n.read_at && <MarkReadButton id={n.id} />}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
