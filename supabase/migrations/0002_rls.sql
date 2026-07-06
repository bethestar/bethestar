-- ============================================================================
-- TaxDesk 0002_rls.sql — RLS 헬퍼 함수 + 전 테이블 정책
-- 구현설계서 §3.2 접근 매트릭스 기준
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 헬퍼 함수 (security definer — profiles 재귀 RLS 회피)
-- ----------------------------------------------------------------------------
create or replace function public.current_org_id()
returns uuid language sql stable security definer set search_path = public as $$
  select org_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_manager()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid()) in ('admin','manager'), false);
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid()) = 'admin', false);
$$;

-- ----------------------------------------------------------------------------
-- RLS 활성화
-- ----------------------------------------------------------------------------
alter table public.orgs                enable row level security;
alter table public.profiles            enable row level security;
alter table public.clients             enable row level security;
alter table public.client_notes        enable row level security;
alter table public.tax_deadline_rules  enable row level security;
alter table public.holidays            enable row level security;
alter table public.task_templates      enable row level security;
alter table public.task_template_items enable row level security;
alter table public.tasks               enable row level security;
alter table public.task_items          enable row level security;
alter table public.automation_rules    enable row level security;
alter table public.automation_runs     enable row level security;
alter table public.events              enable row level security;
alter table public.kb_documents        enable row level security;
alter table public.kb_revisions        enable row level security;
alter table public.invoices            enable row level security;
alter table public.payments            enable row level security;
alter table public.documents           enable row level security;
alter table public.notifications       enable row level security;
alter table public.audit_logs          enable row level security;

-- ----------------------------------------------------------------------------
-- orgs: 본인 소속 org 만 조회
-- ----------------------------------------------------------------------------
drop policy if exists orgs_select on public.orgs;
create policy orgs_select on public.orgs for select
  using (id = public.current_org_id());

drop policy if exists orgs_update on public.orgs;
create policy orgs_update on public.orgs for update
  using (id = public.current_org_id() and public.is_admin())
  with check (id = public.current_org_id());

-- ----------------------------------------------------------------------------
-- profiles: 같은 org 조회 / 본인 제한 수정 / admin 관리
-- 자가 역할 상승 방지: role 변경은 admin 만
-- ----------------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (org_id = public.current_org_id());

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert
  with check (org_id = public.current_org_id() and public.is_admin());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.current_role());  -- 본인은 역할 변경 불가

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles for update
  using (org_id = public.current_org_id() and public.is_admin())
  with check (org_id = public.current_org_id());

drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles for delete
  using (org_id = public.current_org_id() and public.is_admin());

-- ----------------------------------------------------------------------------
-- 공통 패턴: 같은 org 전체 열람 / manager+ 쓰기·삭제
-- clients
-- ----------------------------------------------------------------------------
drop policy if exists clients_select on public.clients;
create policy clients_select on public.clients for select
  using (org_id = public.current_org_id());
drop policy if exists clients_insert on public.clients;
create policy clients_insert on public.clients for insert
  with check (org_id = public.current_org_id());
drop policy if exists clients_update on public.clients;
create policy clients_update on public.clients for update
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());
drop policy if exists clients_delete on public.clients;
create policy clients_delete on public.clients for delete
  using (org_id = public.current_org_id() and public.is_manager());

-- client_notes
drop policy if exists client_notes_select on public.client_notes;
create policy client_notes_select on public.client_notes for select
  using (org_id = public.current_org_id());
drop policy if exists client_notes_insert on public.client_notes;
create policy client_notes_insert on public.client_notes for insert
  with check (org_id = public.current_org_id());
drop policy if exists client_notes_update on public.client_notes;
create policy client_notes_update on public.client_notes for update
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
drop policy if exists client_notes_delete on public.client_notes;
create policy client_notes_delete on public.client_notes for delete
  using (org_id = public.current_org_id() and public.is_manager());

-- tasks
drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks for select
  using (org_id = public.current_org_id());
drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks for insert
  with check (org_id = public.current_org_id());
drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks for update
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
drop policy if exists tasks_delete on public.tasks;
create policy tasks_delete on public.tasks for delete
  using (org_id = public.current_org_id() and public.is_manager());

-- task_items (task 를 통해 org 확인)
drop policy if exists task_items_all on public.task_items;
create policy task_items_all on public.task_items for all
  using (exists (select 1 from public.tasks t where t.id = task_id and t.org_id = public.current_org_id()))
  with check (exists (select 1 from public.tasks t where t.id = task_id and t.org_id = public.current_org_id()));

-- task_templates
drop policy if exists task_templates_select on public.task_templates;
create policy task_templates_select on public.task_templates for select
  using (org_id = public.current_org_id());
drop policy if exists task_templates_write on public.task_templates;
create policy task_templates_write on public.task_templates for all
  using (org_id = public.current_org_id() and public.is_manager())
  with check (org_id = public.current_org_id() and public.is_manager());

drop policy if exists task_template_items_all on public.task_template_items;
create policy task_template_items_all on public.task_template_items for all
  using (exists (select 1 from public.task_templates t where t.id = template_id and t.org_id = public.current_org_id()))
  with check (exists (select 1 from public.task_templates t where t.id = template_id and t.org_id = public.current_org_id()));

