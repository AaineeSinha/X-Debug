// Server-only X-Debug engine helpers.
// Layer 1 (expert system) + Layer 2 (ML defect scoring) + Layer 3 (NLP narrative)
// are prompted through a single LLM pass that emulates a CodeBERT/LangChain pipeline.
import type {
  AnalysisResult,
  CausalGraph,
  DebugLanguage,
  DiffLine,
  Finding,
  RankedFix,
  Severity,
} from "./types";

const SEVERITIES: Severity[] = ["informational", "warning", "critical"];

export function buildSystemPrompt(): string {
  return [
    "You are X-Debug, a reverse-debugging engine for Python and C only.",
    "You run three layers on submitted source code:",
    "Layer 1 (Expert System): rule-based static analysis for syntax/structural anomalies",
    "(unused variables, null/dangling pointers, uninitialized memory, insecure input like gets/scanf/eval, buffer overflows, resource leaks, off-by-one).",
    "Layer 2 (ML Analysis): assign a CodeBERT-style defect probability (0..1) to the file and each finding.",
    "Layer 3 (NLP Explanation): a clear human-readable narrative for every detected bug.",
    "You also produce a corrected version of the code and a causal graph of cause-effect relationships",
    "between variables, functions and control structures.",
    "Respond with STRICT minified JSON ONLY, no markdown, no commentary.",
  ].join(" ");
}

export function buildUserPrompt(language: DebugLanguage, code: string): string {
  return `Analyze this ${language.toUpperCase()} code and return JSON with this exact shape:
{
  "summary": string,
  "defectProbability": number (0..1),
  "findings": [{
    "severity": "informational"|"warning"|"critical",
    "layer": "expert-system"|"ml-analysis"|"nlp-explanation",
    "title": string,
    "line": number,
    "summary": string,
    "explanation": string,
    "defectProbability": number (0..1)
  }],
  "modifiedCode": string (the full corrected source),
  "causalGraph": {
    "nodes": [{"id": string, "label": string, "kind": "variable"|"function"|"control"|"io"|"bug", "severity"?: string, "detail"?: string}],
    "edges": [{"source": string, "target": string, "relation": string}]
  },
  "rankedFixes": [{
    "title": string,
    "rationale": string,
    "modifiedCode": string (full corrected source for this alternative),
    "confidence": number (0..1),
    "efficiency": number (0..1),
    "quality": number (0..1),
    "limitations": [string] (1-3 concrete conditions/edge cases under which THIS fix could still fail, break, or be the wrong choice)
  }]
}
Provide 2-3 alternative rankedFixes ordered best-first. Build a causalGraph with 4-9 nodes that traces how the bug propagates (variable -> function -> control -> bug). Keep node ids short and referenced by edges.
CODE:
\`\`\`${language}
${code}
\`\`\``;
}

function clamp01(n: unknown): number {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return Math.max(0, Math.min(1, v));
}

function coerceSeverity(s: unknown): Severity {
  return SEVERITIES.includes(s as Severity) ? (s as Severity) : "informational";
}

/** LCS-based line diff between original and modified source. */
export function computeDiff(original: string, modified: string): DiffLine[] {
  const a = original.replace(/\r\n/g, "\n").split("\n");
  const b = modified.replace(/\r\n/g, "\n").split("\n");
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ type: "unchanged", originalLine: i + 1, modifiedLine: j + 1, content: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: "removed", originalLine: i + 1, modifiedLine: null, content: a[i] });
      i++;
    } else {
      out.push({ type: "added", originalLine: null, modifiedLine: j + 1, content: b[j] });
      j++;
    }
  }
  while (i < n) out.push({ type: "removed", originalLine: i + 1, modifiedLine: null, content: a[i++] });
  while (j < m) out.push({ type: "added", originalLine: null, modifiedLine: j + 1, content: b[j++] });
  return out;
}

let idCounter = 0;
const nextId = (prefix: string) => `${prefix}-${(idCounter++).toString(36)}-${Date.now().toString(36)}`;

/** Turn a raw LLM object into a fully-formed, safe AnalysisResult. */
export function normalizeAnalysis(raw: unknown, originalCode: string): AnalysisResult {
  const obj = (raw ?? {}) as Record<string, unknown>;

  const findings: Finding[] = Array.isArray(obj.findings)
    ? (obj.findings as Record<string, unknown>[]).map((f) => ({
        id: nextId("find"),
        severity: coerceSeverity(f.severity),
        layer:
          f.layer === "ml-analysis" || f.layer === "nlp-explanation"
            ? (f.layer as Finding["layer"])
            : "expert-system",
        title: String(f.title ?? "Issue detected"),
        line: typeof f.line === "number" ? f.line : null,
        summary: String(f.summary ?? ""),
        explanation: String(f.explanation ?? f.summary ?? ""),
        defectProbability: clamp01(f.defectProbability),
      }))
    : [];

  const rawGraph = (obj.causalGraph ?? {}) as Record<string, unknown>;
  const causalGraph: CausalGraph = {
    nodes: Array.isArray(rawGraph.nodes)
      ? (rawGraph.nodes as Record<string, unknown>[]).map((nd, idx) => ({
          id: String(nd.id ?? `n${idx}`),
          label: String(nd.label ?? nd.id ?? `Node ${idx}`),
          kind:
            (["variable", "function", "control", "io", "bug"] as const).find((k) => k === nd.kind) ??
            "variable",
          severity: nd.severity ? coerceSeverity(nd.severity) : undefined,
          detail: nd.detail ? String(nd.detail) : undefined,
        }))
      : [],
    edges: Array.isArray(rawGraph.edges)
      ? (rawGraph.edges as Record<string, unknown>[]).map((e) => ({
          source: String(e.source ?? ""),
          target: String(e.target ?? ""),
          relation: String(e.relation ?? "affects"),
        }))
      : [],
  };

  const primaryModified = String(obj.modifiedCode ?? originalCode);

  const rankedFixes: RankedFix[] = Array.isArray(obj.rankedFixes)
    ? (obj.rankedFixes as Record<string, unknown>[]).map((fx) => {
        const modifiedCode = String(fx.modifiedCode ?? primaryModified);
        return {
          id: nextId("fix"),
          title: String(fx.title ?? "Suggested fix"),
          rationale: String(fx.rationale ?? ""),
          modifiedCode,
          diffLines: computeDiff(originalCode, modifiedCode),
          confidence: clamp01(fx.confidence),
          efficiency: clamp01(fx.efficiency),
          quality: clamp01(fx.quality),
          limitations: Array.isArray(fx.limitations)
            ? (fx.limitations as unknown[]).map((l) => String(l)).filter(Boolean).slice(0, 4)
            : [],
        };
      })
    : [];

  // Rank best-first by weighted composite score.
  rankedFixes.sort(
    (a, b) =>
      b.confidence * 0.5 + b.quality * 0.3 + b.efficiency * 0.2 -
      (a.confidence * 0.5 + a.quality * 0.3 + a.efficiency * 0.2),
  );

  const modifiedCode = rankedFixes[0]?.modifiedCode ?? primaryModified;

  return {
    originalCode,
    modifiedCode,
    diffLines: computeDiff(originalCode, modifiedCode),
    causalGraph,
    rankedFixes,
    findings,
    defectProbability: clamp01(obj.defectProbability),
    summary: String(obj.summary ?? "Analysis complete."),
  };
}

/** Best-effort extraction of a JSON object from a model response. */
export function parseJsonLoose(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}