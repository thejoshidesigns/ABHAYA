/* =========================================================================
   lighthouse-live.mjs - Lighthouse against the deployed production site

   Usage: npm run lighthouse:live -- https://www.abhayabh.com

   Refuses to run without an explicit https base URL, so it can never be
   pointed at a site by accident. Read-only: Lighthouse loads pages, it does
   not submit forms.

   STATUS: PENDING. Do not run this against abhayabh.com until the new site is
   confirmed deployed there; until then the domain serves the previous site and
   the scores would describe the wrong build.
   ========================================================================= */
import { runLighthouse, writeReport, reportBlocked } from "./lighthouse-run.mjs";

const arg = process.argv[2];
if (!arg) {
  console.error(
    "lighthouse-live: a base URL is required.\n" +
      "  Usage: npm run lighthouse:live -- https://www.abhayabh.com\n" +
      "  Only run this once the new site is confirmed live at that domain."
  );
  process.exit(1);
}

let baseUrl;
try {
  baseUrl = new URL(arg);
} catch {
  console.error(`lighthouse-live: "${arg}" is not a valid URL.`);
  process.exit(1);
}
if (baseUrl.protocol !== "https:") {
  console.error("lighthouse-live: the base URL must use https://.");
  process.exit(1);
}

console.log(`Running Lighthouse (mobile + desktop) against ${baseUrl.origin}\n`);
try {
  const rows = await runLighthouse({ baseUrl: baseUrl.origin });
  writeReport(rows, {
    title: "Live Lighthouse - Abhaya Behavioral Health",
    baseUrl: baseUrl.origin,
    file: "lighthouse-live.md",
  });
} catch (err) {
  if (err.blocked) {
    reportBlocked(err);
    process.exit(1);
  }
  throw err;
}
