import type { Severity } from "@/lib/types";

export const severityMeta: Record<
  Severity,
  { label: string; token: string; bg: string; text: string; border: string; dot: string }
> = {
  informational: {
    label: "Informational",
    token: "info",
    bg: "bg-info/10",
    text: "text-info",
    border: "border-info/30",
    dot: "bg-info",
  },
  warning: {
    label: "Warning",
    token: "warning",
    bg: "bg-warning/10",
    text: "text-warning",
    border: "border-warning/30",
    dot: "bg-warning",
  },
  critical: {
    label: "Critical",
    token: "critical",
    bg: "bg-critical/10",
    text: "text-critical",
    border: "border-critical/30",
    dot: "bg-critical",
  },
};

export const severityRank: Record<Severity, number> = {
  critical: 0,
  warning: 1,
  informational: 2,
};