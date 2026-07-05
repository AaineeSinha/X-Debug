import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { AnalysisResult, DebugLanguage, RankedFix } from "@/lib/types";

/**
 * SandboxProvider manages the dual code state of the Git-Branch Simulator.
 * - `liveCode`   = the committed / trusted source ("main" branch).
 * - `proposedCode` = an AI fix staged in the safe sandbox ("proposed" branch).
 * AI fixes are NEVER applied directly; the user must `commit()` to merge them.
 */
interface SandboxContextValue {
  language: DebugLanguage;
  setLanguage: (l: DebugLanguage) => void;

  liveCode: string;
  setLiveCode: (code: string) => void;

  proposedCode: string | null;
  proposedFix: RankedFix | null;
  /** Stage a fix into the sandbox without touching live code. */
  stageFix: (fix: RankedFix) => void;
  /** Merge the staged fix into live code (the "Commit Change" action). */
  commit: () => void;
  /** Discard the staged fix, keeping live code untouched. */
  discard: () => void;

  analysis: AnalysisResult | null;
  setAnalysis: (a: AnalysisResult | null) => void;

  hasPendingChange: boolean;
  reset: () => void;
}

const SandboxContext = createContext<SandboxContextValue | undefined>(undefined);

const DEFAULT_PY = `def read_config(path):
    f = open(path)
    data = f.read()
    config = eval(data)  # insecure: evaluates arbitrary input
    total = 0
    for i in range(len(config)):
        total += config[i]
    return total
`;

export function SandboxProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<DebugLanguage>("python");
  const [liveCode, setLiveCode] = useState<string>(DEFAULT_PY);
  const [proposedFix, setProposedFix] = useState<RankedFix | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const stageFix = useCallback((fix: RankedFix) => setProposedFix(fix), []);
  const discard = useCallback(() => setProposedFix(null), []);

  const commit = useCallback(() => {
    setProposedFix((fix) => {
      if (fix) setLiveCode(fix.modifiedCode);
      return null;
    });
  }, []);

  const reset = useCallback(() => {
    setProposedFix(null);
    setAnalysis(null);
  }, []);

  const value = useMemo<SandboxContextValue>(
    () => ({
      language,
      setLanguage,
      liveCode,
      setLiveCode,
      proposedCode: proposedFix?.modifiedCode ?? null,
      proposedFix,
      stageFix,
      commit,
      discard,
      analysis,
      setAnalysis,
      hasPendingChange: proposedFix !== null,
      reset,
    }),
    [language, liveCode, proposedFix, analysis, stageFix, commit, discard, reset],
  );

  return <SandboxContext.Provider value={value}>{children}</SandboxContext.Provider>;
}

export function useSandbox() {
  const ctx = useContext(SandboxContext);
  if (!ctx) throw new Error("useSandbox must be used within SandboxProvider");
  return ctx;
}