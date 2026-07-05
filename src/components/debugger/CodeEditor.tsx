import { useMemo } from "react";
import type { DebugLanguage } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  minRows = 14,
}: {
  value: string;
  onChange?: (v: string) => void;
  language: DebugLanguage;
  readOnly?: boolean;
  minRows?: number;
}) {
  const lineCount = useMemo(() => value.split("\n").length, [value]);
  return (
    <div className="clay-inset overflow-hidden rounded-2xl bg-[oklch(0.17_0.012_265)]">
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2">
        <span className="h-3 w-3 rounded-full bg-critical/70" />
        <span className="h-3 w-3 rounded-full bg-warning/70" />
        <span className="h-3 w-3 rounded-full bg-success/70" />
        <span className="ml-2 font-mono text-xs text-muted-foreground">
          main.{language === "python" ? "py" : "c"}
        </span>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground/60">
          {lineCount} lines
        </span>
      </div>
      <div className="flex">
        <div
          aria-hidden
          className="select-none border-r border-border/40 py-3 pr-2 pl-3 text-right font-mono text-[12.5px] leading-6 text-muted-foreground/40"
        >
          {Array.from({ length: Math.max(lineCount, minRows) }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
          spellCheck={false}
          rows={Math.max(lineCount, minRows)}
          className={cn(
            "w-full resize-none bg-transparent p-3 font-mono text-[12.5px] leading-6 text-foreground/90 outline-none",
            readOnly && "cursor-default",
          )}
        />
      </div>
    </div>
  );
}