import { readFile, writeFile } from "node:fs/promises";

type Person = { residence?: string };
async function main() {
const raw = await readFile("prisma/real-data.json", "utf8");
const data = JSON.parse(raw) as { persons: Person[] };
const counts = new Map<string, number>();
for (const person of data.persons) {
  const value = person.residence?.trim();
  if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
}
const rows = [...counts].sort((a, b) => b[1] - a[1]).map(([residence, count]) => ({ residence, count }));
await writeFile(".tmp-unmapped-places.json", JSON.stringify(rows, null, 2), "utf8");
console.log(`exported ${rows.length} unique residences`);
}
void main();
