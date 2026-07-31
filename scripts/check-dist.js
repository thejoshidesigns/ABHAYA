#!/usr/bin/env node
/* =========================================================================
   check-dist.js - production bundle gate + manifest generator

   Verifies that dist/ is a clean, upload-ready public_html payload:
     - required files are present (.htaccess, 404.html, index.html, ...)
     - no source, test, tooling, AI-assistant or private documentation files
     - no secrets, source maps, lockfiles or editor/OS junk
     - no unresolved build markers

   Writes DIST-MANIFEST.txt at the repository root (never inside dist/).
   Exits non-zero on any violation.
   ========================================================================= */
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const MANIFEST = path.join(ROOT, "DIST-MANIFEST.txt");

const errors = [];
const fail = (msg) => errors.push(msg);

if (!fs.existsSync(DIST)) {
  console.error("check-dist: dist/ does not exist. Run `npm run build` first.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 1. Required files
// ---------------------------------------------------------------------------
const REQUIRED = [
  ".htaccess",
  "index.html",
  "404.html",
  "robots.txt",
  "sitemap.xml",
  "favicon.svg",
  "contact.html",
  "insurance.html",
  "services/index.html",
];
for (const rel of REQUIRED) {
  if (!fs.existsSync(path.join(DIST, rel))) fail(`missing required file: ${rel}`);
}

// ---------------------------------------------------------------------------
// 2. Forbidden content
// ---------------------------------------------------------------------------
// Exact path segments that must never appear anywhere in dist/.
const FORBIDDEN_NAMES = new Set([
  "node_modules", "src", "partials", "tests", "test", "scripts",
  "test-results", "playwright-report", "coverage",
  ".git", ".github", ".lovable", ".workspace", ".vscode", ".idea",
  ".claude", ".codex", ".agents", ".cursor", ".aider",
  "build.js", "playwright.config.js", "package.json", "package-lock.json",
  "bun.lock", "bun.lockb", "yarn.lock", "pnpm-lock.yaml",
  ".htmlvalidate.json", ".prettierrc", ".prettierignore", ".editorconfig",
  ".gitignore", ".gitattributes", ".nvmrc", "tsconfig.json", "vite.config.ts",
  "MAINTENANCE.md", "UNRESOLVED-CONTENT.md", "DEPLOYMENT-CHECKLIST.md",
  "SECURITY-HEADERS.md", "THIRD-PARTY-AUDIT.md", "DIST-MANIFEST.txt",
  "README.md", "AGENTS.md", "CLAUDE.md", "LICENSE",
  ".DS_Store", "Thumbs.db", ".env",
]);

// Filename patterns that must never ship.
const FORBIDDEN_PATTERNS = [
  { re: /\.map$/i,            why: "source map" },
  { re: /\.(ts|tsx|jsx)$/i,   why: "uncompiled source" },
  { re: /\.(scss|sass|less|styl)$/i, why: "uncompiled stylesheet" },
  { re: /\.(test|spec)\.[a-z]+$/i,   why: "test file" },
  { re: /^\.env/i,            why: "environment file" },
  { re: /\.(bak|orig|rej|swp|tmp)$/i, why: "editor/temp artifact" },
  { re: /~$/,                 why: "editor backup" },
  { re: /\.(psd|ai|sketch|fig|xd)$/i, why: "design source" },
  { re: /\.(zip|tar|gz|rar|7z)$/i,    why: "archive" },
  { re: /\.md$/i,             why: "documentation (internal)" },
];

// Text patterns that must never appear inside shipped files.
const FORBIDDEN_CONTENT = [
  { re: /@include\s+[a-z-]+\s*-->/i, why: "unresolved build include marker" },
  { re: /BEGIN (RSA|OPENSSH|PRIVATE) /, why: "private key material" },
  { re: /\bsk_live_[A-Za-z0-9]{10,}/, why: "live secret key" },
  { re: /lovable/i, why: "AI-tool branding" },
  { re: /\bTODO\b|\bFIXME\b|lorem ipsum/i, why: "placeholder text" },
];
// Only scan text-ish files for content violations.
const TEXT_EXT = new Set([".html", ".css", ".js", ".json", ".xml", ".txt", ".svg"]);

const files = [];
(function walk(dir, rel) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const relPath = rel ? `${rel}/${entry.name}` : entry.name;
    if (FORBIDDEN_NAMES.has(entry.name)) {
      fail(`forbidden entry in dist/: ${relPath}`);
      continue;
    }
    if (entry.isDirectory()) {
      walk(path.join(dir, entry.name), relPath);
      continue;
    }
    for (const { re, why } of FORBIDDEN_PATTERNS) {
      if (re.test(entry.name)) fail(`forbidden ${why} in dist/: ${relPath}`);
    }
    const abs = path.join(dir, entry.name);
    const stat = fs.statSync(abs);
    const buf = fs.readFileSync(abs);
    if (TEXT_EXT.has(path.extname(entry.name).toLowerCase())) {
      const text = buf.toString("utf8");
      for (const { re, why } of FORBIDDEN_CONTENT) {
        const m = text.match(re);
        if (m) fail(`${why} found in dist/${relPath}: ${JSON.stringify(m[0].slice(0, 40))}`);
      }
    }
    files.push({
      rel: relPath,
      bytes: stat.size,
      sha256: crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16),
    });
  }
})(DIST, "");

// ---------------------------------------------------------------------------
// 3. Manifest (repo root, excluded from dist/ by build.js)
// ---------------------------------------------------------------------------
files.sort((a, b) => a.rel.localeCompare(b.rel));
const totalBytes = files.reduce((n, f) => n + f.bytes, 0);
const kb = (n) => (n / 1024).toFixed(1).padStart(9) + " KB";

const lines = [
  "Abhaya Behavioral Health - production bundle manifest",
  "Upload the CONTENTS of dist/ into public_html/ on GoDaddy.",
  "",
  `Generated: ${new Date().toISOString()}`,
  `Files:     ${files.length}`,
  `Total:     ${(totalBytes / 1024).toFixed(1)} KB`,
  "",
  "SIZE          SHA256(16)        PATH",
  "".padEnd(78, "-"),
  ...files.map((f) => `${kb(f.bytes)}  ${f.sha256}  ${f.rel}`),
];
fs.writeFileSync(MANIFEST, lines.join("\n") + "\n");

// ---------------------------------------------------------------------------
if (errors.length) {
  console.error("check-dist FAILED:\n" + errors.map((e) => "  " + e).join("\n"));
  process.exit(1);
}
console.log(
  `check-dist passed. ${files.length} files, ${(totalBytes / 1024).toFixed(1)} KB. ` +
    "Manifest written to DIST-MANIFEST.txt"
);
