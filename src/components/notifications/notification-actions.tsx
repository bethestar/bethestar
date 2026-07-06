"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markReadAction, markAllReadAction } from "@/lib/actions/notifications";

export function MarkReadButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => start(async () => { await markReadAction(id); router.refresh(); })}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted hover:bg-surface-2 disabled:opacity-50"
      title="읽음 처리"
    >
      <Check className="h-3.5 w-3.5" /> 읽음
    </button>
  );
}

export function MarkAllReadButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() => start(async () => { await markAllReadAction(); router.refresh(); })}
    >
      <CheckCheck className="h-4 w-4" /> 모두 읽음
    </Button>
  );
}
