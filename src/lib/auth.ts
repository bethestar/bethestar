import { createClient } from "./supabase/server";

export interface SessionProfile {
  userId: string;
  email: string | null;
  orgId: string;
  name: string;
  role: "admin" | "manager" | "staff";
}

/**
 * 현재 로그인 사용자 + 프로필 조회. 미인증이면 null.
 * (app) 레이아웃 및 서버 액션에서 사용.
 */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, name, role")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    userId: user.id,
    email: user.email ?? null,
    orgId: profile.org_id,
    name: profile.name,
    role: profile.role,
  };
}

/** 서버 액션에서 인증 강제. 실패 시 throw */
export async function requireProfile(): Promise<SessionProfile> {
  const p = await getSessionProfile();
  if (!p) throw new Error("인증이 필요합니다.");
  return p;
}
