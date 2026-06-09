#!/usr/bin/env node
/**
 * LinguaNight OTA Content Adder — 멀티랭귀지 완전판
 *
 * Antigravity/Jarvis 에이전트가 호출하는 자동화 스크립트.
 * 반드시 지원 10개 언어 모두 동시에 추가해야 한다.
 *
 * 사용법:
 * node add_phrases.js --date "20260610" --changelog "로맨스 표현 5개 추가" --file "/path/to/phrases.json"
 * 또는
 * echo '[...]' | node add_phrases.js --date "20260610" --changelog "표현 추가" --stdin
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 에이전트(Antigravity)가 생성해야 할 JSON 구조:
 * 하나의 "개념"당 10개 언어 항목을 배열로 묶어서 전달.
 *
 * 지원 언어: en, ja, zh, es, fr, de, it, th, ko, lo
 *
 * 필수 필드:
 *   id              - 전 세계 고유 ID (형식: ota_{lang}_{category}_{YYYYMMDD}_{seq})
 *   lang            - 언어 코드 (en/ja/zh/es/fr/de/it/th/ko/lo)
 *   type            - "word" (고정)
 *   category        - 카테고리 (아래 카테고리 목록 참조)
 *   tone            - 어조 (Formal/Casual/Flirty/Romantic 등)
 *   text            - 해당 언어의 실제 표현
 *   meaning         - 한국어 뜻
 *   pronunciation   - 한글 독음 (모든 언어 공통, 한글로 표기)
 *   pronunciation_en - 영문 발음기호 또는 로마자 표기
 *   pronunciation_ko - 한글 독음 (pronunciation과 동일해도 됨)
 *   example         - 실제 사용 예문 (해당 언어로)
 *   exampleMeaning  - 예문의 한국어 번역
 *   literal_meaning - 직역 (해당 언어 원문 또는 한국어)
 *   nuance          - 사용 상황, 문화적 맥락, 뉘앙스 (한국어로)
 *   word_breakdown  - 단어별 끊어보기 배열 [{word, meaning}]
 *                     (의미 있는 단위로 분리, 조사/접속사 포함)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 카테고리 목록:
 *   Romance, Nightlife, Social, Dining, Shopping
 *   Travel, Transportation, Airport - Arrivals, Airport - Departures
 *   Hotel & Accommodation, Directions, Emergencies, Health
 *   Survival & Basics, Public Transport
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SUPPORTED_LANGS = ['en', 'ja', 'zh', 'es', 'fr', 'de', 'it', 'th', 'ko', 'lo'];
const REQUIRED_FIELDS = [
  'id', 'lang', 'type', 'category', 'text', 'meaning',
  'pronunciation', 'pronunciation_ko', 'example', 'exampleMeaning',
  'nuance', 'word_breakdown'
];

const CONTENT_DIR = path.join(__dirname, 'content');
const UPDATES_DIR = path.join(CONTENT_DIR, 'updates');
const MANIFEST    = path.join(CONTENT_DIR, 'manifest.json');

// ── CLI 인자 파싱 ──────────────────────────────────────────────────────────
const args     = process.argv.slice(2);
const get      = (f, d='') => { const i = args.indexOf(f); return i !== -1 ? args[i+1] : d; };
const DATE     = get('--date', new Date().toISOString().slice(0,10).replace(/-/g,''));
const CHANGELOG= get('--changelog', '새 표현 추가');
const FILE     = get('--file', '');
const USE_STDIN= args.includes('--stdin');
const DRY_RUN  = args.includes('--dry-run'); // 실제 push 없이 검증만

// ── 입력 JSON 로드 ─────────────────────────────────────────────────────────
let phrases = [];
if (USE_STDIN) {
  phrases = JSON.parse(fs.readFileSync('/dev/stdin', 'utf8'));
} else if (FILE) {
  phrases = JSON.parse(fs.readFileSync(FILE, 'utf8'));
} else {
  console.error('❌ --file 또는 --stdin 중 하나를 지정해야 합니다.');
  process.exit(1);
}

if (!Array.isArray(phrases) || phrases.length === 0) {
  console.error('❌ 표현 배열이 비어 있습니다.');
  process.exit(1);
}

console.log(`\n📦 LinguaNight OTA Content Adder`);
console.log(`   입력: ${phrases.length}개 항목`);
console.log(`   날짜: ${DATE}`);
console.log(`   변경: ${CHANGELOG}\n`);

// ── 1. 필수 필드 검증 ─────────────────────────────────────────────────────
console.log('🔍 필드 검증 중...');
let valid = true;
for (const w of phrases) {
  for (const f of REQUIRED_FIELDS) {
    if (!w[f]) {
      console.error(`  ❌ [${w.id || '?'}] "${f}" 필드 누락`);
      valid = false;
    }
  }
  if (!SUPPORTED_LANGS.includes(w.lang)) {
    console.error(`  ❌ [${w.id}] 지원하지 않는 언어: ${w.lang}`);
    valid = false;
  }
  if (!Array.isArray(w.word_breakdown) || w.word_breakdown.length === 0) {
    console.error(`  ❌ [${w.id}] word_breakdown 배열이 비어 있음`);
    valid = false;
  }
}
if (!valid) { console.error('\n❌ 검증 실패. 수정 후 다시 시도하세요.'); process.exit(1); }
console.log('  ✅ 모든 필드 검증 통과\n');

// ── 2. 언어 커버리지 검증 ─────────────────────────────────────────────────
console.log('🌏 언어 커버리지 확인...');
const langCounts = {};
for (const w of phrases) {
  langCounts[w.lang] = (langCounts[w.lang] || 0) + 1;
}
const missingLangs = SUPPORTED_LANGS.filter(l => !langCounts[l]);
if (missingLangs.length > 0) {
  console.warn(`  ⚠️  누락된 언어: ${missingLangs.join(', ')}`);
  console.warn('     (일부 사용자에게만 표현이 추가됩니다)\n');
} else {
  console.log('  ✅ 10개 언어 모두 포함\n');
}
for (const [lang, count] of Object.entries(langCounts)) {
  console.log(`     ${lang}: ${count}개`);
}
console.log('');

// ── 3. ID 중복 검사 ───────────────────────────────────────────────────────
console.log('🔎 ID 중복 검사...');
const existingIds = new Set();
if (fs.existsSync(UPDATES_DIR)) {
  for (const f of fs.readdirSync(UPDATES_DIR)) {
    if (!f.endsWith('.json') || f.startsWith('EXAMPLE')) continue;
    try {
      JSON.parse(fs.readFileSync(path.join(UPDATES_DIR, f), 'utf8')).forEach(w => existingIds.add(w.id));
    } catch {}
  }
}
const dupes = phrases.filter(w => existingIds.has(w.id));
if (dupes.length > 0) {
  console.error(`  ❌ 중복 ID: ${dupes.map(w => w.id).join(', ')}`);
  process.exit(1);
}
console.log(`  ✅ 중복 없음 (기존 ${existingIds.size}개 항목과 비교)\n`);

if (DRY_RUN) {
  console.log('🔍 DRY RUN 완료. 실제 파일은 생성되지 않았습니다.');
  process.exit(0);
}

// ── 4. delta 파일 저장 ────────────────────────────────────────────────────
fs.mkdirSync(UPDATES_DIR, { recursive: true });
const deltaFile = `updates/${DATE}.json`;
const deltaPath = path.join(UPDATES_DIR, `${DATE}.json`);
fs.writeFileSync(deltaPath, JSON.stringify(phrases, null, 2), 'utf8');
console.log(`✅ delta 파일 생성: ${deltaFile} (${phrases.length}개)\n`);

// ── 5. manifest.json 업데이트 ─────────────────────────────────────────────
let manifest = {};
if (fs.existsSync(MANIFEST)) manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const existingDeltas = Array.isArray(manifest.deltaFiles) ? manifest.deltaFiles : [];
if (!existingDeltas.includes(deltaFile)) existingDeltas.push(deltaFile);

const newManifest = {
  version:     DATE,
  updatedAt:   new Date().toISOString(),
  totalCount:  (manifest.totalCount || 0) + phrases.length,
  langCounts:  langCounts,
  deltaFiles:  existingDeltas,
  changelog:   CHANGELOG,
  changelogKo: CHANGELOG,
};
fs.writeFileSync(MANIFEST, JSON.stringify(newManifest, null, 2), 'utf8');
console.log(`✅ manifest.json 업데이트: version ${newManifest.version}\n`);

// ── 6. Git commit & push ───────────────────────────────────────────────────
try {
  execSync(`git -C "${__dirname}" add .`, { stdio: 'pipe' });
  execSync(`git -C "${__dirname}" commit -m "feat: ${CHANGELOG} (${phrases.length}개, ${Object.keys(langCounts).length}개 언어)"`, { stdio: 'pipe' });
  execSync(`git -C "${__dirname}" push`, { stdio: 'pipe' });

  console.log(`🎉 완료!`);
  console.log(`   추가 표현: ${phrases.length}개 (${Object.keys(langCounts).length}개 언어)`);
  console.log(`   버전: ${newManifest.version}`);
  console.log(`   사용자 반영: 다음 앱 실행 시 자동 다운로드 (최대 6시간)`);
  console.log(`\n   Raw URL:`);
  console.log(`   https://raw.githubusercontent.com/globaltrendhunterai/linguanight-content/main/content/manifest.json`);
} catch (e) {
  console.error('❌ Git push 실패:', e.message);
  process.exit(1);
}
