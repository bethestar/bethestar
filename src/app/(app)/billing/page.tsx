import Link from "next/link";
import { Wallet, AlertCircle, Receipt } from "lucide-react";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { InvoiceStatusBadge } from "@/components/ui/status-badge";
import {
  GenerateInvoicesButton,
  RecordPaymentButton,
} from "@/components/billing/billing-controls";
import { formatKRW, formatDate, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = { monthly: "월 기장료", adjustment: "조정료", etc: "기타" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const profile = await getSessionProfile();
  if (!profile) return null;
  const supabase = await createClient();
  const todayStr = new Date().toISOString().slice(0, 10);

  let query = supabase
    .from("invoices")
    .select("id, kind, period, amount, issued_on, due_on, status, clients(name)")
    .eq("org_id", profile.orgId)
    .order("period", { ascending: false });
  if (sp.status) query = query.eq("status", sp.status);

  const [{ data: invoices }, { data: allForStats }] = await Promise.all([
    query,
    supabase.from("invoices").select("amount, status, due_on").eq("org_id", profile.orgId),
  ]);

  const stats = allForStats ?? [];
  const unpaid = stats.filter((i) => i.status !== "paid").reduce((s, i) => s + i.amount, 0);
  const overdue = stats
    .filter((i) => i.status !== "paid" && i.due_on && i.due_on < todayStr)
    .reduce((s, i) => s + i.amount, 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const issuedThisMonth = stats.filter((i) => i.status !== "draft").length;

  const rows = invoices ?? [];
  const filters = [
    { key: "", label: "전체" },
    { key: "issued", label: "청구됨" },
    { key: "overdue", label: "연체" },
    { key: "paid", label: "완납" },
  ];

  return (
    <>
      <PageHeader
        title="청구·미수금"
        description="기장료 청구와 입금을 관리하고 미수금을 실시간으로 파악합니다."
        action={<GenerateInvoicesButton defaultPeriod={thisMonth} />}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">미수금 총액</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950"><Wallet className="h-4 w-4 text-amber-600" /></span>
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums text-base-fg">{formatKRW(unpaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">연체 금액</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950"><AlertCircle className="h-4 w-4 text-red-600" /></span>
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums text-[var(--color-danger)]">{formatKRW(overdue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">누적 청구 건수</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950"><Receipt className="h-4 w-4 text-blue-600" /></span>
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums text-base-fg">{issuedThisMonth}건</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 flex gap-1">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={f.key ? `/billing?status=${f.key}` : "/billing"}
            className={cn("rounded-full px-3 py-1.5 text-sm font-medium", (sp.status ?? "") === f.key ? "bg-[var(--color-primary)] text-white" : "bg-surface text-muted hover:bg-surface-2")}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <Card>
        {rows.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={<Receipt className="h-8 w-8" />} title="청구 내역이 없습니다" description="월 청구 생성으로 기장료 청구를 시작하세요." />
          </div>
        ) : (
          <Table>
            <THead>
              <TR><TH>거래처</TH><TH>기간</TH><TH>구분</TH><TH className="text-right">금액</TH><TH>납기</TH><TH>상태</TH><TH></TH></TR>
            </THead>
            <TBody>
              {rows.map((i) => {
                const client = i.clients as unknown as { name: string } | null;
                const isOverdue = i.status !== "paid" && i.due_on && i.due_on < todayStr;
                return (
                  <TR key={i.id}>
                    <TD className="font-medium">{client?.name ?? "-"}</TD>
                    <TD className="tabular-nums text-muted">{i.period}</TD>
                    <TD>{KIND_LABEL[i.kind]}</TD>
                    <TD className="text-right tabular-nums font-medium">{formatKRW(i.amount)}</TD>
                    <TD className={cn("text-muted", isOverdue && "text-[var(--color-danger)]")}>{formatDate(i.due_on)}</TD>
                    <TD><InvoiceStatusBadge status={isOverdue ? "overdue" : i.status} /></TD>
                    <TD className="text-right">
                      {i.status !== "paid" && <RecordPaymentButton invoiceId={i.id} amount={i.amount} />}
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  );
}
