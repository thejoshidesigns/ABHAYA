#!/usr/bin/env node
/* =========================================================================
   verify-production.js - read-only checks against a deployed site

   Usage: npm run verify:production -- https://www.abhayabh.com

   SAFETY MODEL. This script only ever performs HEAD/GET requests against the
   supplied origin. It:
     - never submits a form (form actions are collected, never requested)
     - never touches tel:, fax:, sms:, mailto: or crisis links (911, 988)
     - never follows links to other origins
     - never sends more than a small number of concurrent requests
     - never modifies anything on the server

   WHAT IT CANNOT TELL YOU. Header checks reflect whatever server actually
   answers. GoDaddy Apache applies .htaccess; GitHub Pages and local static
   servers ignore it entirely. Passing header checks against any host other
   than the real GoDaddy production origin proves nothing about .htaccess.

   Structured data is checked for JSON syntax and required schema.org keys
   only. It is NOT medically or legally verified.
   ========================================================================= */
"use strict";

const https = require("https");
const http = require("http");
const { URL } = require("url");

const TIMEOUT_MS = 15000;
const MAX_PAGES = 40;
const MAX_DEPTH = 2;
const CONCURRENCY = 2;

const raw = process.argv[2];
if (!raw) {
  console.error(
    "verify:production requires a base URL.\n" +
      "  Usage: npm run verify:production -- https://www.abhayabh.com"
  );
  process.exit(1);
}
let BASE;
try {
  BASE = new URL(raw.endsWith("/") ? raw : raw + "/");
} catch {
  console.error(`verify:production: "${raw}" is not a valid URL.`);
  process.exit(1);
}

const results = [];
const pass = (name, detail) => results.push({ level: "PASS", name, detail });
const warn = (name, detail, fix) => results.push({ level: "WARN", name, detail, fix });
const fail = (name, detail, fix) => results.push({ level: "FAIL", name, detail, fix });
const info = (name, detail) => results.push({ level: "INFO", name, detail });

/** Single request. Never follows redirects: the caller decides. */
function request(url, method = "GET") {
  return new Promise((resolve) => {
    const u = new URL(url);
    const lib = u.protocol === "https:" ? https : http;
    const req = lib.request(
      u,
      {
        method,
        timeout: TIMEOUT_MS,
        headers: { "User-Agent": "abhaya-verify-production/1.0 (read-only checker)" },
      },
      (res) => {
        const chunks = [];
        let bytes = 0;
        res.on("data", (c) => {
          bytes += c.length;
          if (bytes < 2_000_000) chunks.push(c);
        });
        res.on("end", () =>
          resolve({
            ok: true,
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks).toString("utf8"),
            url,
          })
        );
      }
    );
    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, error: `timed out after ${TIMEOUT_MS}ms`, url });
    });
    req.on("error", (e) => resolve({ ok: false, error: e.message, url }));
    req.end();
  });
}

/** HEAD with automatic GET fallback: some servers reject or mishandle HEAD. */
async function probe(url) {
  const head = await request(url, "HEAD");
  if (head.ok && head.status !== 405 && head.status !== 501) return head;
  return request(url, "GET");
}

// ---------------------------------------------------------------------------
// Link classification
// ---------------------------------------------------------------------------
const SKIP_SCHEMES = /^(tel|fax|sms|mailto|callto|facetime|javascript|data|geo):/i;
const CRISIS = /(^|[^0-9])(911|988)([^0-9]|$)/;

function classify(href, from) {
  if (!href || href.startsWith("#")) return null;
  if (SKIP_SCHEMES.test(href)) return null; // never dialled, texted or emailed
  let u;
  try {
    u = new URL(href, from);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  if (u.origin !== BASE.origin) return null; // same-origin only
  if (CRISIS.test(u.pathname)) return null;
  u.hash = "";
  return u.toString();
}

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i"));
  return m ? (m[2] ?? m[3]) : null;
};
const tags = (html, tagName) => html.match(new RegExp(`<${tagName}\\b[^>]*>`, "gi")) || [];

