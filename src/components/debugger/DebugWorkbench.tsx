import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Play,
  Loader2,
  GitCommitHorizontal,
  Undo2,
  Save,
  ShieldAlert,
  AlertTriangle,
  Info,
  GitBranch,
  ListOrdered,
  FileCode2,
} from "lucide-react";
import { useSandbox } from "@/contexts/SandboxProvider";
import { analyzeCode } from "@/lib/analyze.functions";
import { supabase } from "@/integrations/supabase/client";
import type { DebugLanguage, RankedFix } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "./CodeEditor";
import { DefectGauge } from "./DefectGauge";
import { ResultPanel } from "./ResultPanel";
import { CausalGraph } from "./CausalGraph";
import { RankedFixes } from "./RankedFixes";
import { DiffViewer } from "./DiffViewer";

const SAMPLES: Record<DebugLanguage, string> = {
  python: `def read_config(path):
    f = open(path)
    data = f.read()
    config = eval(data)  # insecure: evaluates arbitrary input
    total = 0
    for i in range(len(config)):
        total += config[i]
    return total
`,
  c: `#include <stdio.h>
#include <string.h>

int main() {
    char buffer[8];
    char *name;
    gets(name);            /* undefined: name is uninitialized + gets is unsafe */
    strcpy(buffer, name);  /* possible buffer overflow */
    printf("Hello %s", buffer);
    return 0;
}
`,
};

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof Info;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="clay rounded-4xl bg-card p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="clay-sm flex h-9 w-9 items-center justify-center rounded-xl bg-card">
          <Icon className="h-4.5 w-4.5 text-primary" />
        </span>
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function DebugWorkbench() {
  const {
    language,
    setLanguage,
    liveCode,
    setLiveCode,
    analysis,
    setAnalysis,
    proposedFix,
    stageFix,
    commit,
    discard,
    hasPendingChange,
    reset,
  } = useSandbox();
  const runAnalyze = useServerFn(analyzeCode);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const counts = {
    critical: analysis?.findings.filter((f) => f.severity === "critical").length ?? 0,
    warning: analysis?.findings.filter((f) => f.severity === "warning").length ?? 0,
    informational: analysis?.findings.filter((f) => f.severity === "informational").length ?? 0,
  };

  const runAnalysisFor = async (code: string, clearAll: boolean) => {
    if (!code.trim()) {
      toast.error("Add some code to analyze first.");
      return;
    }
    setRunning(true);
    if (clearAll) reset();
    else discard();
    try {
      const result = await runAnalyze({ data: { language, code } });
      setAnalysis(result);
      toast.success(`Analysis complete — ${result.findings.length} finding(s).`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setRunning(false);
    }
  };

  const handleRun = () => runAnalysisFor(liveCode, true);

  const handleApply = async (fix: RankedFix) => {
    setApplyingId(fix.id);
    setLiveCode(fix.modifiedCode);
    try {
      toast.success(`Applied “${fix.title}” — re-analyzing…`);
      await runAnalysisFor(fix.modifiedCode, false);
    } finally {
      setApplyingId(null);
    }
  };

  const handleCommit = () => {
    commit();
    toast.success("Fix committed to your live code.");
  };

  const handleSave = async () => {
    if (!analysis) return;
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");
      const title =
        analysis.findings[0]?.title ?? `${language.toUpperCase()} analysis`;
      const { error } = await supabase.from("debug_sessions").insert({
        user_id: userData.user.id,
        title,
        language,
        original_code: liveCode,
        analysis: analysis as unknown as never,
        defect_probability: analysis.defectProbability,
      });
      if (error) throw error;
      toast.success("Saved to your history.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Debugger</h1>
          <p className="text-sm text-muted-foreground">
            Analyze code through the 3-layer engine, then stage AI fixes in a safe sandbox.
          </p>
        </div>
        <div className="clay-inset flex rounded-xl p-1">
          {(["python", "c"] as DebugLanguage[]).map((l) => (
            <button
              key={l}
              onClick={() => {
                setLanguage(l);
                if (liveCode === SAMPLES.python || liveCode === SAMPLES.c || !liveCode.trim()) {
                  setLiveCode(SAMPLES[l]);
                }
              }}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                language === l ? "clay-sm bg-card text-primary" : "text-muted-foreground"
              }`}
            >
              {l === "python" ? "Python" : "C"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Editor column */}
        <div className="lg:col-span-3 space-y-4">
          <SectionCard icon={FileCode2} title="Source" subtitle="Your live (committed) code">
            <CodeEditor value={liveCode} onChange={setLiveCode} language={language} />
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="hero" size="lg" onClick={handleRun} disabled={running}>
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {running ? "Analyzing…" : "Run X-Debug engine"}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => setLiveCode(SAMPLES[language])}
                disabled={running}
              >
                Load sample
              </Button>
              {analysis && (
                <Button variant="clay" size="lg" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </Button>
              )}
            </div>
          </SectionCard>

          {analysis && (
            <SectionCard
              icon={GitBranch}
              title="Git-Branch Simulator"
              subtitle="AI fixes never touch live code until you commit"
            >
              {proposedFix ? (
                <>
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
                      Staged: {proposedFix.title}
                    </span>
                    <div className="ml-auto flex gap-2">
                      <Button variant="ghost" size="sm" onClick={discard}>
                        <Undo2 className="h-4 w-4" /> Discard
                      </Button>
                      <Button variant="hero" size="sm" onClick={handleCommit}>
                        <GitCommitHorizontal className="h-4 w-4" /> Commit change
                      </Button>
                    </div>
                  </div>
                  <DiffViewer diffLines={proposedFix.diffLines} />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {hasPendingChange
                    ? ""
                    : "Select a ranked fix on the right to stage it here as a diff. Review it, then commit."}
                </p>
              )}
            </SectionCard>
          )}
        </div>

        {/* Insights column */}
        <div className="lg:col-span-2 space-y-4">
          {!analysis && !running && (
            <div className="clay rounded-4xl bg-card p-8 text-center">
              <p className="font-display text-lg font-semibold">Ready when you are</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Run the engine to see defect probability, layered findings, a causal graph, and
                ranked AI fixes.
              </p>
            </div>
          )}

          {running && (
            <div className="clay rounded-4xl bg-card p-8 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">
                Running expert system, ML scoring & NLP explanation…
              </p>
            </div>
          )}

          {analysis && (
            <>
              <SectionCard icon={ShieldAlert} title="Defect probability" subtitle="CodeBERT-style ML score">
                <div className="flex items-center gap-6">
                  <DefectGauge value={analysis.defectProbability} />
                  <div className="space-y-2 text-sm">
                    <Stat icon={ShieldAlert} label="Critical" value={counts.critical} tone="critical" />
                    <Stat icon={AlertTriangle} label="Warning" value={counts.warning} tone="warning" />
                    <Stat icon={Info} label="Info" value={counts.informational} tone="info" />
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{analysis.summary}</p>
              </SectionCard>
            </>
          )}
        </div>
      </div>

      {analysis && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <SectionCard icon={GitBranch} title="Causal graph" subtitle="How the bug propagates">
            <CausalGraph graph={analysis.causalGraph} />
          </SectionCard>
          <SectionCard icon={ListOrdered} title="Ranked AI fixes" subtitle="Confidence · efficiency · quality">
            <RankedFixes
              fixes={analysis.rankedFixes}
              activeId={proposedFix?.id ?? null}
              onPreview={stageFix}
              onApply={handleApply}
              applyingId={applyingId}
            />
          </SectionCard>
          <div className="lg:col-span-2">
            <SectionCard icon={Info} title="Findings" subtitle="Collapsible by severity">
              <ResultPanel findings={analysis.findings} />
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Info;
  label: string;
  value: number;
  tone: "critical" | "warning" | "info";
}) {
  const color =
    tone === "critical" ? "text-critical" : tone === "warning" ? "text-warning" : "text-info";
  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${color}`} />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-mono font-semibold">{value}</span>
    </div>
  );
}