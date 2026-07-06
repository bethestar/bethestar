-- ============================================================================
-- TaxDesk RLS 접근 매트릭스 검증 (검증설계서 §4)
--   Supabase 마이그레이션(0001~0003) 적용 후 psql 로 실행:
--     psql "$DATABASE_URL" -f tests/rls/rls_matrix.sql
--
-- 각 시나리오는 request.jwt.claims 로 사용자를 위장(set local role authenticated)
-- 하여 정책을 통과/거부하는지 확인한다. 예상 결과는 각 블록 주석에 표기.
-- 실패(예상과 다름) 시 RAISE EXCEPTION 으로 중단된다.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 테스트 픽스처: 두 개 org, 각 역할 사용자
-- ---------------------------------------------------------------------------
set local role postgres;

-- auth.users 최소 삽입 (FK 충족용)
insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
values
  ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-000000000000','authenticated','authenticated','rls_admin@a.kr',now(),now()),
  ('00000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-000000000000','authenticated','authenticated','rls_manager@a.kr',now(),now()),
  ('00000000-0000-0000-0000-0000000000a3','00000000-0000-0000-0000-000000000000','authenticated','authenticated','rls_staff@a.kr',now(),now()),
  ('00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-000000000000','authenticated','authenticated','rls_other@b.kr',now(),now())
on conflict (id) do nothing;

insert into public.orgs (id, name) values
  ('0a000000-0000-0000-0000-000000000001','A세무사무소'),
  ('0b000000-0000-0000-0000-000000000002','B세무사무소')
on conflict (id) do nothing;

insert into public.profiles (id, org_id, name, role) values
  ('00000000-0000-0000-0000-0000000000a1','0a000000-0000-0000-0000-000000000001','A관리자','admin'),
  ('00000000-0000-0000-0000-0000000000a2','0a000000-0000-0000-0000-000000000001','A실장','manager'),
  ('00000000-0000-0000-0000-0000000000a3','0a000000-0000-0000-0000-000000000001','A직원','staff'),
  ('00000000-0000-0000-0000-0000000000b1','0b000000-0000-0000-0000-000000000002','B직원','staff')
on conflict (id) do nothing;

insert into public.clients (id, org_id, name) values
  ('0c000000-0000-0000-0000-000000000001','0a000000-0000-0000-0000-000000000001','A거래처')
on conflict (id) do nothing;

insert into public.automation_rules (id, org_id, name, trigger_type, action_type) values
  ('0d000000-0000-0000-0000-000000000001','0a000000-0000-0000-0000-000000000001','A규칙','monthly_day','notify')
on conflict (id) do nothing;

insert into public.notifications (id, org_id, user_id, type, title) values
  ('0e000000-0000-0000-0000-000000000001','0a000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000a3','system','A직원 알림')
on conflict (id) do nothing;

-- 헬퍼: 특정 사용자로 위장
create or replace function pg_temp.act_as(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('role','authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role','authenticated')::text, true);
end;$$;

create or replace function pg_temp.expect(cond boolean, msg text) returns void language plpgsql as $$
begin
  if not cond then raise exception 'RLS FAIL: %', msg; end if;
end;$$;

-- ---------------------------------------------------------------------------
-- clients SELECT: staff/manager/admin 허용, 타 org 거부
-- ---------------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a3'); -- A staff
select pg_temp.expect(
  (select count(*) from public.clients where id='0c000000-0000-0000-0000-000000000001') = 1,
  'A staff 는 자기 org 거래처 SELECT 가능해야 함');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000b1'); -- B staff
select pg_temp.expect(
  (select count(*) from public.clients where id='0c000000-0000-0000-0000-000000000001') = 0,
  '타 org 사용자는 A 거래처 SELECT 불가해야 함');

-- ---------------------------------------------------------------------------
-- clients DELETE: staff 거부, manager 허용
-- ---------------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a3'); -- staff
do $$
begin
  delete from public.clients where id='0c000000-0000-0000-0000-000000000001';
  -- RLS 로 0건 삭제되어야 함 (에러는 아님)
  perform pg_temp.expect(
    (select count(*) from public.clients where id='0c000000-0000-0000-0000-000000000001') = 1,
    'staff 의 clients DELETE 는 정책상 0건이어야 함');
