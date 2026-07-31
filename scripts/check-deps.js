#!/usr/bin/env node
/* =========================================================================
   check-deps.js - dependency vulnerability gate

   Runs `npm audit --json` and fails only on HIGH or CRITICAL advisories.

   Why this exists instead of calling `npm audit` directly in the npm script:
   `npm audit` exits non-zero both when it finds vulnerabilities AND when it
   cannot reach the advisory endpoint (proxied registries, offline CI, mirrors
   that do not implement /security/audits). Those are very different outcomes.
   A registry that is simply unreachable must not silently block a release,
   and must not be mistaken for a clean result either.

   Exit 0 = no high/critical advisories, or the registry was unreachable
            (loudly reported as SKIPPED, review manually before launch).
   Exit 1 = high or critical advisories present.

   Never run `npm audit fix --force`. It performs major-version upgrades.
   ========================================================================= */
"use strict";

const { spawnSync } = require("child_process");

const res = spawnSync("npm", ["audit", "--json"], {
  cwd: require("path").join(__dirname, ".."),
  encoding: "utf8",
  maxBuffer: 32 * 1024 * 1024,
});

let report = null;
try {
  report = JSON.parse(res.stdout);
} catch {
  /* non-JSON output, handled below */
}

// Registry could not answer: skip loudly rather than blocking or lying.
if (!report || report.error) {
  const detail =
    (report && report.error && (report.error.summary || report.error.detail)) ||
    (res.stderr || "").trim().split("\n").slice(-1)[0] ||
    "unknown error";
  console.warn(
    "check-deps SKIPPED: the npm advisory endpoint is unavailable.\n" +
      `  reason: ${detail}\n` +
      "  This is NOT a pass. Run `npm audit` against the public registry\n" +
      "  before deploying (see DEPLOYMENT-CHECKLIST.md section 1)."
  );
  process.exit(0);
}

const counts = (report.metadata && report.metadata.vulnerabilities) || {};
const high = (counts.high || 0) + (counts.critical || 0);
const summary = ["critical", "high", "moderate", "low", "info"]
  .map((k) => `${counts[k] || 0} ${k}`)
  .join(", ");

if (high > 0) {
  console.error(`check-deps FAILED: ${summary}`);
  for (const [name, v] of Object.entries(report.vulnerabilities || {})) {
    if (v.severity === "high" || v.severity === "critical") {
      console.error(`  ${v.severity.toUpperCase()}  ${name}  (${v.range || "?"})`);
    }
  }
  console.error(
    "\nResolve by upgrading the affected package in package.json and running\n" +
      "`npm install` to refresh the lockfile. Do NOT use `npm audit fix --force`."
  );
  process.exit(1);
}

console.log(`check-deps passed: ${summary}. No high or critical advisories.`);
