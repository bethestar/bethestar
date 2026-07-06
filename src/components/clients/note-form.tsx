"use client";

import { useActionState, useRef } from "react";
import { useRouter } from "next/navigation";
import { addClientNoteAction } from "@/lib/actions/clients";
import { Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { CHANNEL_LABEL } from "@/lib/utils";
import type { ActionResult } from "@/lib/actions/helpers";

export function NoteForm({ clientId }: { clientId: string }) {
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState(
    async (prev: ActionResult | null, fd: FormData) => {
      const res = await addClientNoteAction(prev, fd);
      if (res.ok) {
        ref.current?.reset();
        router.refresh();
      }
      return res;
    },
    null,
  );

  return (
    <form ref={ref} action={action} className="space-y-2 rounded-[var(--radius)] border border-base bg-surface p-3">
      <input type="hidden" name="client_id" value={clientId} />
      <div className="flex items-center gap-2">
        <Select name="channel" defaultValue="call" className="w-28">
          {Object.entries(CHANNEL_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
        <span className="text-sm text-muted">채널을 선택하고 상담 내용을 기록하세요</span>
      </div>
      <Textarea name="content" placeholder="상담·연락 내용을 입력하세요" required className="min-h-20" />
      {state && !state.ok && (
        <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
      )}
      <div className="flex justify-end">
        <SubmitButton size="sm">기록 추가</SubmitButton>
      </div>
    </form>
  );
}
