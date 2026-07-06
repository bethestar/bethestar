"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, BookUp } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { terminateClientAction } from "@/lib/actions/clients";
import { promoteNoteToKbAction } from "@/lib/actions/kb";
import type { ActionResult } from "@/lib/actions/helpers";

export function TerminateButton({ clientId }: { clientId: string }) {
  const router = useRouter();
  return (
    <Dialog
      title="거래처 해지"
      description="해지 사유는 필수이며 감사 로그에 기록됩니다."
      trigger={
        <Button variant="danger" size="sm">
          <AlertTriangle className="h-4 w-4" /> 해지 처리
        </Button>
      }
    >
      {(close) => (
        <TerminateForm clientId={clientId} onDone={() => { router.refresh(); close(); }} />
      )}
    </Dialog>
  );
}

function TerminateForm({ clientId, onDone }: { clientId: string; onDone: () => void }) {
  const [state, action] = useActionState(
    async (prev: ActionResult | null, fd: FormData) => {
      const res = await terminateClientAction(prev, fd);
      if (res.ok) onDone();
      return res;
    },
    null,
  );
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="client_id" value={clientId} />
      <div>
        <Label htmlFor="disengaged_on">해지일 *</Label>
        <Input id="disengaged_on" name="disengaged_on" type="date" required />
      </div>
      <div>
        <Label htmlFor="disengage_reason">해지 사유 *</Label>
        <Textarea id="disengage_reason" name="disengage_reason" placeholder="예: 폐업, 타 사무소 이관 등" required />
      </div>
      {state && !state.ok && (
        <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
      )}
      <div className="flex justify-end">
        <SubmitButton variant="danger">해지 확정</SubmitButton>
      </div>
    </form>
  );
}

export function PromoteNoteButton({ noteId }: { noteId: string }) {
  const router = useRouter();
  return (
    <Dialog
      title="상담 사례를 지식으로"
      description="이 상담 내용을 KB 문서(상담 사례)로 승격합니다."
      trigger={
        <button className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline">
          <BookUp className="h-3.5 w-3.5" /> 지식화
        </button>
      }
    >
      {(close) => <PromoteForm noteId={noteId} onDone={() => { router.refresh(); close(); }} />}
    </Dialog>
  );
}

function PromoteForm({ noteId, onDone }: { noteId: string; onDone: () => void }) {
  const [state, action] = useActionState(
    async (prev: ActionResult | null, fd: FormData) => {
      const res = await promoteNoteToKbAction(prev, fd);
      if (res.ok) onDone();
      return res;
    },
    null,
  );
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="note_id" value={noteId} />
      <div>
        <Label htmlFor="title">문서 제목 *</Label>
        <Input id="title" name="title" placeholder="예: [상담사례] 현금매출 처리" required />
      </div>
      {state && !state.ok && (
        <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
      )}
      <div className="flex justify-end">
        <SubmitButton>지식저장소에 등록</SubmitButton>
      </div>
    </form>
  );
}
