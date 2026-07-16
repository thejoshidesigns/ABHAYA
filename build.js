const fs = require("fs");
const path = require("path");

const DIST = path.join(__dirname, "dist");
const EXCLUDE = new Set([
  // Build tooling & dev-only artifacts (must NOT ship to GoDaddy public_html)
  "dist", "node_modules", ".claude", ".git", ".github", ".lovable", ".prettierrc", ".prettierignore",
  "build.js", "package.json", "package-lock.json", "bun.lock", ".env", ".gitignore",
  // TanStack template leftovers (source-only, not runtime)
  "src",
  // Unreferenced stray source assets at repo root
  "Untitled.png", "logo.jpeg", "Logo yellow.svg",
]);

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (EXCLUDE.has(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
copyDir(__dirname, DIST);
console.log("Build complete → dist/");
