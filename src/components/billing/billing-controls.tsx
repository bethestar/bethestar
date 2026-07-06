"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Receipt, Wallet } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  generateMonthlyInvoicesAction,
  recordPaymentAction,
} from "@/lib/actions/billing";

export function GenerateInvoicesButton({ defaultPeriod }: { defaultPeriod: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <Dialog
      title="월 기장료 청구 생성"
      description="활성 거래처의 월 기장료 청구를 일괄 생성합니다. 중복 기간은 자동으로 건너뜁니다."
      trigger={<Button><Receipt className="h-4 w-4" /> 월 청구 생성</Button>}
    >
      {(close) => (
        <form
          action={async (fd) => {
            const res = await generateMonthlyInvoicesAction(null, fd);
            if (res.ok) {
              router.refresh();
              close();
            } else setMsg(res.error);
          }}
          className="space-y-3"
        >
          <div>
            <Label htmlFor="period">청구 기간 (YYYY-MM)</Label>
            <Input id="period" name="period" defaultValue={defaultPeriod} placeholder="2026-07" required />
          </div>
          {msg && <p className="text-sm text-[var(--color-danger)]">{msg}</p>}
          <div className="flex justify-end"><SubmitButton>생성</SubmitButton></div>
        </form>
      )}
    </Dialog>
  );
}

export function RecordPaymentButton({
  invoiceId,
  amount,
}: {
  invoiceId: string;
  amount: number;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <Dialog
      title="입금 기록"
      trigger={<Button size="sm" variant="outline"><Wallet className="h-3.5 w-3.5" /> 입금</Button>}
    >
      {(close) => (
        <form
          action={async (fd) => {
            const res = await recordPaymentAction(null, fd);
            if (res.ok) { router.refresh(); close(); }
            else setMsg(res.error);
          }}
          className="space-y-3"
        >
          <input type="hidden" name="invoice_id" value={invoiceId} />
          <div>
            <Label htmlFor="amount">입금액 (원)</Label>
            <Input id="amount" name="amount" type="number" min={1} defaultValue={amount} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="paid_on">입금일</Label>
              <Input id="paid_on" name="paid_on" type="date" defaultValue={today} required />
            </div>
            <div>
              <Label htmlFor="method">방법</Label>
              <Input id="method" name="method" placeholder="이체/카드" />
            </div>
          </div>
          <div>
            <Label htmlFor="memo">메모</Label>
            <Input id="memo" name="memo" />
          </div>
          {msg && <p className="text-sm text-[var(--color-danger)]">{msg}</p>}
          <div className="flex justify-end"><SubmitButton>기록</SubmitButton></div>
        </form>
      )}
    </Dialog>
  );
}
