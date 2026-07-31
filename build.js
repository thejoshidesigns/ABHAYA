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
  "DEPLOYMENT-CHECKLIST.md",
  "SECURITY-HEADERS.md",
  "THIRD-PARTY-AUDIT.md",
  "DIST-MANIFEST.txt",
  "LICENSE",
  ".htmlvalidate.json",
  ".editorconfig",
  "coverage",
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
    // Documentation, tests and tooling never belong in a public bundle.
    if (/\.(md|map|test\.js|spec\.js)$/i.test(entry.name)) continue;
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

// ---------------------------------------------------------------------------
// Asset optimisation
//
// The authored CSS is split across seven files for maintainability. Shipping
// seven render-blocking stylesheets costs roughly two seconds of blocking time
// on a throttled mobile connection, so the build concatenates them, in the
// authored cascade order, into one minified `site.css` and rewrites every page
// to load that single file. Source files stay split in the repo; only dist/
// is bundled. Nothing about the cascade, the selectors or the design changes.
// ---------------------------------------------------------------------------
const esbuild = require("esbuild");

// Cascade order. Must match the order the <link> tags were authored in.
const CSS_ORDER = [
  "tokens.css",
  "fonts.css",
  "base.css",
  "components.css",
  "pages.css",
  "motion.css",
  "home-v2.css",
];

const CSS_DIR = path.join(DIST, "assets", "css");

function bundleCss() {
  const parts = [];
  for (const name of CSS_ORDER) {
    const file = path.join(CSS_DIR, name);
    if (!fs.existsSync(file)) {
      console.error(`build: expected stylesheet assets/css/${name}`);
      process.exit(1);
    }
    parts.push(`/* ${name} */\n${fs.readFileSync(file, "utf8")}`);
  }
  const { code } = esbuild.transformSync(parts.join("\n"), {
    loader: "css",
    minify: true,
    // Match the browser floor the site already targets.
    target: ["chrome100", "firefox100", "safari15", "edge100"],
  });
  fs.writeFileSync(path.join(CSS_DIR, "site.css"), code);
  // The individual files are now dead weight in the bundle.
  for (const name of CSS_ORDER) fs.rmSync(path.join(CSS_DIR, name));
}

function minifyJs(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      minifyJs(p);
      continue;
    }
    if (!entry.name.endsWith(".js")) continue;
    // Vendor bundles ship pre-minified; re-processing them buys nothing.
    if (entry.name.endsWith(".min.js")) continue;
    const src = fs.readFileSync(p, "utf8");
    const { code } = esbuild.transformSync(src, {
      loader: "js",
      minify: true,
      target: ["chrome100", "firefox100", "safari15", "edge100"],
    });
    fs.writeFileSync(p, code);
  }
}

/** Collapse the per-file stylesheet links in one page down to site.css. */
function rewriteCssLinks(html, relPath) {
  const depth = relPath.split("/").length - 1;
  const base = "../".repeat(depth);
  const linkRe = new RegExp(
    `[ \\t]*<link rel="stylesheet" href="[^"]*assets/css/(${CSS_ORDER.join("|").replace(/\./g, "\\.")})"[^>]*>\\n?`,
    "g"
  );
  if (!linkRe.test(html)) return html;
  let first = true;
  return html.replace(linkRe, () => {
    if (!first) return "";
    first = false;
    return `  <link rel="stylesheet" href="${base}assets/css/site.css" />\n`;
  });
}

function forEachHtml(dir, fn) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) forEachHtml(p, fn);
    else if (entry.name.endsWith(".html")) fn(p, path.relative(DIST, p).split(path.sep).join("/"));
  }
}

bundleCss();
minifyJs(path.join(DIST, "assets", "js"));
forEachHtml(DIST, (file, rel) => {
  fs.writeFileSync(file, rewriteCssLinks(fs.readFileSync(file, "utf8"), rel));
});

// Safety: sanity-check that .htaccess and 404.html shipped.
for (const required of [".htaccess", "404.html", "index.html"]) {
  if (!fs.existsSync(path.join(DIST, required))) {
    console.error(`build: expected ${required} in dist/`);
    process.exit(1);
  }
}

console.log("Build complete -> dist/");
