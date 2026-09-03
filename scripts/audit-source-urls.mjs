import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = path.join(root, "prisma", "clan-research.json");
const dataset = JSON.parse(fs.readFileSync(file, "utf8"));
const evidence = new Map();
for (const record of dataset.records ?? []) {
  for (const location of record.locations ?? []) {
    if (location.status !== "verified") continue;
    for (const item of location.evidence ?? []) {
      evidence.set(item.url, { location: location.id, title: item.title });
    }
  }
}

const results = [];
for (const [url, context] of evidence) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  let status = 0;
  let error = "";
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "spear-ex-source-audit/1.0" },
    });
    status = response.status;
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause);
  } finally {
    clearTimeout(timer);
  }
  results.push({ ...context, url, status, reachable: status >= 200 && status < 400, error });
}

const failed = results.filter((result) => !result.reachable);
console.log(JSON.stringify({ checked: results.length, failed: failed.length, results }, null, 2));
if (failed.length) process.exitCode = 1;
