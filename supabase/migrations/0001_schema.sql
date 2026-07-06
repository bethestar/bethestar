-- ============================================================================
-- TaxDesk 0001_schema.sql — 전 테이블 + 인덱스 + FTS
-- 세무사무소 인하우스 운영 플랫폼 (구현설계서 §3 기준)
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ----------------------------------------------------------------------------
-- 조직 (사무소)
-- ----------------------------------------------------------------------------
create table if not exists public.orgs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  biz_no      text,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 직원 (auth.users 1:1)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  org_id      uuid not null references public.orgs(id) on delete cascade,
  name        text not null,
  role        text not null default 'staff' check (role in ('admin','manager','staff')),
  phone       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists idx_profiles_org on public.profiles(org_id);

-- ----------------------------------------------------------------------------
-- 거래처 (수임처)
-- ----------------------------------------------------------------------------
create table if not exists public.clients (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.orgs(id) on delete cascade,
  business_no    text,                       -- 000-00-00000
  name           text not null,
  ceo_name       text,
  client_type    text not null default 'general'
                   check (client_type in ('corp','general','simplified','exempt')),
  industry       text,
  contact_name   text,
  contact_phone  text,
  contact_email  text,
  assignee_id    uuid references public.profiles(id) on delete set null,
  monthly_fee    integer not null default 0,
  adjustment_fee integer not null default 0,
  engaged_on     date,
  disengaged_on  date,
  disengage_reason text,
  status         text not null default 'active' check (status in ('active','terminated')),
  homtax_agreed  boolean not null default false,   -- 홈택스 수임동의 여부(수기)
  withholding    boolean not null default true,    -- 원천세 대상
  vat_applicable boolean not null default true,    -- 부가세 대상
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (org_id, business_no)
);
create index if not exists idx_clients_org on public.clients(org_id);
create index if not exists idx_clients_assignee on public.clients(assignee_id);
create index if not exists idx_clients_status on public.clients(org_id, status);

-- ----------------------------------------------------------------------------
-- 상담/연락 이력
-- ----------------------------------------------------------------------------
create table if not exists public.client_notes (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.orgs(id) on delete cascade,
  client_id      uuid not null references public.clients(id) on delete cascade,
  author_id      uuid references public.profiles(id) on delete set null,
  channel        text not null default 'call'
                   check (channel in ('call','visit','kakao','email','etc')),
  content        text not null,
  promoted_kb_id uuid,   -- kb_documents FK (아래에서 추가)
  created_at     timestamptz not null default now()
);
create index if not exists idx_client_notes_client on public.client_notes(client_id, created_at desc);
create index if not exists idx_client_notes_org on public.client_notes(org_id);

