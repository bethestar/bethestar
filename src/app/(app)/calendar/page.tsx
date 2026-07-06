import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveRulesAndHolidays } from "@/lib/data/deadlines";
import { generateYearDeadlines, toISODate } from "@/lib/deadlines";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddEventButton } from "@/components/calendar/add-event";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const eventTone: Record<string, string> = {
  internal: "bg-blue-500",
  leave: "bg-purple-500",
  training: "bg-emerald-500",
  deadline: "bg-amber-500",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  const sp = await searchParams;
  const profile = await getSessionProfile();
  if (!profile) return null;

  const now = new Date();
  const year = sp.y ? parseInt(sp.y) : now.getFullYear();
  const month = sp.m ? parseInt(sp.m) : now.getMonth() + 1; // 1-12

  const supabase = await createClient();
  const { rules, holidays } = await getEffectiveRulesAndHolidays(profile.orgId);

  // 해당 월 신고기한
  const deadlines = generateYearDeadlines(rules, year, holidays).filter(
    (d) => d.date.getUTCMonth() + 1 === month,
  );

  // 해당 월 사내 일정
  const monthStart = new Date(Date.UTC(year, month - 1, 1)).toISOString();
  const monthEnd = new Date(Date.UTC(year, month, 1)).toISOString();
  const { data: events } = await supabase
    .from("events")
    .select("id, title, starts_at, kind")
    .eq("org_id", profile.orgId)
    .gte("starts_at", monthStart)
    .lt("starts_at", monthEnd);

  // 날짜별 매핑
  type Item = { label: string; tone: string; isDeadline: boolean };
  const byDay = new Map<number, Item[]>();
  for (const d of deadlines) {
    const day = d.date.getUTCDate();
    const arr = byDay.get(day) ?? [];
    arr.push({ label: d.name, tone: eventTone.deadline, isDeadline: true });
    byDay.set(day, arr);
  }
  for (const e of events ?? []) {
    const dt = new Date(e.starts_at);
    const day = dt.getDate();
    const arr = byDay.get(day) ?? [];
    arr.push({ label: e.title, tone: eventTone[e.kind] ?? eventTone.internal, isDeadline: false });
    byDay.set(day, arr);
  }

  // 그리드 생성
  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  const todayStr = toISODate(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));

  return (
    <>
      <PageHeader
        title="세무 캘린더"
        description="신고 기한과 사내 일정을 한 화면에서 관리합니다."
        action={<AddEventButton />}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">{year}년 {month}월</CardTitle>
            <div className="flex gap-1">
              <Link href={`/calendar?y=${prev.y}&m=${prev.m}`} className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius)] border border-base hover:bg-surface-2"><ChevronLeft className="h-4 w-4" /></Link>
              <Link href="/calendar" className="inline-flex h-8 items-center rounded-[var(--radius)] border border-base px-3 text-sm hover:bg-surface-2">오늘</Link>
              <Link href={`/calendar?y=${next.y}&m=${next.m}`} className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius)] border border-base hover:bg-surface-2"><ChevronRight className="h-4 w-4" /></Link>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />신고기한</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" />회의</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-500" />휴가</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />교육</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 border-l border-t border-base">
            {WEEKDAYS.map((w, i) => (
              <div key={w} className={cn("border-b border-r border-base bg-surface-2 py-2 text-center text-xs font-semibold", i === 0 && "text-red-500", i === 6 && "text-blue-500")}>
                {w}
              </div>
            ))}
            {cells.map((day, idx) => {
              const dow = idx % 7;
              const iso = day ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
              const isToday = iso === todayStr;
              const isHoliday = !!day && holidays.has(iso);
              const items = day ? byDay.get(day) ?? [] : [];
              return (
                <div key={idx} className={cn("min-h-24 border-b border-r border-base p-1.5", !day && "bg-surface-2/40")}>
                  {day && (
                    <>
                      <div className="mb-1 flex items-center justify-between">
                        <span className={cn(
                          "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-medium",
                          isToday && "bg-[var(--color-primary)] text-white",
                          !isToday && dow === 0 && "text-red-500",
                          !isToday && dow === 6 && "text-blue-500",
                          !isToday && isHoliday && "text-red-500",
                        )}>
                          {day}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {items.slice(0, 3).map((it, i) => (
                          <div key={i} className={cn("flex items-center gap-1 truncate rounded px-1 py-0.5 text-[11px]", it.isDeadline ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300" : "bg-surface-2 text-base-fg")}>
                            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", it.tone)} />
                            <span className="truncate">{it.label}</span>
                          </div>
                        ))}
                        {items.length > 3 && <p className="px-1 text-[10px] text-muted">+{items.length - 3}건</p>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {deadlines.length === 0 && (events ?? []).length === 0 && (
        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted">
          <CalendarDays className="h-4 w-4" /> 이번 달 신고 기한이나 일정이 없습니다.
        </p>
      )}
    </>
  );
}
