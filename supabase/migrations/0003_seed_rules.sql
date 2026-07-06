-- ============================================================================
-- TaxDesk 0003_seed_rules.sql
--  - 전역 신고기한 규칙 시드 (org_id null)
--  - 2026 대한민국 공휴일 + 대체공휴일 시드
--  - 신규 org 부트스트랩 함수(기본 자동화 규칙 + 기본 업무 템플릿)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 전역 신고기한 규칙 (org_id null = 모든 사무소 공통 기준)
-- frequency: monthly(매월) / quarterly(1·4·7·10월) / half(1·7월) / yearly(month 지정)
-- ----------------------------------------------------------------------------
insert into public.tax_deadline_rules
  (org_id, code, name, description, month, day, frequency, applies_to, rollover, active)
values
  (null,'WHT_MONTHLY','원천세 신고·납부','매월 10일까지 원천징수이행상황신고',            null,10,'monthly','withholding',true,true),
  (null,'VAT','부가가치세 신고·납부','예정·확정 신고 (1·4·7·10월 25일)',                 null,25,'quarterly','vat',true,true),
  (null,'CORP_TAX','법인세 신고·납부','12월 결산법인 기준 3월 31일',                       3,31,'yearly','corp',true,true),
  (null,'INCOME_TAX','종합소득세 신고·납부','5월 31일까지',                                5,31,'yearly','individual',true,true),
  (null,'HONEST_TAX','성실신고확인 대상 신고','성실신고확인서 제출 대상 6월 30일',          6,30,'yearly','individual',true,true),
  (null,'BIZ_STATUS','사업장현황신고','개인 면세사업자 2월 10일',                          2,10,'yearly','individual',true,true),
  (null,'EXEMPT_STATUS','면세사업장 수입금액명세','2월 10일',                              2,10,'yearly','all',true,true),
  (null,'PAYMENT_STMT','지급명세서(근로·사업) 제출','3월 10일',                            3,10,'yearly','all',true,true),
  (null,'WHT_HALF','원천세 반기납부','반기 종료 다음달 10일 (1월·7월)',                   null,10,'half','withholding',true,true),
  (null,'CORP_INTERIM','법인세 중간예납','8월 31일',                                       8,31,'yearly','corp',true,true)
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- 2026 대한민국 공휴일 (대체공휴일 포함)
-- ----------------------------------------------------------------------------
insert into public.holidays (date, name) values
  ('2026-01-01','신정'),
  ('2026-02-16','설날 연휴'),
  ('2026-02-17','설날'),
  ('2026-02-18','설날 연휴'),
  ('2026-03-01','삼일절'),
  ('2026-03-02','삼일절 대체공휴일'),
  ('2026-05-05','어린이날'),
  ('2026-05-24','부처님오신날'),
  ('2026-05-25','부처님오신날 대체공휴일'),
  ('2026-06-06','현충일'),
  ('2026-08-15','광복절'),
  ('2026-08-17','광복절 대체공휴일'),
  ('2026-09-24','추석 연휴'),
  ('2026-09-25','추석'),
  ('2026-09-26','추석 연휴'),
  ('2026-09-28','추석 대체공휴일'),
  ('2026-10-03','개천절'),
  ('2026-10-05','개천절 대체공휴일'),
  ('2026-10-09','한글날'),
  ('2026-12-25','기독탄신일')
on conflict (date) do nothing;

-- ----------------------------------------------------------------------------
-- 신규 org 부트스트랩: 기본 업무 템플릿 + 기본 자동화 규칙
-- handle_new_user 에서 호출됨
-- ----------------------------------------------------------------------------
create or replace function public.seed_org_defaults(p_org_id uuid, p_author uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_tpl_vat uuid;
  v_tpl_wht uuid;
  v_tpl_corp uuid;
begin
  -- 부가세 신고 템플릿
  insert into public.task_templates (org_id, name, description, default_priority, created_by)
  values (p_org_id, '부가세 신고 처리', '부가가치세 예정·확정 신고 표준 절차', 'high', p_author)
  returning id into v_tpl_vat;
  insert into public.task_template_items (template_id, content, sort) values
    (v_tpl_vat, '거래처 매입·매출 자료 수취', 1),
    (v_tpl_vat, '자료 검토 및 누락 확인', 2),
    (v_tpl_vat, '신고서 작성(세무프로그램)', 3),
    (v_tpl_vat, '검토·승인', 4),
    (v_tpl_vat, '전자신고 및 납부 안내', 5);

  -- 원천세 신고 템플릿
  insert into public.task_templates (org_id, name, description, default_priority, created_by)
  values (p_org_id, '원천세 신고 처리', '원천징수이행상황신고 표준 절차', 'normal', p_author)
  returning id into v_tpl_wht;
  insert into public.task_template_items (template_id, content, sort) values
    (v_tpl_wht, '급여·사업소득 자료 확인', 1),
    (v_tpl_wht, '원천세 계산 및 신고서 작성', 2),
    (v_tpl_wht, '전자신고', 3),
    (v_tpl_wht, '납부서 발송 및 안내', 4);

  -- 법인세 신고 템플릿
  insert into public.task_templates (org_id, name, description, default_priority, created_by)
  values (p_org_id, '법인세 신고 처리', '법인세 결산·신고 표준 절차', 'urgent', p_author)
  returning id into v_tpl_corp;
  insert into public.task_template_items (template_id, content, sort) values
    (v_tpl_corp, '결산 자료 수취', 1),
    (v_tpl_corp, '결산 조정', 2),
    (v_tpl_corp, '세무조정계산서 작성', 3),
    (v_tpl_corp, '검토·승인', 4),
    (v_tpl_corp, '전자신고 및 납부 안내', 5);

  -- 기본 자동화 규칙
  insert into public.automation_rules (org_id, name, trigger_type, trigger_config, action_type, action_config, active)
  values
    (p_org_id, '부가세 D-14 자료수취 태스크 생성', 'deadline',
      jsonb_build_object('rule_code','VAT','days_before',14),
      'create_tasks',
      jsonb_build_object('title','부가세 자료수취','filter','vat','priority','high','template_id', v_tpl_vat),
      true),
    (p_org_id, '원천세 매월 1일 태스크 생성', 'monthly_day',
      jsonb_build_object('day',1),
      'create_tasks',
      jsonb_build_object('title','원천세 신고 준비','filter','withholding','priority','normal','template_id', v_tpl_wht),
      true),
    (p_org_id, '법인세 D-21 신고 태스크 생성', 'deadline',
      jsonb_build_object('rule_code','CORP_TAX','days_before',21),
      'create_tasks',
      jsonb_build_object('title','법인세 신고 준비','filter','corp','priority','urgent','template_id', v_tpl_corp),
      true);
end;
$$;

-- handle_new_user 재정의: org·admin 프로필 생성 후 기본값 시드
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_org_id uuid;
  v_org_name text;
  v_name text;
begin
  v_org_name := coalesce(new.raw_user_meta_data->>'org_name', '');
  v_name := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));

  if v_org_name = '' then
    return new;
  end if;

  insert into public.orgs (name) values (v_org_name) returning id into v_org_id;
  insert into public.profiles (id, org_id, name, role)
  values (new.id, v_org_id, v_name, 'admin');

  perform public.seed_org_defaults(v_org_id, new.id);

  return new;
end;
$$;
