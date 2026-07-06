import Link from "next/link";
import { Bell, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "@/lib/actions/auth";
import { ROLE_LABEL } from "@/lib/utils";

export function Topbar({
  name,
  role,
  unread,
}: {
  name: string;
  role: string;
  unread: number;
}) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-end gap-1 border-b border-base bg-surface/80 px-4 backdrop-blur md:px-6">
      <Link
        href="/notifications"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius)] text-muted hover:bg-surface-2"
        aria-label="알림"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--color-danger)]" />
        )}
      </Link>
      <ThemeToggle />
      <div className="mx-2 hidden text-right sm:block">
        <p className="text-sm font-semibold leading-tight text-base-fg">{name}</p>
        <p className="text-xs text-muted">{ROLE_LABEL[role] ?? role}</p>
      </div>
      <form action={signOut}>
        <button
          type="submit"
          className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius)] text-muted hover:bg-surface-2"
          aria-label="로그아웃"
          title="로그아웃"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </form>
    </header>
  );
}
