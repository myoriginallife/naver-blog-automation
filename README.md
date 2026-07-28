# 네이버 블로그 자동화 (경제 · 부동산 · 투자 · 사업)

키워드 리서치 → SEO 초안 작성 → 차트 이미지 생성까지 자동화하는 CLI 도구입니다.
**네이버 로그인이나 자동 게시는 하지 않습니다.** 결과물은 파일(`post.md`, `meta.json`, 이미지)로
생성되며, 사실관계와 문장을 직접 검수한 뒤 네이버 블로그 편집기에 붙여넣어 비공개로 저장하는
것까지가 사람의 몫입니다.

## 왜 로그인 자동화가 없나요

네이버는 블로그 글쓰기용 범용 오픈API가 없고, 브라우저 자동화로 로그인/저장까지 처리하면
계정 보안 정책(이상 로그인 탐지, 캡차)에 걸리기 쉽고 약관 위반 소지도 있습니다. 그래서 이 도구는
"검수 후 업로드"라는 원래 계획에 맞춰 콘텐츠 준비까지만 자동화합니다.

## 워크플로우

```
1. keywords  : 시드 키워드 -> 네이버 검색광고 API로 연관 키워드 + 검색량 + 경쟁도 조회
               -> (선택) 블로그 문서수로 포화도 확인 -> 기회점수로 정렬
2. draft     : 고른 키워드로 Claude API가 제목/메타설명/태그/본문 초안 생성
3. chart     : 사용자가 입력한 실제 데이터로 차트 PNG 생성 (AI가 통계를 지어내지 않음)
4. (수동)     post.md 검수 -> 네이버 블로그 편집기에 붙여넣기 -> 태그/이미지 삽입 -> "저장(비공개)"
```

## 사전 준비물 (API 키 3종)

| 키 | 용도 | 발급처 |
|---|---|---|
| `ANTHROPIC_API_KEY` | 글 생성 | https://console.anthropic.com |
| `NAVER_AD_API_KEY` / `NAVER_AD_SECRET_KEY` / `NAVER_AD_CUSTOMER_ID` | 키워드 검색량/경쟁도 | https://searchad.naver.com 광고주 가입 → **도구 > API 사용 관리**에서 API 라이선스/SECRET KEY 발급, CUSTOMER ID는 계정 정보에서 확인 |
| `NAVER_OPENAPI_CLIENT_ID` / `NAVER_OPENAPI_CLIENT_SECRET` (선택) | 블로그 문서수로 키워드 경쟁(포화) 확인 | https://developers.naver.com/apps 애플리케이션 등록 → 검색 API 사용 설정 |

네이버 검색광고 API 키가 없으면 `keywords`/`pipeline` 명령을 쓸 수 없습니다. 오픈API 키는
선택 사항이며, 없으면 문서수 컬럼 없이 검색량/경쟁도만으로 점수를 계산합니다.

## 설치

```bash
npm install
cp .env.example .env
# .env 파일을 열어 위 표의 키 값을 채워넣으세요.
```

Node.js 18 이상이 필요합니다.

### 차트 생성 관련 참고 (node-canvas 네이티브 의존성)

`npm install` 시 플랫폼에 맞는 사전 빌드된 바이너리가 자동으로 받아지는 경우가 대부분입니다.
만약 `pangocairo`, `pkg-config` 관련 오류가 나면 시스템에 다음 라이브러리를 설치하세요.

- **Ubuntu/Debian**: `sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev`
- **macOS (Homebrew)**: `brew install pkg-config cairo pango libpng jpeg giflib librsvg`
- **Windows**: 네이티브 빌드가 까다로울 수 있습니다. WSL(우분투) 사용을 권장합니다.

## 사용법

### 1) 키워드 리서치

```bash
npm run keywords -- --category real-estate
# 또는 직접 시드 키워드 지정
npm run keywords -- --category investment --seed "미국 국채,금 투자" --top 20
```

`--category`는 `economy`(경제) · `real-estate`(부동산) · `investment`(투자) · `business`(사업)
중 하나입니다. 카테고리별 기본 시드는 `src/keywords/seeds.ts`에서 자유롭게 수정할 수 있습니다.
결과는 콘솔 표로 출력되고, 전체 데이터는 `output/keywords/`에 JSON으로 저장됩니다.

**기회점수**는 (월간 검색량) x (광고 경쟁도가 낮을수록 유리) x (블로그 문서수가 적을수록 유리)로
계산한 상대 지표입니다. 실제 애드포스트 단가는 키워드마다 다르며 이 점수에는 반영되지 않으니
참고용으로만 쓰세요.

### 2) 글 초안 생성

```bash
npm run draft -- --keyword "전세자금대출 조건" --category real-estate \
  --related "버팀목전세자금,전세대출 한도"
```

`output/posts/<날짜_키워드>/post.md`, `meta.json`이 생성됩니다. 본문에 확인되지 않은 수치는
"공식 자료에서 확인하세요"처럼 자리표시 문구로 남기도록 프롬프트에 명시해뒀지만, **금리·세율·법령
등은 발행 전 반드시 사람이 최신 정보로 직접 확인/수정**하세요.

