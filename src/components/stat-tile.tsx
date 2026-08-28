import { Sparkline } from "@/components/sparkline";

export function StatTile({
  label,
  value,
  unit,
  subtext,
  trend,
}: {
  label: string;
  value: string;
  unit?: string;
  subtext?: string;
  trend?: number[];
}) {
  return (
    <div className="rounded-card border border-border border-l-4 border-l-teal bg-surface p-5 shadow-card">
      <p className="text-sm font-medium text-secondary">{label}</p>
      <p className="mt-1 text-3xl font-bold text-navy">
        {value}
        {unit && <span className="ml-1 text-base font-medium text-secondary">{unit}</span>}
      </p>
      {subtext && <p className="mt-1 text-sm text-secondary">{subtext}</p>}
      {trend && trend.length > 1 && (
        <div className="mt-3">
          <Sparkline values={trend} />
        </div>
      )}
    </div>
  );
}
