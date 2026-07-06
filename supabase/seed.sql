-- ============================================================================
-- TaxDesk seed.sql — 데모 데이터
--   로그인 계정 (비밀번호 모두: taxdesk1234)
--     admin@taxdesk.kr   (대표세무사)
--     manager@taxdesk.kr (실장)
--     staff@taxdesk.kr   (담당직원)
-- ============================================================================

-- 고정 UUID
-- org        : 11111111-1111-1111-1111-111111111111
-- admin user : aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
-- manager    : bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb
-- staff      : cccccccc-cccc-cccc-cccc-cccccccccccc

-- ---------------------------------------------------------------------------
-- 데모 auth 사용자 (트리거 우회를 위해 org_name 메타 없이 생성)
-- ---------------------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'admin@taxdesk.kr', crypt('taxdesk1234', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}','{"name":"김대표"}', now(), now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'manager@taxdesk.kr', crypt('taxdesk1234', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}','{"name":"이실장"}', now(), now()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'staff@taxdesk.kr', crypt('taxdesk1234', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}','{"name":"박담당"}', now(), now())
on conflict (id) do nothing;

insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
values
  (gen_random_uuid(),'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","email":"admin@taxdesk.kr"}','email','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',now(),now(),now()),
  (gen_random_uuid(),'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","email":"manager@taxdesk.kr"}','email','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',now(),now(),now()),
  (gen_random_uuid(),'cccccccc-cccc-cccc-cccc-cccccccccccc','{"sub":"cccccccc-cccc-cccc-cccc-cccccccccccc","email":"staff@taxdesk.kr"}','email','cccccccc-cccc-cccc-cccc-cccccccccccc',now(),now(),now())
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 조직 + 프로필
-- ---------------------------------------------------------------------------
insert into public.orgs (id, name, biz_no) values
  ('11111111-1111-1111-1111-111111111111','더밝은세무회계사무소','123-45-67890')
on conflict (id) do nothing;

insert into public.profiles (id, org_id, name, role, phone, is_active) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111','김대표','admin','010-1000-0001',true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','11111111-1111-1111-1111-111111111111','이실장','manager','010-1000-0002',true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc','11111111-1111-1111-1111-111111111111','박담당','staff','010-1000-0003',true)
on conflict (id) do nothing;

