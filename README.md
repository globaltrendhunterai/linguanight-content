# LinguaNight Content Repository

앱스토어 업데이트 없이 새 표현을 추가하는 OTA 콘텐츠 저장소.

---

## 에이전트(Antigravity/Jarvis)에게 보내는 지시 예시

```
"LinguaNight Romance 카테고리에 새 표현 3개 추가해줘"
"Nightlife 카테고리 새 표현 5개 10개 언어로 동시에 추가해줘"
"이 표현들 앱에 추가해줘: [직접 목록]"
```

---

## 에이전트가 반드시 지켜야 할 규칙

### ✅ 1. 10개 언어 전부 동시에 생성

지원 언어: `en`, `ja`, `zh`, `es`, `fr`, `de`, `it`, `th`, `ko`, `lo`

하나의 개념당 **10개 항목**을 배열에 넣는다.
5개 표현 추가 → 배열에 **50개 항목** (5 × 10개 언어)

### ✅ 2. 모든 필드를 완전히 채울 것

| 필드 | 설명 | 예시 |
|------|------|------|
| `id` | 고유 ID (`ota_{lang}_{category}_{날짜}_{seq}`) | `ota_en_romance_20260610_001` |
| `lang` | 언어 코드 | `en` |
| `type` | 항상 `"word"` | `"word"` |
| `category` | 카테고리명 (아래 목록) | `"Romance"` |
| `tone` | 어조 | `"Flirty"`, `"Formal"`, `"Casual"` |
| `text` | 해당 언어 표현 | `"You make my heart skip a beat."` |
| `meaning` | 한국어 뜻 | `"당신 때문에 심장이 두근거려요."` |
| `pronunciation` | **한글 독음** (모든 언어) | `"유 메이크 마이 하트 스킵 어 비트"` |
| `pronunciation_en` | 영문 발음기호/로마자 | `"you make my heart skip a beat"` |
| `pronunciation_ko` | 한글 독음 (pronunciation과 동일) | `"유 메이크 마이 하트 스킵 어 비트"` |
| `example` | 실제 예문 (해당 언어) | `"Every time I see you, you make my heart skip a beat."` |
| `exampleMeaning` | 예문의 한국어 번역 | `"당신을 볼 때마다 심장이 두근거려요."` |
| `literal_meaning` | 직역 | `"당신은 내 심장이 한 박자를 건너뛰게 해요"` |
| `nuance` | **뉘앙스/상황/문화 설명** (한국어) | `"설레는 감정을 시적으로 표현. 첫 데이트나 고백 상황에 적합."` |
| `word_breakdown` | **단어별 끊어보기** (배열) | `[{"word": "skip a beat", "meaning": "심장이 한 박자 건너뜀"}]` |

### ✅ 3. word_breakdown 작성 기준

- 단순 단어 나열이 아닌 **의미 단위**로 끊기
- 관용구/숙어는 묶어서 처리
- 최소 3개 이상의 청크
- 조사, 접속사도 포함

```json
"word_breakdown": [
  {"word": "You make",        "meaning": "당신이 ~하게 만들다"},
  {"word": "my heart",        "meaning": "내 심장을"},
  {"word": "skip a beat",     "meaning": "한 박자 건너뛰다 (설레다)"}
]
```

### ✅ 4. 언어별 독음(pronunciation) 작성 기준

| 언어 | pronunciation 예시 |
|------|-------------------|
| `en` | `유 메이크 마이 하트 스킵 어 비트` |
| `ja` | `아나타와 와타시노 코코로오 도키도키 사세루` |
| `zh` | `니 랑 워 더 신 티아오 쟈 수` |
| `es` | `투 아세스 케 미 코라손 라테 라피도` |
| `fr` | `뚜 페 바트르 몽 꾀르 플뤼 비트` |
| `de` | `두 마흐스트 마인 헤르츠 슈넬러 슐라겐` |
| `it` | `파이 바테레 일 미오 쿠오레 피우 포르테` |
| `th` | `쿤 탐 하이 후아짜이 콩 찬 텐` |
| `ko` | (pronunciation 불필요, 텍스트 자체가 한국어) |
| `lo` | `타오 탐 하이 후아짜이 콩 카오이 텐` |

### ✅ 5. ID 작명 규칙

```
ota_{lang}_{category소문자}_{YYYYMMDD}_{3자리번호}

예시:
  ota_en_romance_20260610_001
  ota_ja_romance_20260610_001
  ota_zh_romance_20260610_001
  ota_en_nightlife_20260610_001
```

---

## 실제 추가 방법 (에이전트 실행 순서)

### 1. JSON 파일 생성 (에이전트가 직접 작성)

`/content/updates/YYYYMMDD.json` — 10개 언어 × N개 표현 = N×10개 항목

### 2. 스크립트 실행

```bash
node /Volumes/Mac_SSD/Projects/jarvis_project/linguanight-content/add_phrases.js \
  --date "20260610" \
  --changelog "로맨스 표현 3개 (10개 언어) 추가" \
  --file "/path/to/generated_phrases.json"
```

스크립트가 자동으로:
- 필수 필드 검증
- 언어 커버리지 확인
- ID 중복 체크
- manifest.json 버전 업데이트
- git commit + push

### 3. 완료

사용자 앱이 다음 실행 시 자동 다운로드 (최대 6시간 내)

---

## 카테고리 목록

| 카테고리 | 설명 |
|---------|------|
| `Romance` | 로맨스/데이팅 |
| `Nightlife` | 야간 유흥/밤문화 |
| `Social` | 일상 소셜 대화 |
| `Dining` | 식당/음식 주문 |
| `Shopping` | 쇼핑/구매 |
| `Travel` | 여행 일반 |
| `Transportation` | 교통/이동 |
| `Airport - Arrivals` | 공항 입국 |
| `Airport - Departures` | 공항 출국 |
| `Hotel & Accommodation` | 숙박 |
| `Directions` | 길 안내 |
| `Emergencies` | 응급 상황 |
| `Health` | 건강/병원 |
| `Survival & Basics` | 생존 기초 표현 |
| `Public Transport` | 대중교통 |

---

## 완성 항목 예시 (en 하나)

```json
{
  "id": "ota_en_romance_20260610_001",
  "lang": "en",
  "type": "word",
  "category": "Romance",
  "tone": "Flirty",
  "text": "You make my heart skip a beat.",
  "meaning": "당신 때문에 심장이 두근거려요.",
  "pronunciation": "유 메이크 마이 하트 스킵 어 비트",
  "pronunciation_en": "you make my heart skip a beat",
  "pronunciation_ko": "유 메이크 마이 하트 스킵 어 비트",
  "example": "Every time I see you, you make my heart skip a beat.",
  "exampleMeaning": "당신을 볼 때마다 심장이 두근거려요.",
  "literal_meaning": "당신은 내 심장이 한 박자를 건너뛰게 해요.",
  "nuance": "설레는 감정을 시적으로 표현하는 낭만적인 문장. 처음 만남이나 고백 직전 상황에서 자연스럽게 사용할 수 있으며, 너무 직접적이지 않아 부담이 없다.",
  "word_breakdown": [
    {"word": "You make",        "meaning": "당신이 ~하게 만들다"},
    {"word": "my heart",        "meaning": "내 심장을"},
    {"word": "skip",            "meaning": "건너뛰다"},
    {"word": "a beat",          "meaning": "한 박자를 (심장 박동)"}
  ]
}
```
