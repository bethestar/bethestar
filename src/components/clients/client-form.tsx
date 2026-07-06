"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ActionResult } from "@/lib/actions/helpers";

type Member = { id: string; name: string };
type ClientData = {
  id?: string;
  name?: string;
  business_no?: string | null;
  ceo_name?: string | null;
  client_type?: string;
  industry?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  assignee_id?: string | null;
  monthly_fee?: number;
  adjustment_fee?: number;
  engaged_on?: string | null;
  withholding?: boolean;
  vat_applicable?: boolean;
  homtax_agreed?: boolean;
  notes?: string | null;
};

export function ClientForm({
  action,
  members,
  initial,
  onDone,
  submitLabel = "저장",
}: {
  action: (prev: ActionResult | null, fd: FormData) => Promise<ActionResult>;
  members: Member[];
  initial?: ClientData;
  onDone?: () => void;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    async (prev: ActionResult | null, fd: FormData) => {
      const res = await action(prev, fd);
      if (res.ok) {
        router.refresh();
        onDone?.();
      }
      return res;
    },
    null,
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label htmlFor="name">상호 *</Label>
          <Input id="name" name="name" defaultValue={initial?.name} required />
        </div>
        <div>
          <Label htmlFor="business_no">사업자번호</Label>
          <Input id="business_no" name="business_no" placeholder="000-00-00000" defaultValue={initial?.business_no ?? ""} />
        </div>
        <div>
          <Label htmlFor="ceo_name">대표자</Label>
          <Input id="ceo_name" name="ceo_name" defaultValue={initial?.ceo_name ?? ""} />
        </div>
        <div>
          <Label htmlFor="client_type">과세유형</Label>
          <Select id="client_type" name="client_type" defaultValue={initial?.client_type ?? "general"}>
            <option value="corp">법인</option>
            <option value="general">일반</option>
            <option value="simplified">간이</option>
            <option value="exempt">면세</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="industry">업종</Label>
          <Input id="industry" name="industry" defaultValue={initial?.industry ?? ""} />
        </div>
        <div>
          <Label htmlFor="contact_name">담당 연락처명</Label>
          <Input id="contact_name" name="contact_name" defaultValue={initial?.contact_name ?? ""} />
        </div>
        <div>
          <Label htmlFor="contact_phone">연락처</Label>
          <Input id="contact_phone" name="contact_phone" defaultValue={initial?.contact_phone ?? ""} />
        </div>
        <div className="col-span-2">
          <Label htmlFor="contact_email">이메일</Label>
          <Input id="contact_email" name="contact_email" type="email" defaultValue={initial?.contact_email ?? ""} />
        </div>
        <div>
          <Label htmlFor="assignee_id">담당 직원</Label>
          <Select id="assignee_id" name="assignee_id" defaultValue={initial?.assignee_id ?? ""}>
            <option value="">미배정</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="engaged_on">수임일</Label>
          <Input id="engaged_on" name="engaged_on" type="date" defaultValue={initial?.engaged_on ?? ""} />
        </div>
        <div>
          <Label htmlFor="monthly_fee">월 기장료 (원)</Label>
          <Input id="monthly_fee" name="monthly_fee" type="number" min={0} defaultValue={initial?.monthly_fee ?? 0} />
        </div>
        <div>
          <Label htmlFor="adjustment_fee">조정료 (원)</Label>
          <Input id="adjustment_fee" name="adjustment_fee" type="number" min={0} defaultValue={initial?.adjustment_fee ?? 0} />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 rounded-[var(--radius)] bg-surface-2 px-3 py-2.5 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="vat_applicable" defaultChecked={initial?.vat_applicable ?? true} className="h-4 w-4" />
          부가세 대상
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="withholding" defaultChecked={initial?.withholding ?? true} className="h-4 w-4" />
          원천세 대상
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="homtax_agreed" defaultChecked={initial?.homtax_agreed ?? false} className="h-4 w-4" />
          홈택스 수임동의
        </label>
      </div>

      <div>
        <Label htmlFor="notes">특이사항 (인수인계 메모)</Label>
        <Textarea id="notes" name="notes" defaultValue={initial?.notes ?? ""} />
      </div>

      {state && !state.ok && (
        <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
      )}
      <div className="flex justify-end">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
