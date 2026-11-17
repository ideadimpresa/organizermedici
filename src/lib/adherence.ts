const ADERENZA_SCORE: Record<string, number> = {
  Ottima: 100,
  Buona: 75,
  "Così così": 50,
  Difficile: 25,
};

// Consecutive days (counting back from today, or from yesterday if today
// hasn't been logged yet so the streak doesn't drop to zero before the
// patient has had a chance to write today's entry) with at least one diario
// entry.
export function computeStreakDays(entryDates: string[]): number {
  const days = new Set(entryDates.map((d) => d.slice(0, 10)));
  const toKey = (d: Date) => d.toISOString().slice(0, 10);

  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(toKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (days.has(toKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// Average of the last 7 days' self-reported aderenza (diario "giornata"
// entries), mapped to a 0-100 score. Null when there's nothing recent to
// average.
export function computeWeeklyAdherence(entries: { data: string; aderenza: string | null }[]): number | null {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recent = entries.filter((e) => e.aderenza && new Date(e.data) >= sevenDaysAgo);
  if (recent.length === 0) return null;

  const scores = recent.map((e) => ADERENZA_SCORE[e.aderenza!] ?? 50);
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}
