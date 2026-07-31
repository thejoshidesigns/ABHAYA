/**
 * Content hygiene check.
 * Fails when mojibake, replacement characters, stray control characters or
 * unfinished placeholder text are found in source or generated output.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
// scripts/ and tests/ are tooling, never shipped content: they legitimately
// contain placeholder addresses and sample data used to drive the checks.
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'scripts',
  'tests',
  'build-reports',
  'test-results',
  'playwright-report',
]);

const EXTENSIONS = ['.html', '.css', '.js', '.json', '.xml', '.txt', '.md'];
const SKIP_FILES = new Set(['UNRESOLVED-CONTENT.md', 'MAINTENANCE.md', 'package-lock.json', 'bun.lock']);

const RULES = [
  { name: 'mojibake', re: /Ã.|â€.|Â[\s\u00a0]|Ã¢â‚¬/ },
  { name: 'replacement character (U+FFFD)', re: /\uFFFD/ },
  { name: 'stray control character', re: /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/ },
  { name: 'placeholder text', re: /\b(TODO|TBD|FIXME|lorem ipsum|XXX_)\b/i },
  { name: 'placeholder domain', re: /example\.(com|org|net)/i },
  { name: 'empty link stub', re: /href\s*=\s*["']#["']/ },
];

const offenders = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    if (SKIP_FILES.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(full);
      continue;
    }
    if (!EXTENSIONS.includes(path.extname(entry.name))) continue;
    // Built JS in dist/ is minified, which strips the per-line
    // "check-content-ignore" markers this scanner relies on. The authored
    // sources under assets/js are scanned instead, so nothing is skipped.
    if (full.includes(`dist${path.sep}assets${path.sep}js`)) continue;
    const text = fs.readFileSync(full, 'utf8');
    text.split(/\r?\n/).forEach((line, i) => {
      if (line.includes('check-content-ignore')) return;
      for (const rule of RULES) {
        if (rule.re.test(line)) {
          offenders.push(
            `${path.relative(ROOT, full)}:${i + 1}: [${rule.name}] ${line.trim().slice(0, 140)}`
          );
        }
      }
    });
  }
}

walk(ROOT);

if (offenders.length) {
  console.error('Content check failed:');
  offenders.forEach((o) => console.error('  ' + o));
  process.exit(1);
}

console.log('Content check passed. No encoding defects or placeholders found.');
