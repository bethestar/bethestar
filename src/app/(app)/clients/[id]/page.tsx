import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, Mail, Building2, FileText, BookUp } from "lucide-react";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkTabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import {
  ClientTypeBadge,
  TaskStatusBadge,
  InvoiceStatusBadge,
} from "@/components/ui/status-badge";
import { DdayBadge } from "@/components/ui/dday-badge";
import { NoteForm } from "@/components/clients/note-form";
import { TerminateButton, PromoteNoteButton } from "@/components/clients/note-actions";
import { EditClientButton } from "@/components/clients/client-dialogs";
import {
  formatKRW,
  formatDate,
  formatDateTime,
  CHANNEL_LABEL,
  CLIENT_TYPE_LABEL,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "overview", label: "개요" },
  { key: "notes", label: "상담이력" },
  { key: "tasks", label: "업무" },
  { key: "documents", label: "문서" },
  { key: "billing", label: "청구" },
];

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-base py-2 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium text-base-fg">{value}</span>
    </div>
  );
}

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = "overview" } = await searchParams;
  const profile = await getSessionProfile();
  if (!profile) return null;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*, profiles:assignee_id(name)")
    .eq("id", id)
    .single();
  if (!client) notFound();

  const { data: members } = await supabase
    .from("profiles")
    .select("id, name")
    .eq("org_id", profile.orgId)
    .eq("is_active", true);

  const assignee = client.profiles as unknown as { name: string } | null;

  return (
    <>
      <Link href="/clients" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-base-fg">
        <ArrowLeft className="h-4 w-4" /> 거래처 목록
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-base-fg">{client.name}</h1>
            <ClientTypeBadge type={client.client_type} />
            {client.status === "terminated" ? (
              <Badge tone="neutral">해지</Badge>
            ) : (
              <Badge tone="success">수임중</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">
            {client.business_no ?? "사업자번호 미등록"} · 담당 {assignee?.name ?? "미배정"}
          </p>
        </div>
        <div className="flex gap-2">
          <EditClientButton members={members ?? []} client={client} />
          {client.status === "active" && <TerminateButton clientId={client.id} />}
        </div>
      </div>

      <LinkTabs tabs={TABS} active={tab} basePath={`/clients/${id}`} />

      <div className="mt-5">
        {tab === "overview" && (
          <OverviewTab client={client} assignee={assignee?.name ?? "미배정"} />
        )}
        {tab === "notes" && <NotesTab clientId={id} />}
        {tab === "tasks" && <TasksTab clientId={id} />}
        {tab === "documents" && <DocumentsTab clientId={id} />}
        {tab === "billing" && <BillingTab clientId={id} />}
      </div>
    </>
  );
}

function OverviewTab({ client, assignee }: { client: Record<string, unknown>; assignee: string }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>수임 정보</CardTitle></CardHeader>
        <CardContent>
          <InfoRow label="과세유형" value={CLIENT_TYPE_LABEL[client.client_type as string]} />
          <InfoRow label="대표자" value={(client.ceo_name as string) ?? "-"} />
          <InfoRow label="업종" value={(client.industry as string) ?? "-"} />
          <InfoRow label="담당 직원" value={assignee} />
          <InfoRow label="수임일" value={formatDate(client.engaged_on as string)} />
          <InfoRow label="월 기장료" value={formatKRW(client.monthly_fee as number)} />
          <InfoRow label="조정료" value={formatKRW(client.adjustment_fee as number)} />
          {client.status === "terminated" && (
            <>
              <InfoRow label="해지일" value={formatDate(client.disengaged_on as string)} />
              <InfoRow label="해지 사유" value={(client.disengage_reason as string) ?? "-"} />
            </>
          )}
        </CardContent>
      </Card>

      <div className="space-y-5">
        <Card>
          <CardHeader><CardTitle>연락처 및 신고 대상</CardTitle></CardHeader>
          <CardContent>
            <InfoRow label="담당자명" value={(client.contact_name as string) ?? "-"} />
            <InfoRow
              label="연락처"
              value={
                client.contact_phone ? (
                  <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{client.contact_phone as string}</span>
                ) : "-"
              }
            />
            <InfoRow
              label="이메일"
              value={
                client.contact_email ? (
                  <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{client.contact_email as string}</span>
                ) : "-"
              }
            />
            <InfoRow label="부가세 대상" value={client.vat_applicable ? "예" : "아니오"} />
            <InfoRow label="원천세 대상" value={client.withholding ? "예" : "아니오"} />
            <InfoRow label="홈택스 수임동의" value={client.homtax_agreed ? "동의" : "미동의"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>특이사항 (인수인계)</CardTitle></CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-base-fg">
              {(client.notes as string) || "등록된 특이사항이 없습니다."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function NotesTab({ clientId }: { clientId: string }) {
  const supabase = await createClient();
  const { data: notes } = await supabase
    .from("client_notes")
    .select("id, channel, content, created_at, promoted_kb_id, profiles:author_id(name)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="lg:col-span-1"><NoteForm clientId={clientId} /></div>
      <div className="lg:col-span-2">
        {(notes ?? []).length === 0 ? (
          <EmptyState title="상담 이력이 없습니다" description="전화·방문·카톡 상담 내용을 기록해 조직 자산으로 축적하세요." />
        ) : (
          <ol className="relative space-y-4 border-l border-base pl-5">
            {(notes ?? []).map((n) => {
              const author = n.profiles as unknown as { name: string } | null;
              return (
                <li key={n.id} className="relative">
                  <span className="absolute -left-[26px] top-1.5 h-3 w-3 rounded-full border-2 border-[var(--color-primary)] bg-surface" />
                  <div className="rounded-[var(--radius)] border border-base bg-surface p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge tone="info">{CHANNEL_LABEL[n.channel]}</Badge>
                        <span className="text-xs text-muted">{author?.name} · {formatDateTime(n.created_at)}</span>
                      </div>
                      {n.promoted_kb_id ? (
                        <Badge tone="primary"><BookUp className="h-3 w-3" /> 지식화됨</Badge>
                      ) : (
                        <PromoteNoteButton noteId={n.id} />
                      )}
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-base-fg">{n.content}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

async function TasksTab({ clientId }: { clientId: string }) {
  const supabase = await createClient();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, status, priority, due_date")
    .eq("client_id", clientId)
    .order("due_date", { ascending: true });

  if ((tasks ?? []).length === 0)
    return <EmptyState title="관련 업무가 없습니다" description="업무 화면에서 이 거래처에 업무를 배정하세요." />;

  return (
    <Card>
      <Table>
        <THead>
          <TR><TH>업무</TH><TH>기한</TH><TH>D-day</TH><TH>상태</TH></TR>
        </THead>
        <TBody>
          {(tasks ?? []).map((t) => (
            <TR key={t.id}>
              <TD className="font-medium">{t.title}</TD>
              <TD className="text-muted">{formatDate(t.due_date)}</TD>
              <TD>{t.due_date && t.status !== "done" ? <DdayBadge target={t.due_date} /> : "-"}</TD>
              <TD><TaskStatusBadge status={t.status} /></TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}

async function DocumentsTab({ clientId }: { clientId: string }) {
  const supabase = await createClient();
  const { data: docs } = await supabase
    .from("documents")
    .select("id, title, doc_type, expires_on, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  const typeLabel: Record<string, string> = {
    contract: "수임계약서",
    poa: "위임장",
    id_copy: "신분증 사본",
    etc: "기타",
  };

  if ((docs ?? []).length === 0)
    return <EmptyState icon={<FileText className="h-8 w-8" />} title="등록된 문서가 없습니다" description="수임계약서·위임장 등을 문서함에 보관하세요." />;

  return (
    <Card>
      <Table>
        <THead>
          <TR><TH>제목</TH><TH>유형</TH><TH>만료일</TH><TH>등록일</TH></TR>
        </THead>
        <TBody>
          {(docs ?? []).map((d) => (
            <TR key={d.id}>
              <TD className="font-medium"><span className="inline-flex items-center gap-2"><FileText className="h-4 w-4 text-muted" />{d.title}</span></TD>
              <TD><Badge tone="neutral">{typeLabel[d.doc_type]}</Badge></TD>
              <TD className="text-muted">{d.expires_on ? formatDate(d.expires_on) : "-"}</TD>
              <TD className="text-muted">{formatDate(d.created_at)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}

async function BillingTab({ clientId }: { clientId: string }) {
  const supabase = await createClient();
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, kind, period, amount, status, due_on")
    .eq("client_id", clientId)
    .order("period", { ascending: false });

  const kindLabel: Record<string, string> = { monthly: "월 기장료", adjustment: "조정료", etc: "기타" };
  const unpaid = (invoices ?? [])
    .filter((i) => i.status !== "paid")
    .reduce((s, i) => s + i.amount, 0);

  if ((invoices ?? []).length === 0)
    return <EmptyState icon={<Building2 className="h-8 w-8" />} title="청구 내역이 없습니다" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>청구 내역</CardTitle>
        <span className="text-sm text-muted">미수금 <b className="text-[var(--color-danger)]">{formatKRW(unpaid)}</b></span>
      </CardHeader>
      <Table>
        <THead>
          <TR><TH>기간</TH><TH>구분</TH><TH className="text-right">금액</TH><TH>납기</TH><TH>상태</TH></TR>
        </THead>
        <TBody>
          {(invoices ?? []).map((i) => (
            <TR key={i.id}>
              <TD className="font-medium tabular-nums">{i.period}</TD>
              <TD>{kindLabel[i.kind]}</TD>
              <TD className="text-right tabular-nums">{formatKRW(i.amount)}</TD>
              <TD className="text-muted">{formatDate(i.due_on)}</TD>
              <TD><InvoiceStatusBadge status={i.status} /></TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}
