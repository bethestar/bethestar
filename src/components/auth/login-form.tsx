"use client";

import { useActionState } from "react";
import { signIn } from "@/lib/actions/auth";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, action] = useActionState(signIn, null);
  return (
    <form action={action} className="space-y-4">
      {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}
      <div>
        <Label htmlFor="email">이메일</Label>
        <Input id="email" name="email" type="email" placeholder="you@office.kr" required autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="password">비밀번호</Label>
        <Input id="password" name="password" type="password" placeholder="••••••••" required autoComplete="current-password" />
      </div>
      {state && !state.ok && (
        <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
      )}
      <SubmitButton className="w-full">로그인</SubmitButton>
      <p className="text-center text-xs text-muted">
        데모: admin@taxdesk.kr / taxdesk1234
      </p>
    </form>
  );
}
