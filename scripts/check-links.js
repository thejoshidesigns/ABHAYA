/**
 * Verifies the built site in dist/:
 *  - every internal href/src resolves to a real file
 *  - every #fragment target exists on the target page
 *  - no duplicate element ids
 *  - tel:/mailto:/external URLs are syntax-checked only, never fetched
 */
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(DIST)) {
  console.error('check-links: dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

const problems = [];
const pages = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) pages.push(full);
  }
}
walk(DIST);

// Collect ids per page first, so cross-page fragments can be checked.
const idsByPage = new Map();
const htmlByPage = new Map();
for (const page of pages) {
  const html = fs.readFileSync(page, 'utf8');
  htmlByPage.set(page, html);
  const ids = [];
  for (const m of html.matchAll(/\sid="([^"]+)"/g)) ids.push(m[1]);
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) problems.push(`${rel(page)}: duplicate id "${id}"`);
    seen.add(id);
  }
  idsByPage.set(page, seen);
}

function rel(p) {
  return path.relative(DIST, p);
}

const ATTR_RE = /\s(?:href|src)="([^"]+)"/g;

for (const page of pages) {
  const html = htmlByPage.get(page);
  const dir = path.dirname(page);
  for (const m of html.matchAll(ATTR_RE)) {
    const raw = m[1].trim();
    if (!raw) {
      problems.push(`${rel(page)}: empty href/src`);
      continue;
    }
    if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:')) continue;
    if (raw.startsWith('mailto:')) {
      if (!/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) problems.push(`${rel(page)}: bad mailto "${raw}"`);
      continue;
    }
    if (raw.startsWith('tel:') || raw.startsWith('sms:')) {
      if (!/^(tel|sms):[0-9+\-().\s]{3,}$/.test(raw)) problems.push(`${rel(page)}: bad ${raw.split(':')[0]} link "${raw}"`);
      continue;
    }

    const [targetPath, fragment] = raw.split('#');

    if (!targetPath) {
      // Same-page fragment.
      if (fragment && !idsByPage.get(page).has(fragment)) {
        problems.push(`${rel(page)}: fragment #${fragment} has no matching id`);
      }
      continue;
    }

    const resolved = path.resolve(dir, targetPath);
    if (!fs.existsSync(resolved)) {
      problems.push(`${rel(page)}: missing target "${raw}"`);
      continue;
    }
    if (fragment && resolved.endsWith('.html')) {
      const targetIds = idsByPage.get(resolved);
      if (targetIds && !targetIds.has(fragment)) {
        problems.push(`${rel(page)}: "${raw}" points at a missing id`);
      }
    }
    if (fragment && resolved.endsWith('.svg')) {
      const svg = fs.readFileSync(resolved, 'utf8');
      if (!svg.includes(`id="${fragment}"`)) {
        problems.push(`${rel(page)}: sprite symbol #${fragment} not found in ${targetPath}`);
      }
    }
  }
}

if (problems.length) {
  console.error(`Link/asset check failed (${problems.length} problem(s)):`);
  problems.forEach((p) => console.error('  ' + p));
  process.exit(1);
}

console.log(`Link/asset check passed across ${pages.length} pages.`);
