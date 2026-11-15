---
name: gov-support-search
description: 정부지원사업·보조금·창업지원 공고를 기업마당·K-Startup·보조금24 공식 API로 조회하고, 사용자(개인·소상공인·창업자·기업) 조건에 맞는 후보를 마감일·공식 링크와 함께 정리한다. "지원사업 찾아줘", "받을 수 있는 보조금", "창업지원금", "예비창업패키지 공고", "소상공인 지원금", "정부지원금 조회" 같은 요청에 사용.
---

# 정부지원사업·보조금 조회

택스허브의 `gov-support` MCP 커넥터(`connectors/gov-support-mcp`)로 공식 공공 API를 조회한다. 조회만 하며, 신청을 대신하지 않는다.

## 데이터 소스

| 소스 | 내용 | 키 (환경변수) |
|---|---|---|
| 기업마당 `bizinfo` | 중기부 통합 중소기업 지원사업 공고 (금융·기술·인력·수출·내수·창업·경영) | `BIZINFO_API_KEY` (기업마당 발급) |
| K-Startup `kstartup` | 창업진흥원 창업지원사업 공고 (예비·초기·도약패키지 등) | `DATA_GO_KR_API_KEY` (data.go.kr 15125364) |
| 보조금24 `gov24` | 중앙부처·지자체·공공기관의 상시 혜택 (보조금·바우처·감면) | `DATA_GO_KR_API_KEY` (data.go.kr 15113968) |

## 절차

1. **조건 파악.** 아래 중 질문에 없는 것만 짧게 묻는다. 이미 알 수 있으면 묻지 않는다.
   - 대상 유형: 개인 / 예비창업자 / 창업 n년차 / 소상공인 / 중소기업
   - 지역(시·도), 필요한 지원(자금·R&D·교육·공간·고용·수출 등), 업종·키워드
2. **조회.** 처음에는 `search_support_programs`(통합 검색)를 쓴다. 조건이 분명하면 개별 도구를 쓴다.
   - 창업 단계(예비·업력)가 핵심이면 `search_kstartup`에 `target`·`businessAge`를 넣는다.
   - 소상공인·중소기업 운영 지원이면 `search_bizinfo`에 `category`를 넣는다.
   - 개인·가구 혜택이나 상시 보조금이면 `search_gov24_benefits`를 쓰고, 유력 후보는 `get_gov24_benefit_detail`로 상세를 확인한다.
   - 결과가 0건이면 키워드를 줄이거나(한 단어로), 지역 필터를 빼고 다시 조회한다.
3. **결과 정리.** 표나 목록으로 다음을 보여 준다.
   - 공고명, 기관, 신청기간과 상태(모집중/예정/마감/상시), 대상, **공식 링크(url)**
   - 마감 임박순으로 정렬한다. 7일 이내 마감은 표시한다.
   - 응답의 `today`(KST) 기준으로 마감 여부를 판단한다.
4. **누락 고지.** 응답의 `complete`가 `false`이면 실패한 소스(`sources[*].error`)를 알리고, 해당 포털에서 직접 확인하라고 안내한다. 키가 없어서 실패했다면 발급 방법을 안내한다.

## 반드시 지킬 것

- **자격을 단정하지 않는다.** 목록 데이터만으로는 업력·지역·중복수혜·제외 조건을 알 수 없다. "가능성이 있는 후보"로 표현하고 공식 공고문 확인을 권한다.
- **링크를 지어내지 않는다.** API가 준 `url`만 쓴다.
- 금액·자격 등 응답에 없는 내용을 추측하지 않는다. 불확실하면 불확실하다고 말한다.
- 세무 신고 대리나 개별 세무 판단은 하지 않는다. 필요하면 세무사 상담을 권한다.

## MCP를 쓸 수 없을 때 (CLI 대체)

```bash
cd connectors/gov-support-mcp && npm install   # 최초 1회
node src/cli.mjs all --keyword "세무" --region 서울 --text
node src/cli.mjs kstartup --target 예비창업자 --business-age 예비창업자 --limit 10
node src/cli.mjs bizinfo --category 창업 --region 경기
node src/cli.mjs gov24 --keyword 소상공인 --user-type 소상공인
node src/cli.mjs gov24-detail <서비스ID>
```

종료 코드: 0 = 성공, 1 = 오류, 2 = 일부 소스 실패(부분 결과).
