"use client";

import { useActionState } from "react";
import { signUp } from "@/lib/actions/auth";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function SignupForm() {
  const [state, action] = useActionState(signUp, null);
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="org_name">사무소명</Label>
        <Input id="org_name" name="org_name" placeholder="예: 더밝은세무회계사무소" required />
      </div>
      <div>
        <Label htmlFor="name">대표자 이름</Label>
        <Input id="name" name="name" placeholder="홍길동" required />
      </div>
      <div>
        <Label htmlFor="email">이메일</Label>
        <Input id="email" name="email" type="email" placeholder="you@office.kr" required autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="password">비밀번호 (8자 이상)</Label>
        <Input id="password" name="password" type="password" placeholder="••••••••" required autoComplete="new-password" />
      </div>
      {state && !state.ok && (
        <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
      )}
      <SubmitButton className="w-full">사무소 개설하고 시작하기</SubmitButton>
    </form>
  );
}
