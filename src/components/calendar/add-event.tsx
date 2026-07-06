"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { createEventAction } from "@/lib/actions/events";
import type { ActionResult } from "@/lib/actions/helpers";

export function AddEventButton() {
  const router = useRouter();
  return (
    <Dialog
      title="사내 일정 등록"
      description="회의·휴가·교육 등 사무소 일정을 추가합니다."
      trigger={<Button><CalendarPlus className="h-4 w-4" /> 일정 등록</Button>}
    >
      {(close) => <EventForm onDone={() => { router.refresh(); close(); }} />}
    </Dialog>
  );
}

function EventForm({ onDone }: { onDone: () => void }) {
  const [state, action] = useActionState(
    async (prev: ActionResult | null, fd: FormData) => {
      const res = await createEventAction(prev, fd);
      if (res.ok) onDone();
      return res;
    },
    null,
  );
  return (
    <form action={action} className="space-y-3">
      <div>
        <Label htmlFor="title">제목 *</Label>
        <Input id="title" name="title" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="starts_at">시작 *</Label>
          <Input id="starts_at" name="starts_at" type="datetime-local" required />
        </div>
        <div>
          <Label htmlFor="ends_at">종료</Label>
          <Input id="ends_at" name="ends_at" type="datetime-local" />
        </div>
      </div>
      <div>
        <Label htmlFor="kind">유형</Label>
        <Select id="kind" name="kind" defaultValue="internal">
          <option value="internal">회의/내부</option>
          <option value="leave">휴가</option>
          <option value="training">교육</option>
          <option value="deadline">기한</option>
        </Select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="all_day" className="h-4 w-4" /> 종일
      </label>
      {state && !state.ok && (
        <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
      )}
      <div className="flex justify-end">
        <SubmitButton>등록</SubmitButton>
      </div>
    </form>
  );
}
