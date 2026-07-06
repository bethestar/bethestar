"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  inviteMemberAction,
  updateMemberRoleAction,
  updateOrgAction,
} from "@/lib/actions/settings";
import { ROLE_LABEL } from "@/lib/utils";

export function InviteButton() {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <Dialog
      title="직원 초대"
      description="새 직원 계정을 생성합니다. 임시 비밀번호를 전달하세요."
      trigger={<Button><UserPlus className="h-4 w-4" /> 직원 초대</Button>}
    >
      {(close) => (
        <form
          action={async (fd) => {
            const res = await inviteMemberAction(null, fd);
            if (res.ok) { router.refresh(); close(); }
            else setMsg(res.error);
          }}
          className="space-y-3"
        >
          <div>
            <Label htmlFor="inv_name">이름 *</Label>
            <Input id="inv_name" name="name" required />
          </div>
          <div>
            <Label htmlFor="inv_email">이메일 *</Label>
            <Input id="inv_email" name="email" type="email" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="inv_role">역할</Label>
              <Select id="inv_role" name="role" defaultValue="staff">
                <option value="staff">직원</option>
                <option value="manager">실장</option>
                <option value="admin">대표</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="inv_pw">임시 비밀번호 *</Label>
              <Input id="inv_pw" name="password" type="text" placeholder="8자 이상" required />
            </div>
          </div>
          {msg && <p className="text-sm text-[var(--color-danger)]">{msg}</p>}
          <div className="flex justify-end"><SubmitButton>초대</SubmitButton></div>
        </form>
      )}
    </Dialog>
  );
}

export function MemberRoleControl({
  memberId,
  role,
  isActive,
  disabled,
}: {
  memberId: string;
  role: string;
  isActive: boolean;
  disabled: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [r, setR] = useState(role);
  const [active, setActive] = useState(isActive);

  function save(nextRole: string, nextActive: boolean) {
    setR(nextRole);
    setActive(nextActive);
    start(async () => {
      await updateMemberRoleAction(memberId, nextRole, nextActive);
      router.refresh();
    });
  }

  if (disabled) return <span className="text-sm text-muted">{ROLE_LABEL[role]}</span>;

  return (
    <div className="flex items-center gap-2">
      <Select value={r} disabled={pending} onChange={(e) => save(e.target.value, active)} className="h-8 w-24 text-xs">
        <option value="staff">직원</option>
        <option value="manager">실장</option>
        <option value="admin">대표</option>
      </Select>
      <label className="flex items-center gap-1 text-xs text-muted">
        <input type="checkbox" checked={active} disabled={pending} onChange={(e) => save(r, e.target.checked)} className="h-3.5 w-3.5" />
        재직
      </label>
    </div>
  );
}

export function OrgForm({ name, bizNo, disabled }: { name: string; bizNo: string; disabled: boolean }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <form
      action={async (fd) => {
        const res = await updateOrgAction(null, fd);
        if (res.ok) { setMsg("저장되었습니다."); router.refresh(); }
        else setMsg(res.error);
      }}
      className="max-w-md space-y-3"
    >
      <div>
        <Label htmlFor="org_name">사무소명</Label>
        <Input id="org_name" name="name" defaultValue={name} disabled={disabled} required />
      </div>
      <div>
        <Label htmlFor="biz_no">사업자번호</Label>
        <Input id="biz_no" name="biz_no" defaultValue={bizNo} disabled={disabled} placeholder="000-00-00000" />
      </div>
      {msg && <p className="text-sm text-muted">{msg}</p>}
      {!disabled && <SubmitButton>저장</SubmitButton>}
    </form>
  );
}
