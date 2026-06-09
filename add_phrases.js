#!/usr/bin/env node
/**
 * LinguaNight OTA Content Adder
 * Antigravity/Jarvis 에이전트가 호출하는 자동화 스크립트.
 *
 * 사용법:
 * node add_phrases.js \
 *   --date "20260610" \
 *   --changelog "로맨스 표현 15개 추가" \
 *   --file "/path/to/generated_phrases.json"
 *
 * 또는 stdin으로 JSON 직접 파이프:
 * echo '[{...}]' | node add_phrases.js --date "20260610" --changelog "표현 추가" --stdin
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONTENT_DIR = path.join(__dirname, 'content');
const UPDATES_DIR = path.join(CONTENT_DIR, 'updates');
const MANIFEST    = path.join(CONTENT_DIR, 'manifest.json');

// ── CLI 인자 파싱 ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const get  = (flag, def = '') => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : def; };

const DATE      = get('--date',      new Date().toISOString().slice(0,10).replace(/-/g,''));
const CHANGELOG = get('--changelog', '새 표현 추가');
const FILE      = get('--file',      '');
const USE_STDIN = args.includes('--stdin');

// ── 입력 JSON 로드 ─────────────────────────────────────────────────────────
let phrases = [];
if (USE_STDIN) {
  const raw = fs.readFileSync('/dev/stdin', 'utf8');
  phrases = JSON.parse(raw);
} else if (FILE) {
  phrases = JSON.parse(fs.readFileSync(FILE, 'utf8'));
} else {
  console.error('❌ --file 또는 --stdin 중 하나를 지정해야 합니다.');
  process.exit(1);
}

if (!Array.isArray(phrases) || phrases.length === 0) {
  console.error('❌ phrases 배열이 비어 있습니다.');
  process.exit(1);
}

// ── ID 중복 검사 ───────────────────────────────────────────────────────────
const existingIds = new Set();
if (fs.existsSync(UPDATES_DIR)) {
  for (const f of fs.readdirSync(UPDATES_DIR)) {
    if (!f.endsWith('.json') || f.startsWith('EXAMPLE')) continue;
    try {
      const arr = JSON.parse(fs.readFileSync(path.join(UPDATES_DIR, f), 'utf8'));
      arr.forEach(w => existingIds.add(w.id));
    } catch {}
  }
}
const dupes = phrases.filter(w => existingIds.has(w.id));
if (dupes.length > 0) {
  console.error(`❌ 중복 ID 발견: ${dupes.map(w => w.id).join(', ')}`);
  process.exit(1);
}

// ── delta 파일 저장 ────────────────────────────────────────────────────────
fs.mkdirSync(UPDATES_DIR, { recursive: true });
const deltaFile = `updates/${DATE}.json`;
const deltaPath = path.join(UPDATES_DIR, `${DATE}.json`);
fs.writeFileSync(deltaPath, JSON.stringify(phrases, null, 2), 'utf8');
console.log(`✅ delta 파일 생성: ${deltaFile} (${phrases.length}개)`);

// ── manifest.json 업데이트 ─────────────────────────────────────────────────
let manifest = {};
if (fs.existsSync(MANIFEST)) {
  manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
}

// 기존 deltaFiles에 추가 (중복 방지)
const existingDeltas = Array.isArray(manifest.deltaFiles) ? manifest.deltaFiles : [];
if (!existingDeltas.includes(deltaFile)) {
  existingDeltas.push(deltaFile);
}

const newManifest = {
  version:     DATE,
  updatedAt:   new Date().toISOString(),
  totalCount:  (manifest.totalCount || 0) + phrases.length,
  deltaFiles:  existingDeltas,
  changelog:   CHANGELOG.replace(/^[가-힣]/, m => m),  // 영문 버전 (자동 생성 생략)
  changelogKo: CHANGELOG,
};
fs.writeFileSync(MANIFEST, JSON.stringify(newManifest, null, 2), 'utf8');
console.log(`✅ manifest.json 업데이트: version ${newManifest.version}`);

// ── Git commit & push ──────────────────────────────────────────────────────
const repoDir = __dirname;
try {
  execSync(`git -C "${repoDir}" add .`, { stdio: 'pipe' });
  execSync(`git -C "${repoDir}" commit -m "feat: ${CHANGELOG} (${phrases.length}개)"`, { stdio: 'pipe' });
  execSync(`git -C "${repoDir}" push`, { stdio: 'pipe' });
  console.log(`✅ GitHub push 완료`);
  console.log(`\n🎉 완료!`);
  console.log(`   추가된 표현: ${phrases.length}개`);
  console.log(`   버전: ${newManifest.version}`);
  console.log(`   사용자 반영: 다음 앱 실행 시 자동 다운로드`);
  console.log(`   URL: https://raw.githubusercontent.com/globaltrendhunterai/linguanight-content/main/content/manifest.json`);
} catch (e) {
  console.error('❌ Git push 실패:', e.message);
  process.exit(1);
}