-- ----------------------------------------------------------------------------
-- 신고기한 규칙 (시드 제공, 관리자 편집 가능). org_id null = 전역 시드
-- ----------------------------------------------------------------------------
create table if not exists public.tax_deadline_rules (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references public.orgs(id) on delete cascade,
  code        text not null,                 -- 'WHT_MONTHLY','VAT_1Q' ...
  name        text not null,
  description text,
  month       integer,                       -- null = 매월
  day         integer not null,
  frequency   text not null check (frequency in ('monthly','quarterly','half','yearly')),
  applies_to  text not null default 'all'
                check (applies_to in ('all','corp','individual','vat','withholding')),
  rollover    boolean not null default true,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists idx_deadline_rules_org on public.tax_deadline_rules(org_id);

-- ----------------------------------------------------------------------------
-- 공휴일 (대체공휴일 포함 시드)
-- ----------------------------------------------------------------------------
create table if not exists public.holidays (
  date  date primary key,
  name  text not null
);

-- ----------------------------------------------------------------------------
-- 업무 템플릿
-- ----------------------------------------------------------------------------
create table if not exists public.task_templates (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.orgs(id) on delete cascade,
  name             text not null,
  description      text,
  default_priority text not null default 'normal'
                     check (default_priority in ('low','normal','high','urgent')),
  created_by       uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now()
);
create index if not exists idx_task_templates_org on public.task_templates(org_id);

create table if not exists public.task_template_items (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.task_templates(id) on delete cascade,
  content     text not null,
  sort        integer not null default 0
);
create index if not exists idx_task_template_items_tpl on public.task_template_items(template_id, sort);

-- ----------------------------------------------------------------------------
-- 업무 (태스크)
-- ----------------------------------------------------------------------------
create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.orgs(id) on delete cascade,
  title        text not null,
  description  text,
  client_id    uuid references public.clients(id) on delete cascade,
  assignee_id  uuid references public.profiles(id) on delete set null,
  due_date     date,
  priority     text not null default 'normal'
                 check (priority in ('low','normal','high','urgent')),
  status       text not null default 'todo'
                 check (status in ('todo','doing','review','done')),
  source       text not null default 'manual'
                 check (source in ('manual','automation','bulk')),
  template_id  uuid references public.task_templates(id) on delete set null,
  rule_code    text,
  period_key   text,                          -- 'VAT_1Q:2026' 멱등키
  completed_at timestamptz,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_tasks_org on public.tasks(org_id);
create index if not exists idx_tasks_assignee on public.tasks(assignee_id);
create index if not exists idx_tasks_client on public.tasks(client_id);
create index if not exists idx_tasks_status on public.tasks(org_id, status);
create index if not exists idx_tasks_due on public.tasks(org_id, due_date);
-- 자동/일괄 생성 멱등: 같은 거래처+기간+규칙 이중 생성 방지
create unique index if not exists uq_tasks_period
  on public.tasks(org_id, client_id, period_key)
  where period_key is not null and client_id is not null;

create table if not exists public.task_items (
  id       uuid primary key default gen_random_uuid(),
  task_id  uuid not null references public.tasks(id) on delete cascade,
  content  text not null,
  done     boolean not null default false,
  sort     integer not null default 0
);
create index if not exists idx_task_items_task on public.task_items(task_id, sort);

-- ----------------------------------------------------------------------------
-- 자동화
-- ----------------------------------------------------------------------------
create table if not exists public.automation_rules (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.orgs(id) on delete cascade,
  name          text not null,
  trigger_type  text not null check (trigger_type in ('deadline','monthly_day','status')),
  trigger_config jsonb not null default '{}'::jsonb,
  action_type   text not null check (action_type in ('create_tasks','notify')),
  action_config jsonb not null default '{}'::jsonb,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);
create index if not exists idx_automation_rules_org on public.automation_rules(org_id);

create table if not exists public.automation_runs (
  id      uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.automation_rules(id) on delete cascade,
  run_key text not null,                       -- rule_id + period 멱등
  ran_at  timestamptz not null default now(),
  result  jsonb not null default '{}'::jsonb,
  unique (rule_id, run_key)
);

-- ----------------------------------------------------------------------------
-- 사내 일정
-- ----------------------------------------------------------------------------
create table if not exists public.events (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.orgs(id) on delete cascade,
  title      text not null,
  starts_at  timestamptz not null,
  ends_at    timestamptz,
  all_day    boolean not null default false,
  kind       text not null default 'internal'
               check (kind in ('internal','deadline','leave','training')),
  owner_id   uuid references public.profiles(id) on delete set null,
  client_id  uuid references public.clients(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_events_org on public.events(org_id, starts_at);

-- ----------------------------------------------------------------------------
-- 지식저장소
-- ----------------------------------------------------------------------------
create table if not exists public.kb_documents (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.orgs(id) on delete cascade,
  title       text not null,
  content     text not null default '',
  category    text not null default 'manual'
                check (category in ('tax_law','manual','case','policy','scrap')),
  tags        text[] not null default '{}',
  source_url  text,
  author_id   uuid references public.profiles(id) on delete set null,
  is_archived boolean not null default false,
  search      tsvector generated always as (
                to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(content,''))
              ) stored,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_kb_org on public.kb_documents(org_id);
create index if not exists idx_kb_search on public.kb_documents using gin(search);
create index if not exists idx_kb_title_trgm on public.kb_documents using gin(title gin_trgm_ops);
create index if not exists idx_kb_content_trgm on public.kb_documents using gin(content gin_trgm_ops);

create table if not exists public.kb_revisions (
  id         uuid primary key default gen_random_uuid(),
  doc_id     uuid not null references public.kb_documents(id) on delete cascade,
  title      text not null,
  content    text not null,
  editor_id  uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_kb_revisions_doc on public.kb_revisions(doc_id, created_at desc);

-- 상담이력 → KB 승격 FK 뒤늦게 연결
alter table public.client_notes
  drop constraint if exists client_notes_promoted_kb_fk;
alter table public.client_notes
  add constraint client_notes_promoted_kb_fk
  foreign key (promoted_kb_id) references public.kb_documents(id) on delete set null;

-- ----------------------------------------------------------------------------
-- 청구 / 미수금
-- ----------------------------------------------------------------------------
create table if not exists public.invoices (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.orgs(id) on delete cascade,
  client_id  uuid not null references public.clients(id) on delete cascade,
  kind       text not null default 'monthly' check (kind in ('monthly','adjustment','etc')),
  period     text not null,                    -- '2026-07'
  amount     integer not null default 0,
  issued_on  date not null default current_date,
  due_on     date,
  status     text not null default 'issued'
               check (status in ('draft','issued','paid','overdue')),
  created_at timestamptz not null default now(),
  unique (org_id, client_id, kind, period)
);
create index if not exists idx_invoices_org on public.invoices(org_id, status);
create index if not exists idx_invoices_client on public.invoices(client_id);

create table if not exists public.payments (
  id         uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount     integer not null,
  paid_on    date not null default current_date,
  method     text,
  memo       text,
  created_at timestamptz not null default now()
);
create index if not exists idx_payments_invoice on public.payments(invoice_id);

-- ----------------------------------------------------------------------------
-- 문서함
-- ----------------------------------------------------------------------------
create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.orgs(id) on delete cascade,
  client_id    uuid references public.clients(id) on delete cascade,
  doc_type     text not null default 'etc'
                 check (doc_type in ('contract','poa','id_copy','etc')),
  title        text not null,
  storage_path text,
  expires_on   date,
  uploaded_by  uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists idx_documents_org on public.documents(org_id);
create index if not exists idx_documents_client on public.documents(client_id);

-- ----------------------------------------------------------------------------
-- 알림 (단일 채널)
-- ----------------------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.orgs(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null check (type in
               ('deadline','task_assigned','task_overdue','mention','billing','system')),
  title      text not null,
  body       text,
  link       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user on public.notifications(user_id, created_at desc);
create index if not exists idx_notifications_unread on public.notifications(user_id) where read_at is null;

-- ----------------------------------------------------------------------------
-- 감사 로그
-- ----------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.orgs(id) on delete cascade,
  actor_id   uuid references public.profiles(id) on delete set null,
  action     text not null,
  entity     text not null,
  entity_id  uuid,
  diff       jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_org on public.audit_logs(org_id, created_at desc);

-- ----------------------------------------------------------------------------
-- updated_at 자동 갱신 트리거
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_clients_updated on public.clients;
create trigger trg_clients_updated before update on public.clients
  for each row execute function public.set_updated_at();

drop trigger if exists trg_tasks_updated on public.tasks;
create trigger trg_tasks_updated before update on public.tasks
  for each row execute function public.set_updated_at();

drop trigger if exists trg_kb_updated on public.kb_documents;
create trigger trg_kb_updated before update on public.kb_documents
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 가입 시 org 생성 + admin 프로필 (signup 서버액션과 병행하는 안전장치)
-- auth.users 생성 시 raw_user_meta_data 에 org_name/name 이 있으면 자동 부트스트랩
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_org_id uuid;
  v_org_name text;
  v_name text;
begin
  v_org_name := coalesce(new.raw_user_meta_data->>'org_name', '');
  v_name := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));

  -- org_name 이 없으면 초대 가입 등으로 간주하여 프로필 자동생성 생략
  if v_org_name = '' then
    return new;
  end if;

  insert into public.orgs (name) values (v_org_name) returning id into v_org_id;
  insert into public.profiles (id, org_id, name, role)
  values (new.id, v_org_id, v_name, 'admin');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
