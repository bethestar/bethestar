/**
 * Supabase 환경변수 접근 — 요청 시점 lazy 조회.
 * 빌드 시점에는 호출되지 않으므로 env 부재로 빌드가 깨지지 않는다.
 */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase 환경변수가 설정되지 않았습니다. .env.local 에 NEXT_PUBLIC_SUPABASE_URL 과 NEXT_PUBLIC_SUPABASE_ANON_KEY 를 설정하세요. (.env.example 참고)",
    );
  }
  return { url, anonKey };
}

export function getServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다. cron/자동화 실행에 필요합니다.",
    );
  }
  return key;
}
