import { cn } from "@/lib/utils";

export function DefectGauge({ value, size = 132 }: { value: number; size?: number }) {
  const pct = Math.max(0, Math.min(1, value));
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  const level = pct >= 0.66 ? "critical" : pct >= 0.33 ? "warning" : "success";
  const stroke =
    level === "critical"
      ? "var(--color-critical)"
      : level === "warning"
        ? "var(--color-warning)"
        : "var(--color-success)";
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth={10}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: "stroke-dasharray 700ms ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-2xl font-bold text-foreground">
          {Math.round(pct * 100)}%
        </span>
        <span
          className={cn(
            "text-[10px] font-semibold uppercase tracking-wide",
            level === "critical" && "text-critical",
            level === "warning" && "text-warning",
            level === "success" && "text-success",
          )}
        >
          {level === "success" ? "Low risk" : level === "warning" ? "Elevated" : "High risk"}
        </span>
      </div>
    </div>
  );
}