import fs from "node:fs";
import { resolveBonGwan, resolveResidence } from "../src/lib/historical-places/resolve-place";

interface RealData {
  clans: Array<{ bonGwan: string }>;
  persons: Array<{ residence: string }>;
}

interface AuditEntry {
  value: string;
  count: number;
  status: "resolved" | "ambiguous" | "unknown";
}

const realDataUrl = new URL("../prisma/real-data.json", import.meta.url);
if (!fs.existsSync(realDataUrl)) {
  console.log(JSON.stringify({ status: "skipped", reason: "prisma/real-data.json is an external, rights-gated dataset" }, null, 2));
  process.exit(0);
}
const data = JSON.parse(fs.readFileSync(realDataUrl, "utf8")) as RealData;

function frequencies(values: readonly string[]): Map<string, number> {
  const result = new Map<string, number>();
  for (const value of values) result.set(value, (result.get(value) ?? 0) + 1);
  return result;
}

function summarize(
  counts: ReadonlyMap<string, number>,
  resolve: (value: string) => { status: "resolved" | "ambiguous" | "unknown" },
) {
  const entries: AuditEntry[] = [...counts].map(([value, count]) => ({ value, count, status: resolve(value).status }));
  const byStatus = (status: AuditEntry["status"]) => entries.filter((entry) => entry.status === status);
  const totalRecords = entries.reduce((sum, entry) => sum + entry.count, 0);

  return {
    unique: entries.length,
    totalRecords,
    status: Object.fromEntries(
      (["resolved", "ambiguous", "unknown"] as const).map((status) => {
        const selected = byStatus(status);
        return [status, {
          unique: selected.length,
          records: selected.reduce((sum, entry) => sum + entry.count, 0),
          percent: Number(((selected.reduce((sum, entry) => sum + entry.count, 0) / totalRecords) * 100).toFixed(2)),
        }];
      }),
    ),
    unresolvedTop: entries
      .filter((entry) => entry.status !== "resolved")
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, "ko"))
      .slice(0, 50),
  };
}

const report = {
  generatedAt: new Date().toISOString(),
  bonGwan: summarize(frequencies(data.clans.map((clan) => clan.bonGwan)), resolveBonGwan),
  residence: summarize(frequencies(data.persons.map((person) => person.residence)), resolveResidence),
};

console.log(JSON.stringify(report, null, 2));