// ---------------------------------------------------------------------------
async function main() {
  console.log(`Verifying ${BASE.origin} (read-only)\n`);

  // --- 1. HTTPS availability -----------------------------------------------
  const httpsUrl = `https://${BASE.host}/`;
  const root = await probe(httpsUrl);
  if (!root.ok) {
    fail("HTTPS availability", `${httpsUrl} did not respond: ${root.error}`, "Confirm the site is deployed and the TLS certificate is installed in cPanel.");
    return finish();
  }
  if (root.status >= 400) {
    fail("HTTPS availability", `${httpsUrl} returned ${root.status}`, "The homepage must return 200. Check public_html/index.html exists.");
  } else {
    pass("HTTPS availability", `${httpsUrl} returned ${root.status}`);
  }

  // --- 2. HTTP -> HTTPS redirect (manual redirect handling) ----------------
  const plain = await request(`http://${BASE.host}/`, "GET");
  if (!plain.ok) {
    warn("HTTP to HTTPS redirect", `http://${BASE.host}/ did not respond: ${plain.error}`, "Port 80 should redirect, not refuse. Check the RewriteRule in .htaccess.");
  } else if (plain.status >= 300 && plain.status < 400) {
    const loc = plain.headers.location || "";
    if (loc.startsWith("https://")) pass("HTTP to HTTPS redirect", `${plain.status} -> ${loc}`);
    else fail("HTTP to HTTPS redirect", `${plain.status} -> ${loc}`, "The Location header must point at an https:// URL.");
  } else {
    fail("HTTP to HTTPS redirect", `plain HTTP returned ${plain.status} with no redirect`, "Add the http->https RewriteRule to .htaccess.");
  }

  // --- 3. Canonical host: derived, never assumed ---------------------------
  const canonicalTag = (root.body.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i) || [])[0];
  const canonicalHref = canonicalTag ? attr(canonicalTag, "href") : null;
  let canonicalHost = null;
  if (canonicalHref) {
    try {
      canonicalHost = new URL(canonicalHref, BASE).host;
    } catch { /* malformed, reported below */ }
  }
  if (!canonicalHost) {
    warn("Canonical host", "the homepage has no usable rel=canonical", "Add <link rel=\"canonical\"> to index.html.");
  } else if (canonicalHost !== BASE.host) {
    warn(
      "Canonical host",
      `you supplied ${BASE.host} but the homepage declares ${canonicalHost} as canonical`,
      `Either verify ${BASE.host} against ${canonicalHost}, or correct the canonical tags. Both hosts must serve the site; only one is canonical.`
    );
  } else {
    pass("Canonical host", `${BASE.host} matches the declared canonical`);
  }
  // Report the other host's behaviour without deciding which is "right".
  const otherHost = BASE.host.startsWith("www.") ? BASE.host.slice(4) : `www.${BASE.host}`;
  const other = await request(`https://${otherHost}/`, "GET");
  if (!other.ok) {
    warn("Alternate host", `https://${otherHost}/ did not respond: ${other.error}`, `Both ${BASE.host} and ${otherHost} should resolve.`);
  } else if (other.status >= 300 && other.status < 400) {
    info("Alternate host", `https://${otherHost}/ redirects (${other.status}) to ${other.headers.location}`);
  } else {
    info("Alternate host", `https://${otherHost}/ serves content directly (${other.status}); confirm this matches the canonical intent`);
  }

  // --- 4. Security headers -------------------------------------------------
  const h = root.headers;
  const headerCheck = (key, label, fix) => {
    if (h[key]) pass(label, String(h[key]).slice(0, 160));
    else fail(label, "header absent", fix);
  };
  headerCheck("content-security-policy", "Content-Security-Policy", "Confirm .htaccess uploaded and mod_headers is enabled on the hosting plan.");
  headerCheck("x-content-type-options", "X-Content-Type-Options", "Add: Header always set X-Content-Type-Options \"nosniff\"");
  headerCheck("referrer-policy", "Referrer-Policy", "Add: Header always set Referrer-Policy \"strict-origin-when-cross-origin\"");
  headerCheck("permissions-policy", "Permissions-Policy", "Add the Permissions-Policy header to .htaccess.");
  if (h["strict-transport-security"]) {
    info("HSTS (reported only)", String(h["strict-transport-security"]));
  } else {
    info("HSTS (reported only)", "not set. This is expected until HTTPS has been verified for a while; see SECURITY-HEADERS.md before enabling.");
  }

  // --- 5. robots.txt, sitemap.xml, 404 -------------------------------------
  const robots = await request(new URL("/robots.txt", BASE).toString(), "GET");
  if (robots.ok && robots.status === 200) {
    pass("robots.txt", `200, ${robots.body.split("\n").length} lines`);
    if (/^\s*Disallow:\s*\/\s*$/im.test(robots.body)) {
      fail("robots.txt", "contains `Disallow: /`, which blocks the entire site", "Remove the blanket disallow before launch.");
    }
    if (!/sitemap:/i.test(robots.body)) warn("robots.txt", "no Sitemap: line", "Add `Sitemap: https://<canonical-host>/sitemap.xml`.");
  } else {
    fail("robots.txt", robots.ok ? `returned ${robots.status}` : robots.error, "Upload robots.txt into public_html.");
  }

  const sitemap = await request(new URL("/sitemap.xml", BASE).toString(), "GET");
  if (sitemap.ok && sitemap.status === 200 && /<urlset/i.test(sitemap.body)) {
    const locs = sitemap.body.match(/<loc>/gi) || [];
    pass("sitemap.xml", `200, ${locs.length} URLs`);
    const wrongHost = (sitemap.body.match(/<loc>\s*([^<]+)/gi) || []).filter((l) => {
      try { return new URL(l.replace(/<loc>\s*/i, "")).host !== BASE.host; } catch { return true; }
    });
    if (wrongHost.length) {
      warn("sitemap.xml", `${wrongHost.length} URLs do not use ${BASE.host}`, "Sitemap URLs must use the canonical host.");
    }
  } else {
    fail("sitemap.xml", sitemap.ok ? `returned ${sitemap.status}` : sitemap.error, "Upload sitemap.xml into public_html.");
  }

  const notFound = await request(new URL("/this-page-does-not-exist-" + Date.now(), BASE).toString(), "GET");
  if (!notFound.ok) {
    fail("Custom 404", notFound.error, "The server must answer unknown paths.");
  } else if (notFound.status !== 404) {
    fail("Custom 404", `unknown path returned ${notFound.status}, expected 404`, "Set `ErrorDocument 404 /404.html` in .htaccess; a soft 200 harms indexing.");
  } else if (!/abhaya/i.test(notFound.body)) {
    warn("Custom 404", "404 status is correct but the body is not the site's 404 page", "Confirm 404.html is present in public_html.");
  } else {
    pass("Custom 404", "404 status with the custom page body");
  }

  // --- 6. Crawl same-origin pages -----------------------------------------
  const seen = new Set([new URL("/index.html", BASE).toString()]);
  const queue = [{ url: new URL("/index.html", BASE).toString(), depth: 0 }];
  const pages = [];
  const assets = new Set();
  const formActions = new Set();

  while (queue.length && pages.length < MAX_PAGES) {
    const batch = queue.splice(0, CONCURRENCY); // deliberately small
    const fetched = await Promise.all(batch.map((item) => request(item.url, "GET").then((r) => ({ ...item, r }))));
    for (const { url, depth, r } of fetched) {
      if (!r.ok || r.status >= 400) {
        fail("Internal link", `${url} -> ${r.ok ? r.status : r.error}`, "Fix or remove the link, or upload the missing page.");
        continue;
      }
      pages.push({ url, html: r.body });
      if (depth >= MAX_DEPTH) continue;
      for (const a of tags(r.body, "a")) {
        const next = classify(attr(a, "href"), url);
        if (next && !seen.has(next) && seen.size < MAX_PAGES) {
          seen.add(next);
          queue.push({ url: next, depth: depth + 1 });
        }
      }
      for (const t of [...tags(r.body, "img"), ...tags(r.body, "script"), ...tags(r.body, "link")]) {
        const src = attr(t, "src") || (/(stylesheet|icon|preload)/i.test(attr(t, "rel") || "") ? attr(t, "href") : null);
        const abs = classify(src, url);
        if (abs) assets.add(abs);
      }
      for (const f of tags(r.body, "form")) {
        const action = attr(f, "action");
        if (action) formActions.add(action); // recorded, NEVER requested
      }
    }
  }
  pass("Internal crawl", `${pages.length} same-origin pages reachable (depth <= ${MAX_DEPTH})`);
  if (formActions.size) {
    info("Forms", `${formActions.size} form action(s) present. Never submitted by this tool: ${[...formActions].join(", ").slice(0, 200)}`);
  }

  // --- 7. Assets -----------------------------------------------------------
  const assetList = [...assets];
  let missing = 0;
  for (let i = 0; i < assetList.length; i += CONCURRENCY) {
    const slice = assetList.slice(i, i + CONCURRENCY);
    const res = await Promise.all(slice.map((u) => probe(u)));
    res.forEach((r, j) => {
      if (!r.ok || r.status >= 400) {
        missing++;
        fail("Missing asset", `${slice[j]} -> ${r.ok ? r.status : r.error}`, "Upload the file or correct the reference.");
      }
    });
  }
  if (!missing) pass("Assets", `${assetList.length} referenced assets all reachable`);

  // --- 8. Per-page metadata, canonical and JSON-LD -------------------------
  const titles = new Map();
  for (const { url, html } of pages) {
    const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]?.trim();
    const descTag = (html.match(/<meta\b[^>]*name=["']description["'][^>]*>/i) || [])[0];
    const desc = descTag ? attr(descTag, "content") : null;
    const canon = (html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i) || [])[0];

    if (!title) fail("Page title", `${url} has no <title>`, "Add a unique title.");
    else if (titles.has(title)) warn("Page title", `duplicate title on ${url} and ${titles.get(title)}`, "Every page needs a distinct title.");
    else titles.set(title, url);

    if (!desc || desc.length < 50) fail("Meta description", `${url} description is missing or under 50 chars`, "Write a 50-160 character description.");
    else if (desc.length > 165) warn("Meta description", `${url} description is ${desc.length} chars`, "Trim to 160 characters or fewer.");

    if (!canon) warn("Canonical link", `${url} has no rel=canonical`, "Add a canonical link to each page.");
    else {
      const href = attr(canon, "href");
      try {
        if (new URL(href, url).host !== (canonicalHost || BASE.host)) {
          warn("Canonical link", `${url} points at a different host (${href})`, "Canonical hosts must be consistent site-wide.");
        }
      } catch {
        fail("Canonical link", `${url} has a malformed canonical (${href})`, "Use an absolute https URL.");
      }
    }

    for (const block of html.match(/<script\b[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) || []) {
      const json = block.replace(/^[\s\S]*?>/, "").replace(/<\/script>$/i, "");
      try {
        const data = JSON.parse(json);
        const nodes = Array.isArray(data) ? data : [data];
        for (const n of nodes) {
          if (!n["@context"] || !n["@type"]) {
            warn("JSON-LD", `${url}: a block is valid JSON but lacks @context or @type`, "Add both keys.");
          }
        }
      } catch (e) {
        fail("JSON-LD", `${url}: invalid JSON (${e.message})`, "Fix the syntax error in the ld+json block.");
      }
    }
  }
  info(
    "JSON-LD scope",
    "Checked for JSON syntax and the presence of @context/@type only. This is NOT a medical, clinical or legal verification of the claims in the markup."
  );

  finish();
}

function finish() {
  const order = { FAIL: 0, WARN: 1, PASS: 2, INFO: 3 };
  results.sort((a, b) => order[a.level] - order[b.level]);
  console.log("");
  for (const r of results) {
    console.log(`${r.level.padEnd(4)}  ${r.name}: ${r.detail}`);
    if (r.fix) console.log(`      fix: ${r.fix}`);
  }
  const fails = results.filter((r) => r.level === "FAIL").length;
  const warns = results.filter((r) => r.level === "WARN").length;
  console.log(
    `\n${fails} failing, ${warns} warnings, ${results.filter((r) => r.level === "PASS").length} passing.` +
      "\nNote: header results describe whichever server answered. Only the real" +
      "\nGoDaddy origin exercises .htaccess; GitHub Pages and local static servers" +
      "\nignore it completely."
  );
  process.exit(fails ? 1 : 0);
}

main().catch((e) => {
  console.error("verify:production crashed:", e);
  process.exit(1);
});
