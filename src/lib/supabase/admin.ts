import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv, getServiceRoleKey } from "./env";

/**
 * 서비스 롤 클라이언트 — RLS 우회. cron/자동화 핸들러에서만,
 * CRON_SECRET 검증 이후에 사용한다. 절대 클라이언트 번들에 포함 금지.
 */
export function createAdminClient() {
  const { url } = getSupabaseEnv();
  const serviceKey = getServiceRoleKey();
  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
