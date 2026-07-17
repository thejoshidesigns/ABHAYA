const fs = require("fs");
const path = require("path");

const DIST = path.join(__dirname, "dist");
const EXCLUDE = new Set([
  // Build tooling and local-only artifacts.
  "dist",
  "node_modules",
  "build.js",
  "package.json",
  "package-lock.json",
  ".env",
  // Source-only template leftovers.
  "src",
]);

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name.startsWith(".") && entry.name !== ".htaccess") continue;
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
console.log("Build complete -> dist/");
