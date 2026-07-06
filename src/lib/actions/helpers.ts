import { createClient } from "@/lib/supabase/server";
import type { SessionProfile } from "@/lib/auth";

export type ActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export function fail(error: string): ActionResult<never> {
  return { ok: false, error };
}

export function ok<T>(data?: T): ActionResult<T> {
  return { ok: true, data };
}

/** zod flatten 을 사용자 메시지로 */
export function firstIssue(issues: { message: string }[]): string {
  return issues[0]?.message ?? "입력값이 올바르지 않습니다.";
}

/** 감사 로그 기록 (best-effort) */
export async function writeAudit(
  profile: SessionProfile,
  action: string,
  entity: string,
  entityId: string | null,
  diff?: Record<string, unknown>,
) {
  const supabase = await createClient();
  await supabase.from("audit_logs").insert({
    org_id: profile.orgId,
    actor_id: profile.userId,
    action,
    entity,
    entity_id: entityId,
    diff: diff ?? null,
  });
}
