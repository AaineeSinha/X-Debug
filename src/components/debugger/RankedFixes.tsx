import type { RankedFix } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Sparkles, Check, Eye, Replace, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  onApply,
  applyingId,
}: {
  fixes: RankedFix[];
  activeId: string | null;
  onPreview: (fix: RankedFix) => void;
  onApply: (fix: RankedFix) => void;
  applyingId: string | null;
}) {
  if (fixes.length === 0) {
    return <p className="text-sm text-muted-foreground">No alternative fixes generated.</p>;
  }
  return (
    <div className="space-y-3">
      {fixes.map((fix, i) => {
        const active = fix.id === activeId;
        const applying = fix.id === applyingId;
        return (
          <div
            key={fix.id}
            className={cn(
              "clay-sm w-full rounded-2xl border bg-card p-4 text-left transition-all",
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

            {fix.limitations.length > 0 && (
              <div className="clay-inset mt-3 rounded-xl bg-warning/5 p-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-warning">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  When this may not work
                </div>
                <ul className="space-y-1">
                  {fix.limitations.map((lim, li) => (
                    <li key={li} className="flex gap-1.5 text-xs text-muted-foreground">
                      <span className="mt-0.5 text-warning">•</span>
                      <span>{lim}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="clay"
                size="sm"
                onClick={() => onPreview(fix)}
                disabled={applyingId !== null}
              >
                <Eye className="h-4 w-4" /> {active ? "Previewing" : "Preview diff"}
              </Button>
              <Button
                type="button"
                variant="hero"
                size="sm"
                onClick={() => onApply(fix)}
                disabled={applyingId !== null}
              >
                <Replace className="h-4 w-4" />
                {applying ? "Replacing & re-running…" : "Replace with solution"}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}