-- 기본 템플릿/자동화 규칙 시드
select public.seed_org_defaults('11111111-1111-1111-1111-111111111111','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
where not exists (select 1 from public.task_templates where org_id = '11111111-1111-1111-1111-111111111111');

-- ---------------------------------------------------------------------------
-- 거래처 10곳
-- ---------------------------------------------------------------------------
insert into public.clients (id, org_id, business_no, name, ceo_name, client_type, industry,
  contact_name, contact_phone, contact_email, assignee_id, monthly_fee, adjustment_fee,
  engaged_on, status, homtax_agreed, withholding, vat_applicable, notes) values
  ('d0000001-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','201-81-11111','(주)한빛테크','정한빛','corp','소프트웨어개발','정한빛','010-2000-0001','hanbit@corp.kr','cccccccc-cccc-cccc-cccc-cccccccccccc',300000,1500000,'2023-03-01','active',true,true,true,'매출 급증. 중간예납 유의'),
  ('d0000002-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','202-81-22222','대성물산(주)','김대성','corp','도소매','김대성','010-2000-0002','daesung@corp.kr','cccccccc-cccc-cccc-cccc-cccccccccccc',250000,1200000,'2022-06-15','active',true,true,true,'수출 비중 높음. 영세율 검토'),
  ('d0000003-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','203-05-33333','민들레카페','이민들','general','음식점업','이민들','010-2000-0003','cafe@shop.kr','cccccccc-cccc-cccc-cccc-cccccccccccc',100000,300000,'2024-01-10','active',false,true,true,'현금매출 비중 확인 필요'),
  ('d0000004-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','204-05-44444','우리약국','최우리','general','소매업(의약품)','최우리','010-2000-0004','pharm@shop.kr','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',120000,400000,'2023-09-01','active',true,true,true,null),
  ('d0000005-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','205-02-55555','간편김밥','박간편','simplified','음식점업','박간편','010-2000-0005','kimbap@shop.kr','cccccccc-cccc-cccc-cccc-cccccccccccc',80000,150000,'2024-05-20','active',false,true,true,'간이과세자'),
  ('d0000006-0000-0000-0000-000000000006','11111111-1111-1111-1111-111111111111','206-90-66666','행복요양병원','한행복','exempt','의료업','한행복','010-2000-0006','care@med.kr','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',200000,600000,'2022-02-01','active',true,true,false,'면세사업자. 사업장현황신고 대상'),
  ('d0000007-0000-0000-0000-000000000007','11111111-1111-1111-1111-111111111111','207-81-77777','(주)그린에너지','오그린','corp','제조업','오그린','010-2000-0007','green@corp.kr','cccccccc-cccc-cccc-cccc-cccccccccccc',350000,2000000,'2021-11-01','active',true,true,true,'성실신고 대상 검토'),
  ('d0000008-0000-0000-0000-000000000008','11111111-1111-1111-1111-111111111111','208-11-88888','스마일치과','문스마','general','의료업','문스마','010-2000-0008','smile@med.kr','cccccccc-cccc-cccc-cccc-cccccccccccc',150000,500000,'2023-07-07','active',true,true,true,null),
  ('d0000009-0000-0000-0000-000000000009','11111111-1111-1111-1111-111111111111','209-05-99999','튼튼헬스장','강튼튼','general','서비스업','강튼튼','010-2000-0009','gym@shop.kr','cccccccc-cccc-cccc-cccc-cccccccccccc',110000,300000,'2024-03-15','active',false,true,true,null),
  ('d0000010-0000-0000-0000-000000000010','11111111-1111-1111-1111-111111111111','210-81-10101','폐업컨설팅(주)','서폐업','corp','컨설팅','서폐업','010-2000-0010','old@corp.kr','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',0,0,'2020-01-01','terminated',false,false,false,'2025-12 해지')
on conflict (id) do nothing;

update public.clients set disengaged_on = '2025-12-31', disengage_reason = '대표 은퇴로 폐업'
  where id = 'd0000010-0000-0000-0000-000000000010';

-- ---------------------------------------------------------------------------
-- 상담이력
-- ---------------------------------------------------------------------------
insert into public.client_notes (org_id, client_id, author_id, channel, content) values
  ('11111111-1111-1111-1111-111111111111','d0000001-0000-0000-0000-000000000001','cccccccc-cccc-cccc-cccc-cccccccccccc','call','대표님 통화. 3분기 매출 자료 다음주 전달 예정.'),
  ('11111111-1111-1111-1111-111111111111','d0000001-0000-0000-0000-000000000001','cccccccc-cccc-cccc-cccc-cccccccccccc','kakao','법인카드 사용내역 엑셀 수취 완료.'),
  ('11111111-1111-1111-1111-111111111111','d0000003-0000-0000-0000-000000000003','cccccccc-cccc-cccc-cccc-cccccccccccc','visit','방문 상담. 현금영수증 의무발행 안내함.'),
  ('11111111-1111-1111-1111-111111111111','d0000006-0000-0000-0000-000000000006','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','email','사업장현황신고 필요서류 이메일 안내.')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 업무(태스크)
-- ---------------------------------------------------------------------------
insert into public.tasks (id, org_id, title, description, client_id, assignee_id, due_date, priority, status, source, created_by) values
  ('t0000001-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','부가세 2기 예정 자료수취','(주)한빛테크 매입매출 자료','d0000001-0000-0000-0000-000000000001','cccccccc-cccc-cccc-cccc-cccccccccccc','2026-07-20','high','doing','manual','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('t0000002-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','원천세 7월 신고','민들레카페 원천세','d0000003-0000-0000-0000-000000000003','cccccccc-cccc-cccc-cccc-cccccccccccc','2026-07-10','normal','todo','manual','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('t0000003-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','사업장현황신고 준비','행복요양병원','d0000006-0000-0000-0000-000000000006','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','2026-06-30','normal','review','manual','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('t0000004-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','법인세 신고 검토','(주)그린에너지 세무조정','d0000007-0000-0000-0000-000000000007','cccccccc-cccc-cccc-cccc-cccccccccccc','2026-06-25','urgent','done','manual','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('t0000005-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','기장료 미납 안내','대성물산 6월 기장료','d0000002-0000-0000-0000-000000000002','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','2026-07-05','high','todo','manual','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
on conflict (id) do nothing;

update public.tasks set completed_at = '2026-06-24 10:00:00+09' where id = 't0000004-0000-0000-0000-000000000004';

insert into public.task_items (task_id, content, done, sort) values
  ('t0000001-0000-0000-0000-000000000001','매출 세금계산서 수취',true,1),
  ('t0000001-0000-0000-0000-000000000001','매입 세금계산서 수취',false,2),
  ('t0000001-0000-0000-0000-000000000001','카드매출 자료 확인',false,3)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 사내 일정
-- ---------------------------------------------------------------------------
insert into public.events (org_id, title, starts_at, ends_at, all_day, kind, owner_id) values
  ('11111111-1111-1111-1111-111111111111','전체 회의','2026-07-07 09:00:00+09','2026-07-07 10:00:00+09',false,'internal','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('11111111-1111-1111-1111-111111111111','박담당 연차','2026-07-15 00:00:00+09',null,true,'leave','cccccccc-cccc-cccc-cccc-cccccccccccc'),
  ('11111111-1111-1111-1111-111111111111','세법 개정 교육','2026-07-22 14:00:00+09','2026-07-22 17:00:00+09',false,'training','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 지식저장소
-- ---------------------------------------------------------------------------
insert into public.kb_documents (id, org_id, title, content, category, tags, source_url, author_id) values
  ('kb000001-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','부가가치세 신고 실무 체크리스트',
   E'# 부가가치세 신고 실무 체크리스트\n\n## 자료 수취\n- 매출 세금계산서 합계표\n- 매입 세금계산서 합계표\n- 신용카드 매출전표\n- 현금영수증 발행분\n\n## 유의사항\n- 영세율 첨부서류 누락 주의\n- 대손세액공제 요건 확인\n- 의제매입세액공제(음식점) 한도 검토',
   'manual','{부가세,체크리스트,실무}',null,'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('kb000002-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','간이과세자 vs 일반과세자 판정 기준',
   E'# 간이과세 판정\n\n연 매출 **1억 400만원** 미만 시 간이과세 적용 가능(2024년 기준).\n\n- 부동산임대업·과세유흥장소는 4,800만원 기준\n- 간이과세 배제 업종 유의\n- 세금계산서 발급의무 간이과세자(4,800만원 이상) 구분',
   'tax_law','{간이과세,부가세,판정}','https://www.nts.go.kr','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('kb000003-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','[상담사례] 현금매출 누락 거래처 대응',
   E'# 상담 사례\n\n음식점 거래처의 현금매출 신고 누락 우려 상담.\n\n## 안내 내용\n- 현금영수증 의무발행업종 여부 확인\n- 자진신고 유도, 가산세 리스크 설명\n- POS 매출과 신고매출 대사 권고',
   'case','{상담사례,현금매출,음식점}',null,'cccccccc-cccc-cccc-cccc-cccccccccccc')
on conflict (id) do nothing;

insert into public.kb_revisions (doc_id, title, content, editor_id) values
  ('kb000001-0000-0000-0000-000000000001','부가가치세 신고 실무 체크리스트','(초안) 부가세 체크리스트','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 청구 / 입금
-- ---------------------------------------------------------------------------
insert into public.invoices (id, org_id, client_id, kind, period, amount, issued_on, due_on, status) values
  ('i0000001-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','d0000001-0000-0000-0000-000000000001','monthly','2026-06',300000,'2026-06-01','2026-06-30','paid'),
  ('i0000002-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','d0000002-0000-0000-0000-000000000002','monthly','2026-06',250000,'2026-06-01','2026-06-30','overdue'),
  ('i0000003-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','d0000003-0000-0000-0000-000000000003','monthly','2026-06',100000,'2026-06-01','2026-06-30','issued'),
  ('i0000004-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','d0000001-0000-0000-0000-000000000001','monthly','2026-07',300000,'2026-07-01','2026-07-31','issued'),
  ('i0000005-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','d0000007-0000-0000-0000-000000000007','adjustment','2026-05',2000000,'2026-05-20','2026-05-31','paid')
on conflict (id) do nothing;

insert into public.payments (invoice_id, amount, paid_on, method, memo) values
  ('i0000001-0000-0000-0000-000000000001',300000,'2026-06-25','이체','정상 입금'),
  ('i0000005-0000-0000-0000-000000000005',2000000,'2026-05-28','이체','법인세 조정료')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 문서함
-- ---------------------------------------------------------------------------
insert into public.documents (org_id, client_id, doc_type, title, storage_path, expires_on, uploaded_by) values
  ('11111111-1111-1111-1111-111111111111','d0000001-0000-0000-0000-000000000001','contract','수임계약서(한빛테크)','demo/hanbit-contract.pdf',null,'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('11111111-1111-1111-1111-111111111111','d0000001-0000-0000-0000-000000000001','poa','세무대리 위임장','demo/hanbit-poa.pdf','2026-12-31','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 알림
-- ---------------------------------------------------------------------------
insert into public.notifications (org_id, user_id, type, title, body, link) values
  ('11111111-1111-1111-1111-111111111111','cccccccc-cccc-cccc-cccc-cccccccccccc','task_assigned','새 업무가 배정되었습니다','부가세 2기 예정 자료수취','/tasks'),
  ('11111111-1111-1111-1111-111111111111','cccccccc-cccc-cccc-cccc-cccccccccccc','deadline','원천세 신고기한 임박','7월 원천세 신고기한이 D-4 입니다','/calendar'),
  ('11111111-1111-1111-1111-111111111111','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','billing','미수금 발생','대성물산 6월 기장료 연체','/billing')
on conflict do nothing;
