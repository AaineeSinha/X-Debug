import { useState } from "react";
import { ChevronDown, Info, AlertTriangle, ShieldAlert, BrainCircuit } from "lucide-react";
import type { Finding, Severity } from "@/lib/types";
import { severityMeta, severityRank } from "./severity";
import { cn } from "@/lib/utils";

const icons: Record<Severity, typeof Info> = {
  informational: Info,
  warning: AlertTriangle,
  critical: ShieldAlert,
};

function FindingCard({ finding }: { finding: Finding }) {
  const [open, setOpen] = useState(false);
  const meta = severityMeta[finding.severity];
  return (
    <div className={cn("clay-sm rounded-2xl border bg-card p-4", meta.border)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div className="flex items-start gap-3">
          <span className={cn("mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full", meta.dot)} />
          <div>
            <p className="font-medium text-foreground">{finding.title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{finding.summary}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {finding.line != null && (
            <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
              L{finding.line}
            </span>
          )}
          <ChevronDown
            className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
          />
        </div>
      </button>
      {open && (
        <div className="mt-3 space-y-3 border-t border-border/60 pt-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <BrainCircuit className="h-3.5 w-3.5 text-primary" />
            <span>NLP explanation</span>
            <span className="ml-auto">
              Defect prob:{" "}
              <span className={meta.text}>{Math.round(finding.defectProbability * 100)}%</span>
            </span>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">{finding.explanation}</p>
        </div>
      )}
    </div>
  );
}

export function ResultPanel({ findings }: { findings: Finding[] }) {
  const groups = (["critical", "warning", "informational"] as Severity[]).map((sev) => ({
    sev,
    items: findings
      .filter((f) => f.severity === sev)
      .sort((a, b) => b.defectProbability - a.defectProbability),
  }));

  return (
    <div className="space-y-6">
      {groups.map(({ sev, items }) => {
        if (items.length === 0) return null;
        const meta = severityMeta[sev];
        const Icon = icons[sev];
        return (
          <Collapsible key={sev} defaultOpen={sev !== "informational"} meta={meta} icon={Icon} count={items.length}>
            <div className="space-y-3">
              {items.map((f) => (
                <FindingCard key={f.id} finding={f} />
              ))}
            </div>
          </Collapsible>
        );
      })}
      {findings.length === 0 && (
        <p className="text-sm text-muted-foreground">No issues detected. Clean code! 🎉</p>
      )}
    </div>
  );
}

function Collapsible({
  defaultOpen,
  meta,
  icon: Icon,
  count,
  children,
}: {
  defaultOpen: boolean;
  meta: (typeof severityMeta)[Severity];
  icon: typeof Info;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold",
          meta.bg,
          meta.text,
        )}
      >
        <Icon className="h-4 w-4" />
        {meta.label}
        <span className="rounded-full bg-background/40 px-2 py-0.5 text-xs">{count}</span>
        <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}