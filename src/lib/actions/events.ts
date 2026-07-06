"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { eventSchema } from "@/lib/validations";
import { type ActionResult, fail, ok, firstIssue, writeAudit } from "./helpers";

export async function createEventAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile();
  const parsed = eventSchema.safeParse({
    title: formData.get("title"),
    starts_at: formData.get("starts_at"),
    ends_at: formData.get("ends_at") ?? "",
    all_day: formData.get("all_day") === "on",
    kind: formData.get("kind"),
  });
  if (!parsed.success) return fail(firstIssue(parsed.error.issues));
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("events").insert({
    org_id: profile.orgId,
    title: d.title,
    starts_at: new Date(d.starts_at).toISOString(),
    ends_at: d.ends_at ? new Date(d.ends_at).toISOString() : null,
    all_day: d.all_day ?? false,
    kind: d.kind,
    owner_id: profile.userId,
  });
  if (error) return fail(error.message);
  await writeAudit(profile, "create", "event", null, { title: d.title });
  revalidatePath("/calendar");
  return ok();
}
