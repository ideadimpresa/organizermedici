export interface WeekSection {
  label: string;
  content: string;
}

const WEEK_HEADING = /^[ \t]*(settimana\s+\d+[^\n]*)$/gim;

// Detects explicit "Settimana N" headings inside a single PDF's extracted
// text and splits the content accordingly. Returns null when fewer than 2
// headings are found (the PDF isn't laid out week-by-week), so callers fall
// back to showing the whole text as one block — this is best-effort, same
// caveat as the BIA field extraction: no real sample plan to validate the
// heading format against.
export function splitByWeekHeadings(text: string): WeekSection[] | null {
  const matches = [...text.matchAll(WEEK_HEADING)];
  if (matches.length < 2) return null;

  const sections: WeekSection[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index! + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : text.length;
    sections.push({ label: matches[i][1].trim(), content: text.slice(start, end).trim() });
  }
  return sections;
}

export interface PlanLike {
  data_inizio: string | null;
  data_fine: string | null;
}

// Sorts plans chronologically (undated ones last), so a sequence of
// per-week uploads reads in order.
export function sortPlansByDate<T extends PlanLike>(plans: T[]): T[] {
  return [...plans].sort((a, b) => {
    if (!a.data_inizio && !b.data_inizio) return 0;
    if (!a.data_inizio) return 1;
    if (!b.data_inizio) return -1;
    return a.data_inizio.localeCompare(b.data_inizio);
  });
}

// Human label for the date range a plan covers, e.g. "Settimana dal 3 al 9 marzo".
export function labelPlanRange(plan: PlanLike): string | null {
  if (!plan.data_inizio && !plan.data_fine) return null;
  const fmt = (iso: string) => new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "short" });

  if (plan.data_inizio && plan.data_fine) {
    const days = Math.round((new Date(plan.data_fine).getTime() - new Date(plan.data_inizio).getTime()) / 86400000);
    const prefix = days <= 10 ? "Settimana" : "Periodo";
    return `${prefix} dal ${fmt(plan.data_inizio)} al ${fmt(plan.data_fine)}`;
  }
  return `Dal ${fmt(plan.data_inizio ?? plan.data_fine!)}`;
}
