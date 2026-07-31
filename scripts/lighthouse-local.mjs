/* =========================================================================
   lighthouse-local.mjs - Lighthouse against a locally served dist/

   Usage: npm run lighthouse:local

   Serves dist/ on 127.0.0.1 with a tiny static server (no dependency, no
   caching), audits the six representative pages on mobile and desktop, and
   writes build-reports/lighthouse-local.md.

   These scores describe this machine. They are NOT a statement about GoDaddy
   production performance.
   ========================================================================= */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runLighthouse, writeReport, reportBlocked } from "./lighthouse-run.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const PORT = 4399;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
  ".ico": "image/x-icon",
  ".json": "application/json",
};

if (!fs.existsSync(DIST)) {
  console.error("lighthouse-local: dist/ does not exist. Run `npm run build` first.");
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || "/").split("?")[0]);
  let file = path.join(DIST, url);
  if (!file.startsWith(DIST)) {
    res.writeHead(403).end();
    return;
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file)) {
    const notFound = path.join(DIST, "404.html");
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end(fs.existsSync(notFound) ? fs.readFileSync(notFound) : "Not found");
    return;
  }
  res.writeHead(200, {
    "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  res.end(fs.readFileSync(file));
});

server.listen(PORT, "127.0.0.1", async () => {
  const baseUrl = `http://127.0.0.1:${PORT}`;
  console.log(`Serving dist/ at ${baseUrl}\nRunning Lighthouse (mobile + desktop)...\n`);
  try {
    const rows = await runLighthouse({ baseUrl });
    writeReport(rows, {
      title: "Local Lighthouse - Abhaya Behavioral Health",
      baseUrl,
      file: "lighthouse-local.md",
    });
    server.close();
  } catch (err) {
    server.close();
    if (err.blocked) {
      reportBlocked(err);
      process.exit(1);
    }
    throw err;
  }
});
