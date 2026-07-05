// Shared domain types for the X-Debug engine.
// The AI service returns a JSON payload matching `AnalysisResult`.

export type Severity = "informational" | "warning" | "critical";
export type DebugLanguage = "python" | "c";

export interface DiffLine {
  type: "added" | "removed" | "unchanged";
  originalLine: number | null;
  modifiedLine: number | null;
  content: string;
}

export interface Finding {
  id: string;
  severity: Severity;
  layer: "expert-system" | "ml-analysis" | "nlp-explanation";
  title: string;
  line?: number | null;
  summary: string;
  explanation: string;
  defectProbability: number;
}

export interface CausalNode {
  id: string;
  label: string;
  kind: "variable" | "function" | "control" | "io" | "bug";
  severity?: Severity;
  detail?: string;
}

export interface CausalEdge {
  source: string;
  target: string;
  relation: string;
}

export interface CausalGraph {
  nodes: CausalNode[];
  edges: CausalEdge[];
}

export interface RankedFix {
  id: string;
  title: string;
  rationale: string;
  modifiedCode: string;
  diffLines: DiffLine[];
  confidence: number;
  efficiency: number;
  quality: number;
}

export interface AnalysisResult {
  originalCode: string;
  modifiedCode: string;
  diffLines: DiffLine[];
  causalGraph: CausalGraph;
  rankedFixes: RankedFix[];
  findings: Finding[];
  defectProbability: number;
  summary: string;
}