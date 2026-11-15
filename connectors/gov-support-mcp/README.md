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
npm test          # 가짜 응답으로 하는 단위 테스트 18개 (네트워크 불필요)
```

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

- 이 커넥터는 **실제 API에 호출해서 검증하지 못했어요.** 개발 환경에서 정부 API 서버에 접속할 수 없었기 때문이에요. 단위 테스트는 가짜 응답으로만 돌렸어요. 키를 발급받은 뒤 `node src/cli.mjs all --text`로 먼저 확인해 주세요.
- 엔드포인트·파라미터·필드명의 근거는 다음과 같아요.
  - K-Startup·보조금24: 공개된 제3자 구현([NomaDamas/k-skill](https://github.com/NomaDamas/k-skill), [djfksjd/sole-search](https://github.com/djfksjd/sole-search))을 참고했어요.
  - 기업마당: 공개된 사용 예시를 바탕으로 작성했어요. 공식 명세서와 대조하지 못해서 **특히 불확실해요.**
  - 필드명이 다르면 여러 후보 키를 순서대로 시도하고, 그래도 없으면 응답 키 목록과 함께 오류를 내요.
- 기업마당은 `dataType=json`을 요청해도 XML만 온다는 보고가 있어요 (공식 페이지는 JSON 지원이라고 설명함). 그래서 JSON을 먼저 읽고, 아니면 XML(RSS)의 `<item>`을 읽어요. 결과의 `format` 필드(`json`/`xml`)로 실제 형식을 확인할 수 있어요. JSON 목록이 어느 키 아래에 있는지 확인되지 않아서 `jsonArray`·`items`·`data` 등 여러 형태를 허용해요.
- K-Startup의 지역·대상·업력 필터는 서버가 무시하는 사례가 보고되어 있어서 클라이언트에서 한 번 더 걸러요.
- 보조금24의 `cond[필드::LIKE]` 필터가 모든 필드에서 동작하는지는 확인하지 못했어요.
- 목록 데이터만으로는 지원 자격을 확정할 수 없어요. 반드시 공식 공고문을 확인해야 해요.
- 각 API의 이용약관과 호출 한도(K-Startup 개발계정은 일 10,000건으로 알려져 있음, 미검증)를 지켜 주세요.
