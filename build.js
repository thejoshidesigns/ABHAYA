const fs = require("fs");
const path = require("path");

const DIST = path.join(__dirname, "dist");

// Never copy these into the production bundle.
const EXCLUDE = new Set([
  "dist",
  "node_modules",
  "src",
  "build.js",
  "package.json",
  "package-lock.json",
  "bun.lock",
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
  "README.md",
  "readme.md",
  "AGENTS.md",
  "CLAUDE.md",
  "tsconfig.json",
  "vite.config.ts",
]);

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    // Keep .htaccess; drop every other dotfile/dotdir.
    if (entry.name.startsWith(".") && entry.name !== ".htaccess") continue;
    if (EXCLUDE.has(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
copyDir(__dirname, DIST);

// Safety: sanity-check that .htaccess and 404.html shipped.
for (const required of [".htaccess", "404.html", "index.html"]) {
  if (!fs.existsSync(path.join(DIST, required))) {
    console.error(`build: expected ${required} in dist/`);
    process.exit(1);
  }
}

console.log("Build complete -> dist/");
