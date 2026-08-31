export interface MapRecord {
  year: number;
  residence: string;
}

export function getMapYearRange(rows: readonly MapRecord[]): { min: number; max: number } {
  if (rows.length === 0) return { min: 1392, max: 1910 };

  let min = rows[0].year;
  let max = rows[0].year;
  for (const row of rows) {
    if (row.year < min) min = row.year;
    if (row.year > max) max = row.year;
  }
  return { min, max };
}

export function summarizeResidencesThroughYear(rows: readonly MapRecord[], periodEnd: number) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const residence = row.residence.trim();
    if (row.year <= periodEnd && residence) {
      counts.set(residence, (counts.get(residence) ?? 0) + 1);
    }
  }

  return [...counts]
    .map(([residence, count]) => ({ residence, count }))
    .sort((a, b) => b.count - a.count || a.residence.localeCompare(b.residence, "ko"));
}
