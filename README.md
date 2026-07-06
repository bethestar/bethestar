# TaxDesk (택스데스크)

> 세무사무소 인하우스 운영 플랫폼 — "신고 프로그램 밖의 모든 사무실 운영 업무를 하나의 채널에서"

세무사랑·위하고 등 기존 세무 프로그램이 담당하는 기장·신고서 작성·급여 업무는 제외하고,
**사무소 운영 그 자체**(거래처 관리, 신고기한, 업무, 지식, 미수금)를 하나의 플랫폼으로 통합합니다.

---

## 핵심 기능

| 모듈 | 설명 |
|------|------|
| 통합 대시보드 | 내 할 일 · 지연 업무 · 임박 기한(D-7) · 미수금 KPI |
| 거래처(CRM) | 수임정보, 상담이력 타임라인, 문서, 청구 (상세 5탭), 해지 프로세스 |
| 세무 캘린더 | 신고기한 자동 표시(주말·공휴일 순연) + 사내 일정 월 뷰 |
| 업무 관리 | 리스트/칸반, 시즌 업무 일괄 생성, 체크리스트 템플릿 |
| 자동화 엔진 | 신고기한 D-n / 매월 n일 트리거 → 업무·알림 자동 생성 (멱등) |
| 지식저장소 | 마크다운 위키, 카테고리, 전문검색, 개정 이력, 상담사례 지식화 |
| 청구·미수금 | 월 기장료 청구 자동 생성, 입금 기록, 미수금 실시간 파악 |
| 알림 센터 | 인앱 알림 피드, 유형별 필터, 읽음 처리 |
| 직원·권한 | admin / manager / staff 역할, RLS 접근 제어, 감사 로그 |

## 기술 스택

- **프론트/서버**: Next.js 15 (App Router) · TypeScript (strict) · Server Components/Actions
- **UI**: Tailwind CSS v4 · 자체 컴포넌트(shadcn 패턴) · lucide-react 아이콘 · 라이트/다크 모드
- **백엔드**: Supabase (Postgres + Auth + RLS + FTS) · `@supabase/ssr` 쿠키 세션
- **검증**: zod · Vitest(단위) · SQL 기반 RLS 매트릭스
- **배포**: Vercel (Cron Jobs로 자동화 스케줄러)

---

## 로컬 실행

### 1. 사전 준비
- Node.js 20+ , npm
- Supabase 프로젝트 (아래 3번 참고) 또는 `supabase` CLI 로컬 스택

### 2. 설치 및 환경변수
```bash
npm install
cp .env.example .env.local
# .env.local 을 실제 Supabase 값으로 채웁니다.
```

`.env.local` 항목:
```
NEXT_PUBLIC_SUPABASE_URL=...        # Supabase > Project Settings > API
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # anon public key
SUPABASE_SERVICE_ROLE_KEY=...       # service_role key (서버 전용, 절대 노출 금지)
CRON_SECRET=...                     # 임의의 긴 랜덤 문자열
```

### 3. 개발 서버
```bash
npm run dev        # http://localhost:3000
```

### 품질 게이트
```bash
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run test       # Vitest 단위 테스트 (deadlines/automation/validations)
npm run build      # 프로덕션 빌드
```

> Supabase 환경변수가 없어도 `build` 는 깨지지 않습니다(클라이언트 생성은 요청 시점 lazy).
> 다만 실제 로그인·데이터 조회에는 유효한 값이 필요합니다.

---

## Supabase 프로젝트 생성 → 마이그레이션 적용

### A. 프로젝트 생성
1. https://supabase.com 에서 새 프로젝트 생성
2. Project Settings > API 에서 `URL`, `anon key`, `service_role key` 복사 → `.env.local`

### B. 마이그레이션 적용
마이그레이션 파일은 `supabase/migrations/` 에 순서대로 있습니다.

**방법 1 — Supabase SQL Editor (가장 간단)**
아래 순서로 각 파일 내용을 붙여넣고 실행합니다.
1. `supabase/migrations/0001_schema.sql`  — 전 테이블 + 인덱스 + FTS
2. `supabase/migrations/0002_rls.sql`      — RLS 헬퍼 함수 + 정책
3. `supabase/migrations/0003_seed_rules.sql` — 신고기한 규칙 + 2026 공휴일 + org 부트스트랩
4. (선택) `supabase/seed.sql` — 데모 거래처·업무·KB 등

**방법 2 — Supabase CLI**
```bash
npm i -g supabase
supabase link --project-ref <your-ref>
supabase db push          # migrations 적용
psql "$DATABASE_URL" -f supabase/seed.sql   # 데모 데이터(선택)
```

### C. 데모 계정 (seed.sql 적용 시)
| 이메일 | 비밀번호 | 역할 |
|--------|----------|------|
| admin@taxdesk.kr | taxdesk1234 | 대표(admin) |
| manager@taxdesk.kr | taxdesk1234 | 실장(manager) |
| staff@taxdesk.kr | taxdesk1234 | 직원(staff) |

> 신규 가입(`/signup`)은 사무소를 새로 개설하며, DB 트리거가 org·admin 프로필과
> 기본 업무 템플릿·자동화 규칙을 자동 생성합니다.

### D. RLS 검증(선택)
```bash
psql "$DATABASE_URL" -f tests/rls/rls_matrix.sql
```

---

## Vercel 배포

1. GitHub 저장소를 Vercel 에 연결 (Import Project)
2. **Environment Variables** 에 아래 4개 등록
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Production, 서버 전용)
   - `CRON_SECRET`
3. Deploy — `vercel.json` 의 Cron 설정으로 자동화가 매일 실행됩니다.
   ```json
   { "crons": [{ "path": "/api/cron/automation", "schedule": "10 15 * * *" }] }
   ```
   `10 15 * * *` (UTC) = **매일 00:10 KST**. Vercel Cron 은 `Authorization: Bearer $CRON_SECRET`
   헤더로 호출하며, 핸들러가 이를 검증합니다.

### 자동화 수동 실행(테스트)
```bash
curl -X POST https://<배포주소>/api/cron/automation \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## 디렉터리 구조

```
supabase/
  migrations/   0001_schema · 0002_rls · 0003_seed_rules
  seed.sql      데모 데이터
src/
  app/
    (auth)/     login · signup
    (app)/      dashboard · clients[/id] · calendar · tasks · knowledge[/id]
                billing · automation · notifications · settings
    api/cron/automation/route.ts
  components/   ui/ · 도메인별(clients/tasks/kb/billing/...)
  lib/
    supabase/   client · server · admin · middleware
    deadlines.ts   기한 계산(주말·공휴일 순연)
    automation.ts  자동화 트리거 평가·태스크 생성(멱등)
    validations/   zod 스키마
    actions/       서버 액션(zod + audit_logs)
tests/
  unit/         deadlines · automation · validations (Vitest)
  rls/          rls_matrix.sql
```

## 라이선스

내부 프로젝트 예시. 자유롭게 참고하세요.
