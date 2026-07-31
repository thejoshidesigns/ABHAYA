/* =========================================================================
   lighthouse-run.mjs - shared Lighthouse runner

   Used by lighthouse-local.mjs (against a locally served dist/) and
   lighthouse-live.mjs (against a deployed origin).

   If Chrome cannot be launched the run is reported as BLOCKED and the process
   exits non-zero. Scores are never estimated, inferred or fabricated.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

export const PAGES = [
  { label: "Home", path: "/index.html" },
  { label: "About", path: "/about.html" },
  { label: "Services", path: "/services/index.html" },
  { label: "Insurance", path: "/insurance.html" },
  { label: "Contact", path: "/contact.html" },
  { label: "Appointment Request", path: "/intake.html" },
];

const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];

/** Locate a Chrome/Chromium binary, preferring an explicit CHROME_PATH. */
function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  // Playwright's bundled Chromium is a valid Lighthouse host.
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (base && fs.existsSync(base)) {
    for (const dir of fs.readdirSync(base)) {
      if (!dir.startsWith("chromium-")) continue;
      const candidate = path.join(base, dir, "chrome-linux", "chrome");
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  try {
    return chromeLauncher.Launcher.getFirstInstallation();
  } catch {
    return undefined;
  }
}

export async function runLighthouse({ baseUrl, pages = PAGES, formFactors = ["mobile", "desktop"] }) {
  const chromePath = findChrome();
  if (!chromePath) {
    throw Object.assign(new Error("no Chrome/Chromium binary found"), { blocked: true });
  }

  let chrome;
  try {
    chrome = await chromeLauncher.launch({
      chromePath,
      chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
    });
  } catch (err) {
    throw Object.assign(new Error(`Chrome failed to launch: ${err.message}`), { blocked: true });
  }

  const rows = [];
  try {
    for (const formFactor of formFactors) {
      for (const page of pages) {
        const url = new URL(page.path, baseUrl).toString();
        const result = await lighthouse(
          url,
          { port: chrome.port, output: "json", logLevel: "error" },
          {
            extends: "lighthouse:default",
            settings: {
              onlyCategories: CATEGORIES,
              formFactor,
              screenEmulation:
                formFactor === "desktop"
                  ? { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }
                  : { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false },
              throttling:
                formFactor === "desktop"
                  ? { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 }
                  : { rttMs: 150, throughputKbps: 1638.4, cpuSlowdownMultiplier: 4 },
            },
          }
        );
        const lhr = result.lhr;
        const scores = Object.fromEntries(
          CATEGORIES.map((c) => [c, Math.round((lhr.categories[c]?.score ?? 0) * 100)])
        );
        const opportunities = Object.values(lhr.audits)
          .filter((a) => a.score !== null && a.score < 0.9 && a.details && a.scoreDisplayMode !== "informative")
          .map((a) => a.title);
        rows.push({ label: page.label, path: page.path, formFactor, scores, opportunities });
        console.log(
          `  ${formFactor.padEnd(7)} ${page.label.padEnd(20)} ` +
            CATEGORIES.map((c) => `${c.slice(0, 4)}:${String(scores[c]).padStart(3)}`).join("  ")
        );
      }
    }
  } finally {
    await chrome.kill();
  }
  return rows;
}

export function writeReport(rows, { title, baseUrl, file }) {
  const dir = path.join(ROOT, "build-reports");
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, file);
  const lines = [
    `# ${title}`,
    "",
    `Base URL: ${baseUrl}`,
    `Generated: ${new Date().toISOString()}`,
    "",
    "Scores are Lighthouse results from this machine only. They do not",
    "represent GoDaddy production performance.",
    "",
    "| Page | Device | Perf | A11y | Best practices | SEO |",
    "| --- | --- | --- | --- | --- | --- |",
    ...rows.map(
      (r) =>
        `| ${r.label} | ${r.formFactor} | ${r.scores.performance} | ${r.scores.accessibility} | ` +
        `${r.scores["best-practices"]} | ${r.scores.seo} |`
    ),
    "",
    "## Findings below 90",
    "",
    ...rows.flatMap((r) =>
      r.opportunities.length
        ? [`### ${r.label} (${r.formFactor})`, "", ...r.opportunities.map((o) => `- ${o}`), ""]
        : []
    ),
  ];
  fs.writeFileSync(out, lines.join("\n") + "\n");
  console.log(`\nReport written to build-reports/${file} (repo only, never shipped in dist/).`);
  return out;
}

export function reportBlocked(err) {
  console.error(
    "\nLighthouse BLOCKED: " +
      err.message +
      "\n  No scores were produced. This task is NOT passed and NOT skipped.\n" +
      "  Install Chrome or set CHROME_PATH to a Chromium binary and re-run."
  );
}
