import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent } from "@/components/ui/card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ signup?: string; redirect?: string }>;
}) {
  const sp = await searchParams;
  return (
    <Card>
      <CardContent className="pt-6">
        {sp.signup && (
          <div className="mb-4 rounded-[var(--radius)] border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
            가입이 완료되었습니다. 이메일 확인 후 로그인하세요.
          </div>
        )}
        <LoginForm redirectTo={sp.redirect} />
        <p className="mt-4 text-center text-sm text-muted">
          아직 사무소 계정이 없으신가요?{" "}
          <Link href="/signup" className="font-medium text-[var(--color-primary)]">
            사무소 개설
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