### 3) 차트 이미지 생성

```bash
npm run chart -- --slug 2026-07-27_전세자금대출-조건 \
  --data examples/chart-data.example.json --out chart-1.png
```

`--data`로 넘기는 JSON은 직접 작성해야 합니다 (`examples/chart-data.example.json` 참고).
**AI가 경제/투자 통계를 임의로 만들어 그래프로 보여주는 것을 막기 위해 일부러 수동 입력만
지원합니다.** 결과 PNG는 `output/posts/<slug>/images/`에 저장됩니다.

```json
{
  "type": "bar",
  "title": "차트 제목",
  "labels": ["1월", "2월", "3월"],
  "datasets": [{ "label": "계열명", "data": [10, 20, 15] }],
  "sourceNote": "출처: 한국은행 (2026.06 기준)"
}
```

`type`은 `bar` / `line` / `pie` / `doughnut` 중 선택.

### 4) 한 번에 (리서치 + 초안)

```bash
npm run pipeline -- --category business --seed "정부 창업지원금"
```

기회점수 1위 키워드로 바로 초안까지 생성합니다. 차트는 실제 데이터가 필요하므로 파이프라인에
포함하지 않았습니다 — 필요하면 3번 명령을 별도로 실행하세요.

## 네이버 블로그에 올리기 (수동)

1. `output/posts/<slug>/post.md`를 열어 사실관계, 어색한 표현, 개인 의견/경험을 보강합니다.
2. 네이버 블로그 글쓰기 화면에서 제목과 본문을 붙여넣습니다. `##` 소제목은 마크다운이 자동
   변환되지 않으므로 편집기에서 서식(소제목 스타일)을 다시 지정해야 합니다.
3. `images/` 폴더의 차트를 본문 적절한 위치에 삽입합니다.
4. `meta.json`의 `tags`를 참고해 태그를 입력합니다.
5. **"발행"이 아니라 "저장"(임시저장/비공개)**을 선택해 검수용으로만 남깁니다. 최종 발행은
   직접 확인 후 사람이 누릅니다.

## 애드포스트 · 검색 정책 관련 주의사항

- 자동 생성 티가 나거나 타 사이트와 유사도가 높은 글은 애드포스트 심사 거절/이용 정지, 검색
  누락(저품질 판정) 사유가 될 수 있습니다. 초안을 그대로 쓰지 말고 문체를 다듬고 실제 경험/의견을
  더하세요.
- 투자 관련 글은 특정 상품 매수/매도를 권유하는 것으로 오인되지 않게 "투자 조언이 아니다"라는
  문구를 유지하세요 (프롬프트에 기본 포함되어 있습니다).
- 확인되지 않은 금리·세율·법령·통계는 절대 확정적으로 서술하지 말고, 반드시 공식 출처
  (한국은행, 국토교통부, 국세청, 금융감독원 등)를 직접 확인 후 반영하세요.
- 같은 키워드/유사 주제를 하루에 대량 발행하면 저품질로 분류될 위험이 있습니다. 카테고리와
  발행 간격을 적절히 분산하세요.

## 프로젝트 구조

```
src/
  cli.ts                 CLI 진입점 (keywords/draft/chart/pipeline)
  config.ts               환경변수 로딩
  types.ts                 공용 타입
  naver/
    signature.ts            검색광고 API HMAC 서명
    keywordTool.ts           키워드 도구(연관검색어/검색량/경쟁도) 클라이언트
    blogSearch.ts            블로그 문서수(선택, 경쟁도 보강) 클라이언트
  keywords/
    seeds.ts                 카테고리별 기본 시드 키워드
    score.ts                  기회점수 계산
    research.ts                리서치 오케스트레이션
  content/
    prompts.ts                시스템/유저 프롬프트
    generate.ts                 Claude API 호출 (tool-use로 구조화된 결과 강제)
  charts/
    types.ts                    차트 데이터 스펙
    generate.ts                   chart.js + node-canvas로 PNG 렌더링
  output/
    writer.ts                     결과 파일 저장 (output/keywords, output/posts)
examples/
  chart-data.example.json       차트 데이터 입력 예시
```

## 한계 / 향후 개선 아이디어

- 사진: 이 도구는 데이터 차트만 자동 생성합니다. 인물/현장 사진은 저작권 문제로 직접 촬영하거나
  구매한 이미지를 쓰는 것을 권장합니다.
- 실행은 수동 CLI 명령 기반입니다. 정기 자동 실행(예: GitHub Actions 스케줄)이 필요하면
  `npm run pipeline`을 크론으로 감싸되, 산출물 검수 단계는 여전히 사람이 해야 합니다.
- 키워드 기회점수는 상대적 지표이며 실제 애드포스트 CPC/RPM 데이터를 반영하지 않습니다. 데이터가
  쌓이면 카테고리별 가중치를 조정하세요.
