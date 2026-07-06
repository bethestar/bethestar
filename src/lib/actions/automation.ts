"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { type ActionResult, fail, ok, writeAudit } from "./helpers";

export async function toggleAutomationRuleAction(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  const profile = await requireProfile();
  if (profile.role !== "admin") return fail("자동화 규칙 변경은 대표만 가능합니다.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("automation_rules")
    .update({ active })
    .eq("id", id)
    .eq("org_id", profile.orgId);
  if (error) return fail(error.message);
  await writeAudit(profile, "toggle", "automation_rule", id, { active });
  revalidatePath("/automation");
  return ok();
}
