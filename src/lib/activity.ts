export function averageOverLastDays(entries: { data: string; value: number | null }[], days: number): number | null {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const recent = entries.filter((e) => e.value != null && new Date(e.data) >= cutoff);
  if (recent.length === 0) return null;
  const sum = recent.reduce((acc, e) => acc + (e.value as number), 0);
  return Math.round(sum / recent.length);
}
