#!/usr/bin/env node
/* =========================================================================
   audit-a11y.js - full accessibility report generator

   Two independent passes over every page, at desktop and mobile:

   1. axe-core, reporting EVERY finding by severity (critical, serious,
      moderate, minor) plus "incomplete" items that axe could not decide.
      Incomplete matters: axe reports colour-contrast as *incomplete*, not as
      a violation, whenever it cannot resolve the effective background
      (semi-transparent layers, gradients, images). Those silently disappear
      from a violations-only report.

   2. A computed contrast sweep that does resolve those cases: it walks each
      text node's ancestors, alpha-composites the backgrounds, and calculates
      the real WCAG 2.1 ratio. This catches what pass 1 leaves undecided.

   Report is written to build-reports/ (git-ignored, never shipped in dist/).
   Exit code is always 0: this is a reporting tool. The pass/fail gate is
   tests/e2e/a11y.spec.js.
   ========================================================================= */
"use strict";

const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

const BASE = process.env.AUDIT_BASE_URL || "http://127.0.0.1:8080";
const OUT_DIR = path.join(__dirname, "..", "build-reports");

const PAGES = [
  "/index.html", "/about.html", "/services/index.html",
  "/services/medication.html", "/services/psychotherapy.html",
  "/services/telepsychiatry.html", "/conditions.html", "/insurance.html",
  "/contact.html", "/intake.html", "/faq.html", "/care.html",
  "/privacy.html", "/accessibility.html", "/404.html",
];

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

/* ---------------------------------------------------------------------------
   Browser-side contrast sweep.
   Runs inside the page so it sees real computed styles and real layout.
   --------------------------------------------------------------------------- */
const CONTRAST_SWEEP = () => {
  const parse = (c) => {
    const m = String(c).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lin = (v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const ratio = (a, b) => {
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const composite = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });
  const hex = (c) =>
    "#" + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

  // Effective background: walk up compositing every layer onto white.
  const effectiveBg = (el) => {
    const layers = [];
    let node = el;
    while (node && node !== document.documentElement) {
      const cs = getComputedStyle(node);
      // A background image (gradient/photo) makes the result unreliable.
      if (cs.backgroundImage && cs.backgroundImage !== "none") return { unreliable: true };
      const bg = parse(cs.backgroundColor);
      if (bg && bg.a > 0) {
        layers.push(bg);
        if (bg.a === 1) break;
      }
      node = node.parentElement;
    }
    let out = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) out = composite(layers[i], out);
    return { color: out };
  };

  const selector = (el) => {
    if (el.id) return "#" + el.id;
    const cls = (el.className || "").toString().trim().split(/\s+/).filter(Boolean);
    return el.tagName.toLowerCase() + (cls.length ? "." + cls.slice(0, 3).join(".") : "");
  };

  const findings = [];
  const seen = new Set();

  for (const el of document.querySelectorAll("body *")) {
    // Only elements with their own visible text.
    const own = Array.from(el.childNodes)
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join(" ")
      .trim();
    if (!own) continue;

    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) continue;

    const fg = parse(cs.color);
    if (!fg || fg.a === 0) continue;
    const bgInfo = effectiveBg(el);
    if (bgInfo.unreliable) continue;
    const bg = bgInfo.color;
    const fgComposited = fg.a < 1 ? composite(fg, bg) : fg;

    const size = parseFloat(cs.fontSize);
    const weight = Number(cs.fontWeight) || 400;
    // WCAG large text: >=24px, or >=18.66px when bold (>=700).
    const isLarge = size >= 24 || (size >= 18.66 && weight >= 700);
    const required = isLarge ? 3.0 : 4.5;
    const r = ratio(fgComposited, bg);

    if (r < required) {
      const key = selector(el) + "|" + hex(fgComposited) + "|" + hex(bg);
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push({
        selector: selector(el),
        text: own.slice(0, 45),
        fg: hex(fgComposited),
        bg: hex(bg),
        ratio: Math.round(r * 100) / 100,
        required,
        fontPx: Math.round(size * 10) / 10,
        weight,
      });
    }
  }
  return findings;
};

