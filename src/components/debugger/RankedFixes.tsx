import type { RankedFix } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Sparkles, Check } from "lucide-react";

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1">
      <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
        <span>{label}</span>
        <span>{Math.round(value * 100)}</span>
      </div>
      <div className="clay-inset h-1.5 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
    </div>
  );
}

export function RankedFixes({
  fixes,
  activeId,
  onPreview,
}: {
  fixes: RankedFix[];
  activeId: string | null;
  onPreview: (fix: RankedFix) => void;
}) {
  if (fixes.length === 0) {
    return <p className="text-sm text-muted-foreground">No alternative fixes generated.</p>;
  }
  return (
    <div className="space-y-3">
      {fixes.map((fix, i) => {
        const active = fix.id === activeId;
        return (
          <button
            key={fix.id}
            onClick={() => onPreview(fix)}
            className={cn(
              "clay-sm w-full rounded-2xl border bg-card p-4 text-left transition-all hover:-translate-y-0.5",
              active ? "border-primary clay-glow" : "border-border/60",
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                  i === 0 ? "bg-success/20 text-success" : "bg-muted text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
              <span className="font-medium text-foreground">{fix.title}</span>
              {i === 0 && (
                <span className="ml-auto flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                  <Sparkles className="h-3 w-3" /> Recommended
                </span>
              )}
              {active && i !== 0 && (
                <Check className="ml-auto h-4 w-4 text-primary" />
              )}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{fix.rationale}</p>
            <div className="mt-3 flex gap-4">
              <Meter label="Confidence" value={fix.confidence} />
              <Meter label="Efficiency" value={fix.efficiency} />
              <Meter label="Quality" value={fix.quality} />
            </div>
          </button>
        );
      })}
    </div>
  );
}