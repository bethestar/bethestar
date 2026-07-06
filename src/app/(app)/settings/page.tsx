import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveRulesAndHolidays } from "@/lib/data/deadlines";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkTabs } from "@/components/ui/tabs";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { DeadlineRuleToggle } from "@/components/automation/rule-toggle";
import {
  InviteButton,
  MemberRoleControl,
  OrgForm,
} from "@/components/settings/settings-controls";
export const dynamic = "force-dynamic";

const TABS = [
  { key: "members", label: "직원 관리" },
  { key: "deadlines", label: "기한 규칙" },
  { key: "org", label: "사무소 정보" },
];

const FREQ_LABEL: Record<string, string> = {
  monthly: "매월",
  quarterly: "분기(1·4·7·10월)",
  half: "반기(1·7월)",
  yearly: "연 1회",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "members" } = await searchParams;
  const profile = await getSessionProfile();
  if (!profile) return null;
  const supabase = await createClient();
  const isAdmin = profile.role === "admin";

  return (
    <>
      <PageHeader
        title="설정"
        description="직원 권한, 신고기한 규칙, 사무소 정보를 관리합니다."
        action={tab === "members" && isAdmin ? <InviteButton /> : undefined}
      />

      <LinkTabs tabs={TABS} active={tab} basePath="/settings" />

      <div className="mt-5">
        {tab === "members" && <MembersTab orgId={profile.orgId} selfId={profile.userId} isAdmin={isAdmin} supabase={supabase} />}
        {tab === "deadlines" && <DeadlinesTab orgId={profile.orgId} isAdmin={isAdmin} />}
        {tab === "org" && <OrgTab orgId={profile.orgId} isAdmin={isAdmin} supabase={supabase} />}
      </div>
    </>
  );
}

async function MembersTab({
  orgId,
  selfId,
  isAdmin,
  supabase,
}: {
  orgId: string;
  selfId: string;
  isAdmin: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
}) {
  const { data: members } = await supabase
    .from("profiles")
    .select("id, name, role, phone, is_active")
    .eq("org_id", orgId)
    .order("created_at");

  return (
    <Card>
      <Table>
        <THead>
          <TR><TH>이름</TH><TH>연락처</TH><TH>역할 / 재직</TH><TH>상태</TH></TR>
        </THead>
        <TBody>
          {(members ?? []).map((m: { id: string; name: string; role: string; phone: string | null; is_active: boolean }) => (
            <TR key={m.id}>
              <TD className="font-medium">{m.name}{m.id === selfId && <span className="ml-1 text-xs text-muted">(나)</span>}</TD>
              <TD className="text-muted">{m.phone ?? "-"}</TD>
              <TD>
                <MemberRoleControl
                  memberId={m.id}
                  role={m.role}
                  isActive={m.is_active}
                  disabled={!isAdmin || m.id === selfId}
                />
              </TD>
              <TD>
                {m.is_active ? <Badge tone="success">재직</Badge> : <Badge tone="neutral">비활성</Badge>}
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
      {!isAdmin && (
        <p className="border-t border-base px-4 py-3 text-xs text-muted">역할·재직 상태 변경은 대표(admin)만 가능합니다.</p>
      )}
    </Card>
  );
}

async function DeadlinesTab({ orgId, isAdmin }: { orgId: string; isAdmin: boolean }) {
  const { allRows } = await getEffectiveRulesAndHolidays(orgId);
  // 코드별 유효 규칙 (org 우선)
  const byCode = new Map<string, (typeof allRows)[number]>();
  for (const r of allRows) {
    const cur = byCode.get(r.code);
    if (!cur || (r.org_id === orgId && cur.org_id === null)) byCode.set(r.code, r);
  }
  const rules = [...byCode.values()];

  return (
    <Card>
      <CardHeader>
        <CardTitle>신고기한 규칙</CardTitle>
        <span className="text-xs text-muted">주말·공휴일 자동 순연 적용</span>
      </CardHeader>
      <Table>
        <THead>
          <TR><TH>규칙</TH><TH>주기</TH><TH>기준일</TH><TH>대상</TH><TH className="text-right">사용</TH></TR>
        </THead>
        <TBody>
          {rules.map((r) => (
            <TR key={r.code}>
              <TD>
                <p className="font-medium text-base-fg">{r.name}</p>
                <p className="text-xs text-muted">{r.description}</p>
              </TD>
              <TD className="text-muted">{FREQ_LABEL[r.frequency]}</TD>
              <TD className="text-muted">{r.month ? `${r.month}월 ` : ""}{r.day}일</TD>
              <TD><Badge tone="neutral">{r.applies_to}</Badge></TD>
              <TD className="text-right">
                {isAdmin ? (
                  <div className="flex justify-end"><DeadlineRuleToggle code={r.code} active={r.active} /></div>
                ) : (
                  <Badge tone={r.active ? "success" : "neutral"}>{r.active ? "ON" : "OFF"}</Badge>
                )}
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}

async function OrgTab({
  orgId,
  isAdmin,
  supabase,
}: {
  orgId: string;
  isAdmin: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
}) {
  const { data: org } = await supabase.from("orgs").select("name, biz_no").eq("id", orgId).single();
  return (
    <Card>
      <CardHeader><CardTitle>사무소 정보</CardTitle></CardHeader>
      <CardContent>
        <OrgForm name={org?.name ?? ""} bizNo={org?.biz_no ?? ""} disabled={!isAdmin} />
      </CardContent>
    </Card>
  );
}
