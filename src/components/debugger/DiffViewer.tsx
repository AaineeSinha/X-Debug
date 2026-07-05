import type { DiffLine } from "@/lib/types";
import { cn } from "@/lib/utils";

function Pane({
  title,
  side,
  lines,
  badgeClass,
}: {
  title: string;
  side: "original" | "modified";
  lines: DiffLine[];
  badgeClass: string;
}) {
  const visible = lines.filter((l) =>
    side === "original" ? l.type !== "added" : l.type !== "removed",
  );
  return (
    <div className="clay-inset overflow-hidden rounded-2xl bg-[oklch(0.18_0.012_265)]">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
        <span className="font-mono text-xs font-medium text-muted-foreground">{title}</span>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", badgeClass)}>
          {side === "original" ? "main" : "proposed"}
        </span>
      </div>
      <pre className="max-h-[420px] overflow-auto p-0 text-[12.5px] leading-6">
        <code className="block font-mono">
          {visible.map((l, i) => {
            const changed =
              (side === "original" && l.type === "removed") ||
              (side === "modified" && l.type === "added");
            const num = side === "original" ? l.originalLine : l.modifiedLine;
            return (
              <div
                key={i}
                className={cn(
                  "flex px-2",
                  changed && side === "original" && "bg-diff-remove-bg",
                  changed && side === "modified" && "bg-diff-add-bg",
                )}
              >
                <span className="mr-3 w-8 shrink-0 select-none text-right text-muted-foreground/50">
                  {num ?? ""}
                </span>
                <span
                  className={cn(
                    "mr-2 w-3 shrink-0 select-none font-bold",
                    changed && side === "original" && "text-diff-remove",
                    changed && side === "modified" && "text-diff-add",
                  )}
                >
                  {changed ? (side === "original" ? "-" : "+") : ""}
                </span>
                <span className="whitespace-pre text-foreground/90">{l.content || " "}</span>
              </div>
            );
          })}
        </code>
      </pre>
    </div>
  );
}

export function DiffViewer({ diffLines }: { diffLines: DiffLine[] }) {
  const added = diffLines.filter((l) => l.type === "added").length;
  const removed = diffLines.filter((l) => l.type === "removed").length;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs">
        <span className="text-diff-add">+{added} additions</span>
        <span className="text-diff-remove">-{removed} deletions</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Pane
          title="Live code"
          side="original"
          lines={diffLines}
          badgeClass="bg-diff-remove-bg text-diff-remove"
        />
        <Pane
          title="Proposed fix"
          side="modified"
          lines={diffLines}
          badgeClass="bg-diff-add-bg text-diff-add"
        />
      </div>
    </div>
  );
}