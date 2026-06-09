# LinguaNight Content Repository

앱스토어 업데이트 없이 새 표현을 추가하는 OTA 콘텐츠 저장소.

## 구조

```
content/
├── manifest.json              ← 앱이 매번 확인하는 버전 파일
└── updates/
    ├── EXAMPLE_FORMAT.json    ← 포맷 예시 (실제 사용 X)
    └── YYYYMMDD.json          ← 실제 새 문장 파일
```

## 새 문장 추가 방법

1. `content/updates/YYYYMMDD.json` 파일 생성 (날짜로 이름)
2. 아래 포맷으로 새 문장 배열 작성
3. `content/manifest.json`의 `version`과 `deltaFiles` 업데이트
4. `git push` → 사용자 앱이 다음 실행 시 자동 다운로드

## manifest.json 업데이트 예시

```json
{
  "version": "20260615",
  "updatedAt": "2026-06-15T00:00:00Z",
  "totalCount": 50,
  "deltaFiles": ["updates/20260615.json"],
  "changelog": "Added 20 new romance phrases",
  "changelogKo": "로맨스 표현 20개 추가"
}
```

## 문장 포맷 (Word 인터페이스)

```json
[
  {
    "id": "ota_en_romance_001",      // 고유 ID (ota_ 접두사 필수)
    "lang": "en",                    // en, ja, zh, es, fr, de, it, th
    "type": "word",
    "category": "romance",           // 기존 카테고리명과 일치해야 함
    "tone": "flirty",
    "text": "영어 문장",
    "meaning": "한국어 뜻",
    "pronunciation": "한글 발음",
    "pronunciation_en": "영문 발음기호",
    "pronunciation_ko": "한글 발음 (상세)",
    "example": "예문",
    "exampleMeaning": "예문 한국어",
    "nuance": "사용 상황 설명",
    "word_breakdown": [
      {"word": "단어", "meaning": "뜻"}
    ]
  }
]
```

## 카테고리 목록

| 카테고리 | 설명 |
|---------|------|
| `romance` | 로맨스/데이팅 |
| `hotel` | 호텔/숙박 |
| `airport` | 공항/입국 |
| `dining` | 식당/다이닝 |
| `shopping` | 쇼핑 |
| `directions` | 길찾기 |
| `emergency` | 응급상황 |
| `nightlife` | 유흥/밤문화 |

## 주의사항

- `id`는 전 세계 고유해야 함 → `ota_{lang}_{category}_{번호}` 형식 권장
- `lang`은 `en, ja, zh, es, fr, de, it, th` 중 하나
- 기존 ID와 중복되면 INSERT OR IGNORE로 건너뜀 (안전)
- 파일은 GitHub Public Repo에 올려야 앱에서 접근 가능
