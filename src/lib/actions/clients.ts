"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import {
  clientSchema,
  terminateClientSchema,
  reassignSchema,
  clientNoteSchema,
} from "@/lib/validations";
import { type ActionResult, fail, ok, firstIssue, writeAudit } from "./helpers";

function normalizeBizNo(v?: string) {
  if (!v) return null;
  const digits = v.replace(/\D/g, "");
  if (digits.length !== 10) return v;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function opt(v: string | null | undefined): string | undefined {
  const s = v?.trim();
  return s ? s : undefined;
}

export async function createClientAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile();
  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    business_no: formData.get("business_no") ?? "",
    ceo_name: formData.get("ceo_name") ?? "",
    client_type: formData.get("client_type"),
    industry: formData.get("industry") ?? "",
    contact_name: formData.get("contact_name") ?? "",
    contact_phone: formData.get("contact_phone") ?? "",
    contact_email: formData.get("contact_email") ?? "",
    assignee_id: formData.get("assignee_id") ?? "",
    monthly_fee: formData.get("monthly_fee") ?? 0,
    adjustment_fee: formData.get("adjustment_fee") ?? 0,
    engaged_on: formData.get("engaged_on") ?? "",
    withholding: formData.get("withholding") === "on",
    vat_applicable: formData.get("vat_applicable") === "on",
    homtax_agreed: formData.get("homtax_agreed") === "on",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return fail(firstIssue(parsed.error.issues));
  const d = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      org_id: profile.orgId,
      name: d.name,
      business_no: normalizeBizNo(d.business_no),
      ceo_name: opt(d.ceo_name),
      client_type: d.client_type,
      industry: opt(d.industry),
      contact_name: opt(d.contact_name),
      contact_phone: opt(d.contact_phone),
      contact_email: opt(d.contact_email),
      assignee_id: d.assignee_id || null,
      monthly_fee: d.monthly_fee,
      adjustment_fee: d.adjustment_fee,
      engaged_on: d.engaged_on || null,
      withholding: d.withholding ?? true,
      vat_applicable: d.vat_applicable ?? true,
      homtax_agreed: d.homtax_agreed ?? false,
      notes: opt(d.notes),
    })
    .select("id")
    .single();

  if (error) return fail(error.message);
  await writeAudit(profile, "create", "client", data.id, { name: d.name });
  revalidatePath("/clients");
  return ok({ id: data.id });
}

export async function updateClientAction(
  clientId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile();
  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    business_no: formData.get("business_no") ?? "",
    ceo_name: formData.get("ceo_name") ?? "",
    client_type: formData.get("client_type"),
    industry: formData.get("industry") ?? "",
    contact_name: formData.get("contact_name") ?? "",
    contact_phone: formData.get("contact_phone") ?? "",
    contact_email: formData.get("contact_email") ?? "",
    assignee_id: formData.get("assignee_id") ?? "",
    monthly_fee: formData.get("monthly_fee") ?? 0,
    adjustment_fee: formData.get("adjustment_fee") ?? 0,
    engaged_on: formData.get("engaged_on") ?? "",
    withholding: formData.get("withholding") === "on",
    vat_applicable: formData.get("vat_applicable") === "on",
    homtax_agreed: formData.get("homtax_agreed") === "on",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return fail(firstIssue(parsed.error.issues));
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({
      name: d.name,
      business_no: normalizeBizNo(d.business_no),
      ceo_name: opt(d.ceo_name) ?? null,
      client_type: d.client_type,
      industry: opt(d.industry) ?? null,
      contact_name: opt(d.contact_name) ?? null,
      contact_phone: opt(d.contact_phone) ?? null,
      contact_email: opt(d.contact_email) ?? null,
      assignee_id: d.assignee_id || null,
      monthly_fee: d.monthly_fee,
      adjustment_fee: d.adjustment_fee,
      engaged_on: d.engaged_on || null,
      withholding: d.withholding ?? true,
      vat_applicable: d.vat_applicable ?? true,
      homtax_agreed: d.homtax_agreed ?? false,
      notes: opt(d.notes) ?? null,
    })
    .eq("id", clientId)
    .eq("org_id", profile.orgId);

  if (error) return fail(error.message);
  await writeAudit(profile, "update", "client", clientId, { name: d.name });
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  return ok();
}

export async function terminateClientAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile();
  const parsed = terminateClientSchema.safeParse({
    client_id: formData.get("client_id"),
    disengage_reason: formData.get("disengage_reason"),
    disengaged_on: formData.get("disengaged_on"),
  });
  if (!parsed.success) return fail(firstIssue(parsed.error.issues));
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({
      status: "terminated",
      disengage_reason: d.disengage_reason,
      disengaged_on: d.disengaged_on,
    })
    .eq("id", d.client_id)
    .eq("org_id", profile.orgId);

  if (error) return fail(error.message);
  await writeAudit(profile, "terminate", "client", d.client_id, {
    reason: d.disengage_reason,
  });
  revalidatePath(`/clients/${d.client_id}`);
  revalidatePath("/clients");
  return ok();
}

export async function reassignClientsAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile();
  if (profile.role === "staff") return fail("담당 재배정 권한이 없습니다.");
  const parsed = reassignSchema.safeParse({
    from_assignee: formData.get("from_assignee") ?? "",
    to_assignee: formData.get("to_assignee"),
    client_ids: formData.getAll("client_ids"),
  });
  if (!parsed.success) return fail(firstIssue(parsed.error.issues));

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ assignee_id: parsed.data.to_assignee })
    .in("id", parsed.data.client_ids)
    .eq("org_id", profile.orgId);

  if (error) return fail(error.message);
  await writeAudit(profile, "reassign", "client", null, {
    to: parsed.data.to_assignee,
    count: parsed.data.client_ids.length,
  });
  revalidatePath("/clients");
  revalidatePath("/settings");
  return ok({ count: parsed.data.client_ids.length });
}

export async function addClientNoteAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile();
  const parsed = clientNoteSchema.safeParse({
    client_id: formData.get("client_id"),
    channel: formData.get("channel"),
    content: formData.get("content"),
  });
  if (!parsed.success) return fail(firstIssue(parsed.error.issues));

  const supabase = await createClient();
  const { error } = await supabase.from("client_notes").insert({
    org_id: profile.orgId,
    client_id: parsed.data.client_id,
    author_id: profile.userId,
    channel: parsed.data.channel,
    content: parsed.data.content,
  });
  if (error) return fail(error.message);
  await writeAudit(profile, "create", "client_note", parsed.data.client_id);
  revalidatePath(`/clients/${parsed.data.client_id}`);
  return ok();
}
