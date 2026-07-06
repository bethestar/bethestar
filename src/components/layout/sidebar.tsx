"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  CheckSquare,
  BookOpen,
  Receipt,
  Zap,
  Bell,
  Settings,
  Landmark,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/clients", label: "거래처", icon: Building2 },
  { href: "/calendar", label: "세무 캘린더", icon: CalendarDays },
  { href: "/tasks", label: "업무", icon: CheckSquare },
  { href: "/knowledge", label: "지식저장소", icon: BookOpen },
  { href: "/billing", label: "청구·미수금", icon: Receipt },
  { href: "/automation", label: "자동화", icon: Zap },
  { href: "/notifications", label: "알림", icon: Bell },
  { href: "/settings", label: "설정", icon: Settings },
];

export function Sidebar({
  orgName,
  unread,
}: {
  orgName: string;
  unread: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-0.5 px-3">
      {NAV.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-[var(--color-primary-50)] text-[var(--color-primary-700)] dark:bg-[var(--surface-2)] dark:text-white"
                : "text-muted hover:bg-surface-2 hover:text-base-fg",
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span>{item.label}</span>
            {item.href === "/notifications" && unread > 0 && (
              <span className="ml-auto rounded-full bg-[var(--color-danger)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white">
        <Landmark className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-base-fg">TaxDesk</p>
        <p className="truncate text-xs text-muted">{orgName}</p>
      </div>
    </div>
  );

  return (
    <>
      {/* 모바일 토글 */}
      <button
        onClick={() => setOpen(true)}
        className="fixed left-3 top-3 z-30 inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border border-base bg-surface text-base-fg md:hidden"
        aria-label="메뉴 열기"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* 데스크톱 사이드바 240px 고정 */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-base bg-surface md:flex">
        {brand}
        {nav}
      </aside>

      {/* 모바일 드로어 */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-60 flex-col border-r border-base bg-surface">
            <div className="flex items-center justify-between pr-3">
              {brand}
              <button onClick={() => setOpen(false)} aria-label="닫기">
                <X className="h-5 w-5 text-muted" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