end$$;

-- ---------------------------------------------------------------------------
-- invoices INSERT: staff 거부, manager 허용
-- ---------------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a3'); -- staff
do $$
begin
  begin
    insert into public.invoices (org_id, client_id, kind, period, amount)
    values ('0a000000-0000-0000-0000-000000000001','0c000000-0000-0000-0000-000000000001','monthly','2026-07',100000);
    raise exception 'RLS FAIL: staff 의 invoices INSERT 가 허용됨';
  exception when insufficient_privilege or check_violation then
    null; -- 기대: RLS 위반
  end;
end$$;

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a2'); -- manager
insert into public.invoices (org_id, client_id, kind, period, amount)
values ('0a000000-0000-0000-0000-000000000001','0c000000-0000-0000-0000-000000000001','monthly','2026-07',100000)
on conflict do nothing;
select pg_temp.expect(
  (select count(*) from public.invoices where org_id='0a000000-0000-0000-0000-000000000001' and period='2026-07') = 1,
  'manager 는 invoices INSERT 가능해야 함');

-- ---------------------------------------------------------------------------
-- automation_rules UPDATE: manager 거부, admin 허용
-- ---------------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a2'); -- manager
do $$
begin
  update public.automation_rules set active=false where id='0d000000-0000-0000-0000-000000000001';
  perform pg_temp.expect(
    (select active from public.automation_rules where id='0d000000-0000-0000-0000-000000000001') = true,
    'manager 의 automation_rules UPDATE 는 정책상 반영되지 않아야 함');
end$$;

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1'); -- admin
update public.automation_rules set active=false where id='0d000000-0000-0000-0000-000000000001';
select pg_temp.expect(
  (select active from public.automation_rules where id='0d000000-0000-0000-0000-000000000001') = false,
  'admin 은 automation_rules UPDATE 가능해야 함');

-- ---------------------------------------------------------------------------
-- notifications SELECT: 타인 것 거부
-- ---------------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a2'); -- manager (A직원 알림 소유 아님)
select pg_temp.expect(
  (select count(*) from public.notifications where id='0e000000-0000-0000-0000-000000000001') = 0,
  '타인의 notifications 는 SELECT 불가해야 함');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a3'); -- 본인
select pg_temp.expect(
  (select count(*) from public.notifications where id='0e000000-0000-0000-0000-000000000001') = 1,
  '본인 notifications 는 SELECT 가능해야 함');

-- ---------------------------------------------------------------------------
-- audit_logs SELECT: staff/manager 거부, admin 허용
-- ---------------------------------------------------------------------------
set local role postgres;
insert into public.audit_logs (org_id, actor_id, action, entity)
values ('0a000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000a1','test','client')
on conflict do nothing;

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a3'); -- staff
select pg_temp.expect(
  (select count(*) from public.audit_logs) = 0,
  'staff 는 audit_logs SELECT 불가해야 함');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1'); -- admin
select pg_temp.expect(
  (select count(*) from public.audit_logs) >= 1,
  'admin 은 audit_logs SELECT 가능해야 함');

-- ---------------------------------------------------------------------------
-- profiles.role 자가 상승 방지: staff 가 본인 role 을 admin 으로 변경 불가
-- ---------------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a3'); -- staff
do $$
begin
  begin
    update public.profiles set role='admin' where id='00000000-0000-0000-0000-0000000000a3';
  exception when others then null;
  end;
  perform pg_temp.expect(
    (select role from public.profiles where id='00000000-0000-0000-0000-0000000000a3') = 'staff',
    'staff 는 본인 role 을 상승시킬 수 없어야 함');
end$$;

select '✅ 모든 RLS 매트릭스 시나리오 통과' as result;

rollback;  -- 테스트 데이터는 롤백 (검증만 수행)
