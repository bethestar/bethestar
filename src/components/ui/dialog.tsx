"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 경량 모달. trigger 를 클릭하면 열리고, 오버레이/X/ESC 로 닫힌다.
 * 외부 UI 라이브러리 없이 자체 구현.
 */
export function Dialog({
  trigger,
  title,
  description,
  children,
  className,
}: {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  return (
    <>
      <span onClick={() => setOpen(true)} className="contents">
        {trigger}
      </span>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <div
            className={cn(
              "relative w-full max-w-lg rounded-[var(--radius)] border border-base bg-surface shadow-lg",
              className,
            )}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between border-b border-base px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-base-fg">{title}</h2>
                {description && (
                  <p className="mt-0.5 text-sm text-muted">{description}</p>
                )}
              </div>
              <button
                onClick={close}
                className="rounded-md p-1 text-muted hover:bg-surface-2"
                aria-label="닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 py-4">
              {typeof children === "function" ? children(close) : children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
