const fs = require("fs");
const path = require("path");

const DIST = path.join(__dirname, "dist");
const EXCLUDE = new Set(["dist", "node_modules", ".claude", ".git", "build.js", "package.json", "package-lock.json", ".env", ".gitignore"]);

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
