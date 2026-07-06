import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const [{ data: org }, { count: unread }] = await Promise.all([
    supabase.from("orgs").select("name").eq("id", profile.orgId).single(),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null),
  ]);

  return (
    <div className="min-h-screen bg-app">
      <Sidebar orgName={org?.name ?? "사무소"} unread={unread ?? 0} />
      <div className="md:pl-60">
        <Topbar name={profile.name} role={profile.role} unread={unread ?? 0} />
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
