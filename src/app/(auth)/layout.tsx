import { Landmark } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-app px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[var(--radius)] bg-[var(--color-primary)] text-white">
            <Landmark className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-base-fg">TaxDesk</h1>
          <p className="mt-1 text-sm text-muted">세무사무소 인하우스 운영 플랫폼</p>
        </div>
        {children}
      </div>
    </div>
  );
}
