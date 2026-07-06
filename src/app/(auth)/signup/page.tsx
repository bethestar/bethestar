import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";
import { Card, CardContent } from "@/components/ui/card";

export default function SignupPage() {
  return (
    <Card>
      <CardContent className="pt-6">
        <SignupForm />
        <p className="mt-4 text-center text-sm text-muted">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="font-medium text-[var(--color-primary)]">
            로그인
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
