"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleAutomationRuleAction } from "@/lib/actions/automation";
import { toggleDeadlineRuleAction } from "@/lib/actions/settings";
import { cn } from "@/lib/utils";

function Switch({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
        checked ? "bg-[var(--color-primary)]" : "bg-[var(--border)]",
      )}
    >
      <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white transition-transform", checked ? "translate-x-5" : "translate-x-0.5")} />
    </button>
  );
}

export function RuleToggle({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(active);
  const [pending, start] = useTransition();
  return (
    <Switch
      checked={on}
      disabled={pending}
      onChange={(v) => {
        setOn(v);
        start(async () => {
          const res = await toggleAutomationRuleAction(id, v);
          if (!res.ok) setOn(!v);
          router.refresh();
        });
      }}
    />
  );
}

export function DeadlineRuleToggle({ code, active }: { code: string; active: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(active);
  const [pending, start] = useTransition();
  return (
    <Switch
      checked={on}
      disabled={pending}
      onChange={(v) => {
        setOn(v);
        start(async () => {
          const res = await toggleDeadlineRuleAction(code, v);
          if (!res.ok) setOn(!v);
          router.refresh();
        });
      }}
    />
  );
}