/* ------------------------------------------------------------------------- */
(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const bySeverity = { critical: [], serious: [], moderate: [], minor: [], unknown: [] };
  const incomplete = [];
  const contrast = [];

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    });
    const page = await context.newPage();

    for (const url of PAGES) {
      await page.goto(BASE + url, { waitUntil: "load" });

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      for (const v of results.violations) {
        const bucket = bySeverity[v.impact] || bySeverity.unknown;
        bucket.push({
          page: url, viewport: viewport.name, id: v.id, help: v.help,
          count: v.nodes.length,
          targets: v.nodes.slice(0, 4).map((n) => n.target.join(" ")),
        });
      }
      for (const inc of results.incomplete) {
        incomplete.push({
          page: url, viewport: viewport.name, id: inc.id, help: inc.help,
          impact: inc.impact || "n/a", count: inc.nodes.length,
          targets: inc.nodes.slice(0, 4).map((n) => n.target.join(" ")),
        });
      }

      for (const f of await page.evaluate(CONTRAST_SWEEP)) {
        contrast.push({ page: url, viewport: viewport.name, ...f });
      }
    }
    await context.close();
  }
  await browser.close();

  /* ----------------------------------------------------------------------- */
  const L = [];
  L.push("# Accessibility audit");
  L.push("");
  L.push(`Generated: ${new Date().toISOString()}`);
  L.push(`Pages: ${PAGES.length} | Viewports: ${VIEWPORTS.map((v) => v.name).join(", ")}`);
  L.push("Ruleset: wcag2a, wcag2aa, wcag21a, wcag21aa");
  L.push("");

  L.push("## 1. Axe findings by severity");
  L.push("");
  L.push("| Severity | Findings | Gate |");
  L.push("| --- | --- | --- |");
  for (const sev of ["critical", "serious", "moderate", "minor"]) {
    const gate = sev === "critical" || sev === "serious" ? "**fails build**" : "reported only";
    L.push(`| ${sev} | ${bySeverity[sev].length} | ${gate} |`);
  }
  L.push("");

  for (const sev of ["critical", "serious", "moderate", "minor"]) {
    const items = bySeverity[sev];
    L.push(`### ${sev} (${items.length})`);
    L.push("");
    if (!items.length) {
      L.push("None.");
    } else {
      // Group identical rule+page pairs for readability.
      const grouped = new Map();
      for (const i of items) {
        const k = `${i.id}|${i.page}`;
        if (!grouped.has(k)) grouped.set(k, { ...i, viewports: new Set() });
        grouped.get(k).viewports.add(i.viewport);
      }
      L.push("| Rule | Page | Viewports | Nodes | Example target |");
      L.push("| --- | --- | --- | --- | --- |");
      for (const g of grouped.values()) {
        L.push(
          `| \`${g.id}\` | ${g.page} | ${[...g.viewports].join(", ")} | ${g.count} | \`${(g.targets[0] || "").slice(0, 60)}\` |`
        );
      }
    }
    L.push("");
  }

  L.push("## 2. Axe incomplete (needs review, not auto-decidable)");
  L.push("");
  L.push(
    "Axe reports these when it cannot resolve the situation on its own, most" +
      " often a colour-contrast check over a semi-transparent or image" +
      " background. They are NOT passes. Section 3 resolves the contrast ones."
  );
  L.push("");
  if (!incomplete.length) {
    L.push("None.");
  } else {
    const grouped = new Map();
    for (const i of incomplete) {
      const k = `${i.id}|${i.page}`;
      if (!grouped.has(k)) grouped.set(k, { ...i, viewports: new Set() });
      grouped.get(k).viewports.add(i.viewport);
    }
    L.push("| Rule | Page | Viewports | Nodes | Example target |");
    L.push("| --- | --- | --- | --- | --- |");
    for (const g of grouped.values()) {
      L.push(
        `| \`${g.id}\` | ${g.page} | ${[...g.viewports].join(", ")} | ${g.count} | \`${(g.targets[0] || "").slice(0, 60)}\` |`
      );
    }
  }
  L.push("");

  L.push("## 3. Computed contrast sweep");
  L.push("");
  L.push(
    "Independent of axe. Alpha-composites every background layer to get the" +
      " real effective colour, then applies the WCAG 2.1 threshold (4.5:1," +
      " or 3:1 for large text). Elements over gradients or background images" +
      " are skipped as genuinely undecidable."
  );
  L.push("");
  if (!contrast.length) {
    L.push("No failures. Every resolvable text/background pair meets WCAG AA.");
  } else {
    const grouped = new Map();
    for (const c of contrast) {
      const k = `${c.selector}|${c.fg}|${c.bg}`;
      if (!grouped.has(k)) grouped.set(k, { ...c, pages: new Set() });
      grouped.get(k).pages.add(c.page);
    }
    L.push("| Selector | Text | Fg | Bg | Ratio | Needs | Pages |");
    L.push("| --- | --- | --- | --- | --- | --- | --- |");
    for (const g of [...grouped.values()].sort((a, b) => a.ratio - b.ratio)) {
      L.push(
        `| \`${g.selector}\` | ${g.text.replace(/\|/g, "/")} | \`${g.fg}\` | \`${g.bg}\` | **${g.ratio}:1** | ${g.required}:1 | ${[...g.pages].join(", ")} |`
      );
    }
  }
  L.push("");

  const reportPath = path.join(OUT_DIR, "a11y-report.md");
  fs.writeFileSync(reportPath, L.join("\n") + "\n");

  console.log(
    `axe: ${bySeverity.critical.length} critical, ${bySeverity.serious.length} serious, ` +
      `${bySeverity.moderate.length} moderate, ${bySeverity.minor.length} minor, ` +
      `${incomplete.length} incomplete`
  );
  console.log(`computed contrast sweep: ${contrast.length} failing pairs`);
  console.log(`report -> build-reports/a11y-report.md`);
})();
