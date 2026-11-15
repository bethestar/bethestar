# gov-support-mcp

정부지원사업·보조금 정보를 공식 공공 API로 조회하는 MCP 커넥터예요. Claude Code·Claude Desktop 등 MCP 클라이언트에서 쓸 수 있고, CLI로도 쓸 수 있어요.

| 소스 | 제공 기관 | 내용 | 필요한 키 |
|---|---|---|---|
| 기업마당 | 중소벤처기업부 | 중소기업·소상공인 지원사업 공고 | `BIZINFO_API_KEY` |
| K-Startup | 창업진흥원 | 창업지원사업 공고 | `DATA_GO_KR_API_KEY` |
| 보조금24 | 행정안전부 | 중앙부처·지자체·공공기관 혜택 | `DATA_GO_KR_API_KEY` |

## 1. API 키 발급

1. **공공데이터포털 키 (`DATA_GO_KR_API_KEY`)**: [data.go.kr](https://www.data.go.kr)에 가입한 뒤 아래 두 데이터셋에 **활용신청**을 해요. 키 하나로 둘 다 쓸 수 있어요.
   - [창업진흥원_K-Startup 조회서비스 (15125364)](https://www.data.go.kr/data/15125364/openapi.do)
   - [행정안전부_대한민국 공공서비스(혜택) 정보 (15113968)](https://www.data.go.kr/data/15113968/openapi.do) (자동승인)
   - 데이터셋마다 **따로** 활용신청해야 해요. 키는 같아도 신청하지 않은 데이터셋은 "등록되지 않은 인증키 입니다"(보조금24) 같은 오류가 나요. 승인 직후에는 반영까지 시간이 걸릴 수 있어요.
   - 마이페이지에서 "일반 인증키(Decoding)"를 복사해요. Encoding 키를 넣어도 자동으로 처리돼요.
2. **기업마당 키 (`BIZINFO_API_KEY`)**: 공공데이터포털 키와는 다른 별도의 키(crtfcKey)예요.
   - 기업마당에 회원가입하고 로그인한 뒤 **활용정보 → 정책정보 개방**에서 [지원사업정보 API](https://www.bizinfo.go.kr/apiDetail.do?id=bizinfoApi)의 **사용신청**을 눌러요. ([API 목록](https://www.bizinfo.go.kr/apiList.do))
   - 신청서에 기관·기업명, 담당자, 연락처, 시스템명, 시스템 IP/URL 등을 적어요. 승인 후 인증키를 받아요. 마이페이지에서 받는다는 자료와 이메일로 받는다는 자료가 있어요 (확실하지 않음).
   - 키 분실 등 문의: 기업마당 02-867-9765 (공식 상세 페이지에 적혀 있다고 검색 결과에 나옴, 직접 확인 못 함)

키가 없는 소스는 건너뛰고, 나머지 결과만 반환해요.

## 2. 설치

```bash
cd connectors/gov-support-mcp
npm install
npm test          # 가짜 응답으로 하는 단위 테스트 23개 (네트워크 불필요)
```

### Windows (PowerShell)

- `npm install`에서 "스크립트를 실행할 수 없으므로 npm.ps1 파일을 로드할 수 없습니다" 오류가 나면 PowerShell 실행 정책 때문이에요. 둘 중 하나로 해결해요.
  - `npm` 대신 `npm.cmd install`로 실행해요.
  - 또는 한 번만 실행해요: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
- 환경변수는 `export` 대신 이렇게 넣어요. 그 PowerShell 창에서만 유지돼요.
  ```powershell
  $env:DATA_GO_KR_API_KEY="..."
  $env:BIZINFO_API_KEY="..."
  node src/cli.mjs all --text
  ```
- 경로 구분자는 `\`를 써요 (`cd connectors\gov-support-mcp`).

## 3. 연결

**Claude Code**: 레포 루트의 `.mcp.json`에 이미 등록되어 있어요. 셸에서 키를 내보낸 뒤 Claude Code를 실행하면 돼요.

```bash
export DATA_GO_KR_API_KEY="..."
export BIZINFO_API_KEY="..."
claude   # /mcp 에서 gov-support 연결 확인
```

**Claude Desktop** (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "gov-support": {
      "command": "node",
      "args": ["/절대경로/bethestar/connectors/gov-support-mcp/src/server.mjs"],
      "env": { "DATA_GO_KR_API_KEY": "...", "BIZINFO_API_KEY": "..." }
    }
  }
}
```

## 4. 도구

| 도구 | 설명 |
|---|---|
| `search_support_programs` | 세 소스 통합 검색. 마감 임박순으로 정렬하고 소스별 성공·실패를 함께 반환 |
| `search_bizinfo` | 기업마당 공고 (분야·지역·해시태그) |
| `search_kstartup` | K-Startup 공고 (지역·신청대상·업력·분야, 기본은 모집중만) |
| `search_gov24_benefits` | 보조금24 혜택 (서비스명·사용자구분·분야·소관기관) |
| `get_gov24_benefit_detail` | 보조금24 상세 (지원내용·신청방법·구비서류) |

모든 결과는 같은 형식이에요: `source, id, title, summary, organization, target, region, applyStart, applyEnd, applyPeriodText, status(open/upcoming/closed/always/unknown), url`.

## 5. CLI

```bash
node src/cli.mjs all --keyword 세무 --region 서울 --text
node src/cli.mjs kstartup --target 예비창업자 --limit 5
node src/cli.mjs gov24-detail 000000465790
```

## 6. 택스허브 사이트 (`/support`)

`src/lib/govSupport.ts`가 이 커넥터 코드를 그대로 가져다 쓰고, `src/app/support/page.tsx`가 화면을 그려요.

- API 키는 서버에서만 읽어요. 레포 루트 `.env.local`이나 배포 환경변수에 `DATA_GO_KR_API_KEY`, `BIZINFO_API_KEY`를 넣으면 돼요.
- 키가 없는 출처는 "키 미설정"으로 표시돼요. 키가 하나도 없으면 각 포털 링크를 대신 보여 줘요.
- 같은 요청의 API 응답은 Next.js 데이터 캐시에 1시간 동안 보관돼요.

## 7. 스킬

`.claude/skills/gov-support-search/SKILL.md`는 이 커넥터로 조건 확인 → 조회 → 정리 → 공식 공고 확인 안내 순서로 답하도록 Claude에게 알려 주는 스킬이에요.

## ⚠️ 검증 상태와 한계

| 소스 | 실제 호출 확인 (2026-11) | 비고 |
|---|---|---|
| 기업마당 | ✅ 확인 | JSON 응답, 필드명 일치. 잘못된 키는 HTTP 200 + `reqErr`로 와요. |
| K-Startup | ✅ 확인 | 필드명 일치. 응답의 `id`는 행 번호라서 공고 ID는 `pbanc_sn`을 써요. |
| 보조금24 | ⏳ 미확인 | 활용신청 전이라 "등록되지 않은 인증키"(code -4) 응답만 확인했어요. 신청 후 다시 확인이 필요해요. |

- **기업마당은 국내 IP에서 호출해야 해요.** 해외 클라우드에서는 연결이 끊겼어요. 해외 IP 차단으로 보이지만 확실하지 않아요. 사이트를 배포할 때는 서울 리전을 권해요.
- 엔드포인트·파라미터는 공개된 제3자 구현([NomaDamas/k-skill](https://github.com/NomaDamas/k-skill), [djfksjd/sole-search](https://github.com/djfksjd/sole-search))과 사용 예시를 참고했어요. 필드명이 바뀌면 여러 후보 키를 순서대로 시도하고, 그래도 없으면 응답 키 목록과 함께 오류를 내요.
- 기업마당은 XML(RSS)만 온다는 보고도 있어서, JSON이 아니면 XML의 `<item>`을 읽도록 대비해 두었어요. 결과의 `format` 필드(`json`/`xml`)로 실제 형식을 확인할 수 있어요.
- K-Startup의 지역·대상·업력 필터는 서버가 무시하는 사례가 보고되어 있어서 클라이언트에서 한 번 더 걸러요.
- 보조금24의 `cond[필드::LIKE]` 서버 필터는 아직 확인하지 못했어요.
- 목록 데이터만으로는 지원 자격을 확정할 수 없어요. 반드시 공식 공고문을 확인해야 해요.
- 각 API의 이용약관과 호출 한도(K-Startup 개발계정은 일 10,000건으로 알려져 있음, 미검증)를 지켜 주세요.
