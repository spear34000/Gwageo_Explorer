import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const baseUrl = process.env.AUDIT_BASE_URL ?? "http://localhost:3000";
const dataset = JSON.parse(fs.readFileSync(path.join(root, "prisma", "clan-research.json"), "utf8"));
const verified = dataset.records.filter((record) => record.status === "verified");
const results = [];

for (const record of verified) {
  const url = `${baseUrl}/clans/${encodeURIComponent(record.clanId)}`;
  let status = 0;
  let shown = -1;
  let hasAttribution = false;
  let error = "";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { "user-agent": "spear-ex-route-audit/1.0" } });
    status = response.status;
    const html = await response.text();
    const match = html.match(/표시 <!-- -->(\d+)<!-- -->곳/);
    shown = match ? Number(match[1]) : -1;
    hasAttribution = html.includes("OpenStreetMap");
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause);
  } finally {
    clearTimeout(timer);
  }
  results.push({ clanId: record.clanId, status, shown, hasAttribution, valid: status === 200 && shown > 0 && hasAttribution, error });
}

const failed = results.filter((result) => !result.valid);
console.log(JSON.stringify({ checked: results.length, failed: failed.length, results }, null, 2));
if (failed.length) process.exitCode = 1;
