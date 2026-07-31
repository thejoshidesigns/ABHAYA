/**
 * One-off migration: extract shared chrome from index.html into partials/ and
 * replace those blocks in every page with @include markers.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PARTIALS = path.join(ROOT, 'partials');
fs.mkdirSync(PARTIALS, { recursive: true });

const PAGES = [
  'index.html', 'about.html', 'faq.html', 'conditions.html', 'insurance.html',
  'care.html', 'contact.html', 'intake.html', 'privacy.html', 'accessibility.html',
  '404.html', 'services/index.html', 'services/medication.html',
  'services/psychotherapy.html', 'services/telepsychiatry.html',
];

// name -> [startNeedle, endNeedle]
const BLOCKS = {
  topbar: ['<div class="topbar"', '<header class="site-header"'],
  header: ['<header class="site-header"', '</header>'],
  'mobile-menu': ['<div id="mobile-menu"', '<main'],
  crisis: ['<aside class="crisis-editorial"', '</aside>'],
  footer: ['<footer class="site-footer"', '</footer>'],
};

function sliceBlock(src, name) {
  const [startNeedle, endNeedle] = BLOCKS[name];
  const start = src.indexOf(startNeedle);
  if (start === -1) return null;
  let end;
  if (endNeedle.startsWith('</')) {
    const i = src.indexOf(endNeedle, start);
    if (i === -1) return null;
    end = i + endNeedle.length;
  } else {
    const i = src.indexOf(endNeedle, start);
    if (i === -1) return null;
    end = i;
  }
  return { start, end, text: src.slice(start, end) };
}

// ---- 1. Build partials from index.html (depth 0) ----
const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const NAV_KEYS = {
  'index.html': 'home',
  'about.html': 'about',
  'services/index.html': 'services',
  'conditions.html': 'conditions',
  'insurance.html': 'insurance',
  'care.html': 'care',
  'faq.html': 'faq',
  'contact.html': 'contact',
};

function tokenize(text) {
  let out = text;
  // Drop the dev-only GitHub sync widget from production chrome.
  out = out.replace(
    /\s*<div class="github-sync"[\s\S]*?<\/div>\s*<\/div>\n/,
    '\n'
  );
  // Strip per-page active state; the build re-adds it.
  out = out.replace(/\s*aria-current="page"/g, '');
  // Tag nav links so the build can mark the active one.
  for (const [href, key] of Object.entries(NAV_KEYS)) {
    out = out.replace(
      new RegExp(`href="${href.replace('/', '\\/')}"( class="(?:nav__link|mobile-menu__link)")`, 'g'),
      `href="{{base}}${href}"$1 data-nav="${key}"`
    );
  }
  // Remaining root-relative document/asset links get the depth token.
  out = out.replace(/(href|src)="(?!https?:|mailto:|tel:|#|\{\{)/g, '$1="{{base}}');
  out = out.replace(/<use href="(?!\{\{)/g, '<use href="{{base}}');
  return out.trim() + '\n';
}

const partialText = {};
for (const name of Object.keys(BLOCKS)) {
  const block = sliceBlock(index, name);
  if (!block) throw new Error(`could not extract ${name} from index.html`);
  partialText[name] = tokenize(block.text);
  fs.writeFileSync(path.join(PARTIALS, `${name}.html`), partialText[name]);
  console.log(`partials/${name}.html written (${partialText[name].length} bytes)`);
}

// ---- 2. Replace blocks in every page with markers ----
for (const page of PAGES) {
  const file = path.join(ROOT, page);
  let src = fs.readFileSync(file, 'utf8');
  for (const name of Object.keys(BLOCKS)) {
    const block = sliceBlock(src, name);
    if (!block) {
      console.warn(`  ${page}: no ${name} block found, skipped`);
      continue;
    }
    const suffix = BLOCKS[name][1].startsWith('</') ? '' : '\n\n';
    src = src.slice(0, block.start) + `<!-- @include ${name} -->` + suffix + src.slice(block.end);
  }
  fs.writeFileSync(file, src);
  console.log(`rewrote ${page}`);
}
