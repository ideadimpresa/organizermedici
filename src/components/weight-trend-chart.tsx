const WIDTH = 480;
const HEIGHT = 140;
const PAD_X = 12;
const PAD_Y = 16;

export function WeightTrendChart({
  points,
  label,
  unit,
}: {
  points: { data: string; value: number }[];
  label: string;
  unit: string;
}) {
  if (points.length === 0) {
    return <p className="text-sm text-secondary">Nessun dato disponibile per {label.toLowerCase()}.</p>;
  }

  if (points.length === 1) {
    return (
      <div>
        <p className="text-2xl font-bold text-navy">
          {points[0].value} <span className="text-base font-medium text-secondary">{unit}</span>
        </p>
        <p className="text-sm text-secondary">
          {label} rilevato il {new Date(points[0].data).toLocaleDateString("it-IT")}
        </p>
      </div>
    );
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const xStep = (WIDTH - PAD_X * 2) / (points.length - 1);
  const coords = points.map((p, i) => ({
    x: PAD_X + i * xStep,
    y: PAD_Y + (HEIGHT - PAD_Y * 2) * (1 - (p.value - min) / range),
    ...p,
  }));

  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const delta = last.value - prev.value;

  return (
    <div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-navy">
          {last.value} <span className="text-base font-medium text-secondary">{unit}</span>
        </p>
        {delta !== 0 && (
          <span className="text-sm font-medium text-muted">
            {delta > 0 ? "+" : ""}
            {delta.toFixed(1)} {unit} dall&apos;ultima rilevazione
          </span>
        )}
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="mt-2 h-32 w-full" preserveAspectRatio="none">
        <line x1={PAD_X} y1={HEIGHT - PAD_Y} x2={WIDTH - PAD_X} y2={HEIGHT - PAD_Y} stroke="var(--color-border)" strokeWidth={1} />
        <path d={path} fill="none" stroke="var(--color-teal)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c) => (
          <circle key={c.data} cx={c.x} cy={c.y} r={3} fill="var(--color-teal)">
            <title>
              {new Date(c.data).toLocaleDateString("it-IT")}: {c.value} {unit}
            </title>
          </circle>
        ))}
      </svg>
      <div className="flex justify-between text-xs text-muted">
        <span>{new Date(points[0].data).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}</span>
        <span>{new Date(last.data).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}</span>
      </div>
    </div>
  );
}
