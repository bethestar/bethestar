import Link from "next/link";
import { Building2, Search } from "lucide-react";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { ClientTypeBadge } from "@/components/ui/status-badge";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NewClientButton } from "@/components/clients/client-dialogs";
import { formatKRW, CLIENT_TYPE_LABEL } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; assignee?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const profile = await getSessionProfile();
  if (!profile) return null;
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("profiles")
    .select("id, name")
    .eq("org_id", profile.orgId)
    .eq("is_active", true);

  let query = supabase
    .from("clients")
    .select("id, name, business_no, ceo_name, client_type, monthly_fee, status, assignee_id, profiles:assignee_id(name)")
    .eq("org_id", profile.orgId)
    .order("created_at", { ascending: false });

  if (sp.q) query = query.ilike("name", `%${sp.q}%`);
  if (sp.type) query = query.eq("client_type", sp.type);
  if (sp.assignee) query = query.eq("assignee_id", sp.assignee);
  if (sp.status) query = query.eq("status", sp.status);

  const { data: clients } = await query;
  const rows = clients ?? [];

  return (
    <>
      <PageHeader
        title="거래처"
        description={`총 ${rows.length}곳의 수임처`}
        action={<NewClientButton members={members ?? []} />}
      />

      <Card className="mb-4 p-3">
        <form method="get" className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-48 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input name="q" placeholder="상호 검색" defaultValue={sp.q} className="pl-8" />
          </div>
          <Select name="type" defaultValue={sp.type ?? ""} className="w-32">
            <option value="">전체 유형</option>
            {Object.entries(CLIENT_TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Select name="assignee" defaultValue={sp.assignee ?? ""} className="w-36">
            <option value="">전체 담당자</option>
            {(members ?? []).map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
          <Select name="status" defaultValue={sp.status ?? ""} className="w-28">
            <option value="">전체 상태</option>
            <option value="active">수임중</option>
            <option value="terminated">해지</option>
          </Select>
          <Button type="submit" variant="secondary">검색</Button>
        </form>
      </Card>

      <Card>
        {rows.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={<Building2 className="h-8 w-8" />}
              title="거래처가 없습니다"
              description="첫 수임처를 등록해 관리를 시작하세요."
              action={<NewClientButton members={members ?? []} />}
            />
          </div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>상호</TH>
                <TH>사업자번호</TH>
                <TH>유형</TH>
                <TH>대표자</TH>
                <TH>담당자</TH>
                <TH className="text-right">월 기장료</TH>
                <TH>상태</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((c) => {
                const assignee = c.profiles as unknown as { name: string } | null;
                return (
                  <TR key={c.id} className="hover:bg-surface-2">
                    <TD>
                      <Link href={`/clients/${c.id}`} className="font-medium text-base-fg hover:text-[var(--color-primary)]">
                        {c.name}
                      </Link>
                    </TD>
                    <TD className="tabular-nums text-muted">{c.business_no ?? "-"}</TD>
                    <TD><ClientTypeBadge type={c.client_type} /></TD>
                    <TD className="text-muted">{c.ceo_name ?? "-"}</TD>
                    <TD className="text-muted">{assignee?.name ?? "미배정"}</TD>
                    <TD className="text-right tabular-nums">{formatKRW(c.monthly_fee)}</TD>
                    <TD>
                      {c.status === "active" ? (
                        <Badge tone="success">수임중</Badge>
                      ) : (
                        <Badge tone="neutral">해지</Badge>
                      )}
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  );
}
