"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { paymentSchema, generateInvoicesSchema } from "@/lib/validations";
import { type ActionResult, fail, ok, firstIssue, writeAudit } from "./helpers";

/** 월 기장료 청구 일괄 생성 (I-05: (client, period) 중복 시 skip) */
export async function generateMonthlyInvoicesAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile();
  if (profile.role === "staff") return fail("청구 생성 권한이 없습니다.");
  const parsed = generateInvoicesSchema.safeParse({
    period: formData.get("period"),
  });
  if (!parsed.success) return fail(firstIssue(parsed.error.issues));
  const period = parsed.data.period; // YYYY-MM

  const supabase = await createClient();
  const { data: clients, error: cErr } = await supabase
    .from("clients")
    .select("id, monthly_fee")
    .eq("org_id", profile.orgId)
    .eq("status", "active")
    .gt("monthly_fee", 0);
  if (cErr) return fail(cErr.message);
  if (!clients || clients.length === 0)
    return fail("청구 대상(기장료 있는 활성 거래처)이 없습니다.");

  const [y, m] = period.split("-").map(Number);
  const dueOn = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10); // 말일

  const rows = clients.map((c) => ({
    org_id: profile.orgId,
    client_id: c.id,
    kind: "monthly" as const,
    period,
    amount: c.monthly_fee,
    issued_on: `${period}-01`,
    due_on: dueOn,
    status: "issued" as const,
  }));

  const { data: inserted, error } = await supabase
    .from("invoices")
    .upsert(rows, {
      onConflict: "org_id,client_id,kind,period",
      ignoreDuplicates: true,
    })
    .select("id");
  if (error) return fail(error.message);

  await writeAudit(profile, "generate_invoices", "invoice", null, {
    period,
    count: inserted?.length ?? 0,
  });
  revalidatePath("/billing");
  return ok({ count: inserted?.length ?? 0 });
}

/** 입금 기록 → 완납 시 status=paid (I-06) */
export async function recordPaymentAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile();
  if (profile.role === "staff") return fail("입금 기록 권한이 없습니다.");
  const parsed = paymentSchema.safeParse({
    invoice_id: formData.get("invoice_id"),
    amount: formData.get("amount"),
    paid_on: formData.get("paid_on"),
    method: formData.get("method") ?? "",
    memo: formData.get("memo") ?? "",
  });
  if (!parsed.success) return fail(firstIssue(parsed.error.issues));
  const d = parsed.data;

  const supabase = await createClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, amount")
    .eq("id", d.invoice_id)
    .single();
  if (!invoice) return fail("청구 내역을 찾을 수 없습니다.");

  const { error: pErr } = await supabase.from("payments").insert({
    invoice_id: d.invoice_id,
    amount: d.amount,
    paid_on: d.paid_on,
    method: d.method || null,
    memo: d.memo || null,
  });
  if (pErr) return fail(pErr.message);

  // 누적 입금액 계산 → 완납 여부
  const { data: payments } = await supabase
    .from("payments")
    .select("amount")
    .eq("invoice_id", d.invoice_id);
  const total = (payments ?? []).reduce((s, p) => s + p.amount, 0);
  if (total >= invoice.amount) {
    await supabase.from("invoices").update({ status: "paid" }).eq("id", d.invoice_id);
  }

  await writeAudit(profile, "record_payment", "invoice", d.invoice_id, {
    amount: d.amount,
    paid: total >= invoice.amount,
  });
  revalidatePath("/billing");
  return ok({ paid: total >= invoice.amount });
}

/** 비정기 청구(조정료 등) 생성 */
export async function createInvoiceAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile();
  if (profile.role === "staff") return fail("청구 생성 권한이 없습니다.");
  const clientId = formData.get("client_id") as string;
  const period = formData.get("period") as string;
  const amount = Number(formData.get("amount"));
  const kind = (formData.get("kind") as string) || "adjustment";
  if (!clientId || !period || !amount || amount <= 0)
    return fail("거래처·기간·금액을 올바르게 입력하세요.");

  const supabase = await createClient();
  const { error } = await supabase.from("invoices").insert({
    org_id: profile.orgId,
    client_id: clientId,
    kind,
    period,
    amount,
    status: "issued",
    issued_on: new Date().toISOString().slice(0, 10),
  });
  if (error) return fail(error.message);
  await writeAudit(profile, "create", "invoice", clientId, { amount, kind });
  revalidatePath("/billing");
  return ok();
}
