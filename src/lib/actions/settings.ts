"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";
import { inviteSchema } from "@/lib/validations";
import { type ActionResult, fail, ok, firstIssue, writeAudit } from "./helpers";

/** 직원 초대: admin API 로 계정 생성 + 프로필 (대표만) */
export async function inviteMemberAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile();
  if (profile.role !== "admin") return fail("직원 초대는 대표만 가능합니다.");
  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    role: formData.get("role"),
    password: formData.get("password"),
  });
  if (!parsed.success) return fail(firstIssue(parsed.error.issues));
  const d = parsed.data;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return fail("서버에 SUPABASE_SERVICE_ROLE_KEY 가 설정되어야 초대가 가능합니다.");
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email: d.email,
    password: d.password,
    email_confirm: true,
    user_metadata: { name: d.name },
  });
  if (error || !created.user) return fail(error?.message || "계정 생성 실패");

  const { error: pErr } = await admin.from("profiles").insert({
    id: created.user.id,
    org_id: profile.orgId,
    name: d.name,
    role: d.role,
  });
  if (pErr) return fail(pErr.message);

  await writeAudit(profile, "invite", "profile", created.user.id, {
    email: d.email,
    role: d.role,
  });
  revalidatePath("/settings");
  return ok();
}

export async function updateMemberRoleAction(
  memberId: string,
  role: string,
  isActive: boolean,
): Promise<ActionResult> {
  const profile = await requireProfile();
  if (profile.role !== "admin") return fail("권한 변경은 대표만 가능합니다.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role, is_active: isActive })
    .eq("id", memberId)
    .eq("org_id", profile.orgId);
  if (error) return fail(error.message);
  await writeAudit(profile, "update_role", "profile", memberId, { role, isActive });
  revalidatePath("/settings");
  return ok();
}

export async function updateOrgAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile();
  if (profile.role !== "admin") return fail("사무소 정보 수정은 대표만 가능합니다.");
  const name = (formData.get("name") as string)?.trim();
  const bizNo = (formData.get("biz_no") as string)?.trim();
  if (!name) return fail("사무소명을 입력하세요.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("orgs")
    .update({ name, biz_no: bizNo || null })
    .eq("id", profile.orgId);
  if (error) return fail(error.message);
  await writeAudit(profile, "update", "org", profile.orgId, { name });
  revalidatePath("/settings");
  return ok();
}

/** 기한 규칙 활성/비활성 (org 로컬 오버라이드 생성/수정) */
export async function toggleDeadlineRuleAction(
  code: string,
  active: boolean,
): Promise<ActionResult> {
  const profile = await requireProfile();
  if (profile.role !== "admin") return fail("기한 규칙 변경은 대표만 가능합니다.");
  const supabase = await createClient();

  // 전역 규칙을 org 로컬로 복제하여 오버라이드
  const { data: existing } = await supabase
    .from("tax_deadline_rules")
    .select("id")
    .eq("org_id", profile.orgId)
    .eq("code", code)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("tax_deadline_rules")
      .update({ active })
      .eq("id", existing.id);
    if (error) return fail(error.message);
  } else {
    const { data: global } = await supabase
      .from("tax_deadline_rules")
      .select("code, name, description, month, day, frequency, applies_to, rollover")
      .is("org_id", null)
      .eq("code", code)
      .maybeSingle();
    if (!global) return fail("규칙을 찾을 수 없습니다.");
    const { error } = await supabase
      .from("tax_deadline_rules")
      .insert({ ...global, org_id: profile.orgId, active });
    if (error) return fail(error.message);
  }
  await writeAudit(profile, "toggle", "deadline_rule", null, { code, active });
  revalidatePath("/settings");
  revalidatePath("/calendar");
  return ok();
}
