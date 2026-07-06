import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeTone =
  | "neutral"
  | "primary"
  | "success"
  | "warn"
  | "danger"
  | "info";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-muted border border-base",
  primary: "bg-[var(--color-primary-50)] text-[var(--color-primary-700)] border border-[var(--color-primary-100)]",
  success: "bg-green-50 text-green-700 border border-green-100 dark:bg-green-950 dark:text-green-300 dark:border-green-900",
  warn: "bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
  danger: "bg-red-50 text-red-700 border border-red-100 dark:bg-red-950 dark:text-red-300 dark:border-red-900",
  info: "bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
