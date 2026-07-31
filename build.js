const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");
const PARTIALS_DIR = path.join(ROOT, "partials");

// Never copy these into the production bundle.
const EXCLUDE = new Set([
  "dist",
  "node_modules",
  "src",
  "partials",
  "tests",
  "test-results",
  "playwright-report",
  "build.js",
  "package.json",
  "package-lock.json",
  "bun.lock",
  "playwright.config.js",
  ".env",
  ".env.local",
  ".env.production",
  ".gitignore",
  ".prettierrc",
  ".prettierignore",
  ".github",
  ".lovable",
  ".workspace",
  ".vscode",
  ".idea",
  ".claude",
  ".codex",
  ".agents",
  "scripts",
  "README.md",
  "readme.md",
  "AGENTS.md",
  "CLAUDE.md",
  "MAINTENANCE.md",
  "UNRESOLVED-CONTENT.md",
  "tsconfig.json",
  "vite.config.ts",
]);

// ---------------------------------------------------------------------------
// Partials
// ---------------------------------------------------------------------------
const partials = {};
for (const entry of fs.readdirSync(PARTIALS_DIR)) {
  if (!entry.endsWith(".html")) continue;
  partials[entry.replace(/\.html$/, "")] = fs.readFileSync(
    path.join(PARTIALS_DIR, entry),
    "utf8"
  ).trimEnd();
}

// Page -> primary nav key used for the active state.
const NAV_KEY = {
  "index.html": "home",
  "about.html": "about",
  "conditions.html": "conditions",
  "insurance.html": "insurance",
  "care.html": "care",
  "faq.html": "faq",
  "contact.html": "contact",
  "services/index.html": "services",
  "services/medication.html": "services",
  "services/psychotherapy.html": "services",
  "services/telepsychiatry.html": "services",
};

function renderPartial(name, base, navKey) {
  let html = partials[name];
  if (html === undefined) {
    console.error(`build: unknown partial "${name}"`);
    process.exit(1);
  }
  html = html.replace(/\{\{base\}\}/g, base);
  if (navKey) {
    html = html.replace(
      new RegExp(`(<a [^>]*data-nav="${navKey}")`, "g"),
      '$1 aria-current="page"'
    );
  }
  return html;
}

function renderPage(html, relPath) {
  const depth = relPath.split("/").length - 1;
  const base = "../".repeat(depth);
  const navKey = NAV_KEY[relPath];
  return html.replace(/<!--\s*@include\s+([a-z0-9-]+)\s*-->/g, (_m, name) =>
    renderPartial(name, base, navKey)
  );
}

function assertStructure(html, relPath) {
  const count = (re) => (html.match(re) || []).length;
  const checks = [
    ["<header>", count(/<header[\s>]/g)],
    ["<main>", count(/<main[\s>]/g)],
    ["<footer>", count(/<footer[\s>]/g)],
  ];
  for (const [label, n] of checks) {
    if (n !== 1) {
      console.error(`build: ${relPath} has ${n} ${label} elements (expected 1)`);
      process.exit(1);
    }
  }
  if (/@include/.test(html)) {
    console.error(`build: ${relPath} still contains an unresolved @include marker`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Copy + render
// ---------------------------------------------------------------------------
function copyDir(src, dest, rel = "") {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    // Keep .htaccess; drop every other dotfile/dotdir.
    if (entry.name.startsWith(".") && entry.name !== ".htaccess") continue;
    if (EXCLUDE.has(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    const relPath = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, relPath);
    } else if (entry.name.endsWith(".html")) {
      const rendered = renderPage(fs.readFileSync(srcPath, "utf8"), relPath);
      assertStructure(rendered, relPath);
      fs.writeFileSync(destPath, rendered);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
copyDir(ROOT, DIST);

// Safety: sanity-check that .htaccess and 404.html shipped.
for (const required of [".htaccess", "404.html", "index.html"]) {
  if (!fs.existsSync(path.join(DIST, required))) {
    console.error(`build: expected ${required} in dist/`);
    process.exit(1);
  }
}

console.log("Build complete -> dist/");
