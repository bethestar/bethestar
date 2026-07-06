import Link from "next/link";
import { cn } from "@/lib/utils";

/** URL 쿼리 기반 탭 (서버 렌더 친화적) */
export function LinkTabs({
  tabs,
  active,
  basePath,
  param = "tab",
}: {
  tabs: { key: string; label: string }[];
  active: string;
  basePath: string;
  param?: string;
}) {
  return (
    <div className="flex gap-1 border-b border-base">
      {tabs.map((t) => {
        const isActive = t.key === active;
        const href =
          t.key === tabs[0].key ? basePath : `${basePath}?${param}=${t.key}`;
        return (
          <Link
            key={t.key}
            href={href}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-muted hover:text-base-fg",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