-- events
drop policy if exists events_select on public.events;
create policy events_select on public.events for select
  using (org_id = public.current_org_id());
drop policy if exists events_write on public.events;
create policy events_write on public.events for all
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());

-- kb_documents
drop policy if exists kb_select on public.kb_documents;
create policy kb_select on public.kb_documents for select
  using (org_id = public.current_org_id());
drop policy if exists kb_insert on public.kb_documents;
create policy kb_insert on public.kb_documents for insert
  with check (org_id = public.current_org_id());
drop policy if exists kb_update on public.kb_documents;
create policy kb_update on public.kb_documents for update
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
drop policy if exists kb_delete on public.kb_documents;
create policy kb_delete on public.kb_documents for delete
  using (org_id = public.current_org_id() and public.is_manager());

drop policy if exists kb_revisions_all on public.kb_revisions;
create policy kb_revisions_all on public.kb_revisions for all
  using (exists (select 1 from public.kb_documents d where d.id = doc_id and d.org_id = public.current_org_id()))
  with check (exists (select 1 from public.kb_documents d where d.id = doc_id and d.org_id = public.current_org_id()));

-- documents
drop policy if exists documents_select on public.documents;
create policy documents_select on public.documents for select
  using (org_id = public.current_org_id());
drop policy if exists documents_write on public.documents;
create policy documents_write on public.documents for all
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());

-- ----------------------------------------------------------------------------
-- invoices / payments: manager+ 쓰기, admin 삭제
-- ----------------------------------------------------------------------------
drop policy if exists invoices_select on public.invoices;
create policy invoices_select on public.invoices for select
  using (org_id = public.current_org_id());
drop policy if exists invoices_insert on public.invoices;
create policy invoices_insert on public.invoices for insert
  with check (org_id = public.current_org_id() and public.is_manager());
drop policy if exists invoices_update on public.invoices;
create policy invoices_update on public.invoices for update
  using (org_id = public.current_org_id() and public.is_manager())
  with check (org_id = public.current_org_id() and public.is_manager());
drop policy if exists invoices_delete on public.invoices;
create policy invoices_delete on public.invoices for delete
  using (org_id = public.current_org_id() and public.is_admin());

drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments for select
  using (exists (select 1 from public.invoices i where i.id = invoice_id and i.org_id = public.current_org_id()));
drop policy if exists payments_write on public.payments;
create policy payments_write on public.payments for all
  using (exists (select 1 from public.invoices i where i.id = invoice_id and i.org_id = public.current_org_id()) and public.is_manager())
  with check (exists (select 1 from public.invoices i where i.id = invoice_id and i.org_id = public.current_org_id()) and public.is_manager());

-- ----------------------------------------------------------------------------
-- automation_rules / tax_deadline_rules: admin 만 쓰기
-- ----------------------------------------------------------------------------
drop policy if exists automation_rules_select on public.automation_rules;
create policy automation_rules_select on public.automation_rules for select
  using (org_id = public.current_org_id());
drop policy if exists automation_rules_write on public.automation_rules;
create policy automation_rules_write on public.automation_rules for all
  using (org_id = public.current_org_id() and public.is_admin())
  with check (org_id = public.current_org_id() and public.is_admin());

drop policy if exists automation_runs_select on public.automation_runs;
create policy automation_runs_select on public.automation_runs for select
  using (exists (select 1 from public.automation_rules r where r.id = rule_id and r.org_id = public.current_org_id()));

-- tax_deadline_rules: 전역(org_id null) 또는 자기 org 조회, 자기 org 쓰기는 admin
drop policy if exists deadline_rules_select on public.tax_deadline_rules;
create policy deadline_rules_select on public.tax_deadline_rules for select
  using (org_id is null or org_id = public.current_org_id());
drop policy if exists deadline_rules_write on public.tax_deadline_rules;
create policy deadline_rules_write on public.tax_deadline_rules for all
  using (org_id = public.current_org_id() and public.is_admin())
  with check (org_id = public.current_org_id() and public.is_admin());

-- holidays: 전역 읽기 전용 (모든 인증 사용자 조회)
drop policy if exists holidays_select on public.holidays;
create policy holidays_select on public.holidays for select
  using (auth.uid() is not null);

-- ----------------------------------------------------------------------------
-- notifications: 본인 것만
-- ----------------------------------------------------------------------------
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications for select
  using (user_id = auth.uid());
drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists notifications_delete on public.notifications;
create policy notifications_delete on public.notifications for delete
  using (user_id = auth.uid());
-- INSERT 는 같은 org 사용자(배정 알림 등) 및 service role 허용
drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert on public.notifications for insert
  with check (org_id = public.current_org_id());

-- ----------------------------------------------------------------------------
-- audit_logs: admin 조회, 같은 org insert (시스템 기록)
-- ----------------------------------------------------------------------------
drop policy if exists audit_select on public.audit_logs;
create policy audit_select on public.audit_logs for select
  using (org_id = public.current_org_id() and public.is_admin());
drop policy if exists audit_insert on public.audit_logs;
create policy audit_insert on public.audit_logs for insert
  with check (org_id = public.current_org_id());
