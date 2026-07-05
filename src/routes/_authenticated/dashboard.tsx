import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { DefectGauge } from "@/components/debugger/DefectGauge";
import { severityMeta } from "@/components/debugger/severity";
import type { AnalysisResult } from "@/lib/types";
import { Terminal, Trash2, FileCode2, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — X-Debug" }] }),
  component: Dashboard,
});

interface SessionRow {
  id: string;
  title: string;
  language: "python" | "c";
  original_code: string;
  analysis: AnalysisResult | null;
  defect_probability: number | null;
  created_at: string;
}

function Dashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["debug_sessions"],
    queryFn: async (): Promise<SessionRow[]> => {
      const { data, error } = await supabase
        .from("debug_sessions")
        .select("id,title,language,original_code,analysis,defect_probability,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SessionRow[];
    },
  });

  const del = async (id: string) => {
    const { error } = await supabase.from("debug_sessions").delete().eq("id", id);
    if (error) return toast.error("Could not delete.");
    toast.success("Deleted.");
    qc.invalidateQueries({ queryKey: ["debug_sessions"] });
  };

  const avgRisk =
    sessions.length > 0
      ? sessions.reduce((s, r) => s + (r.defect_probability ?? 0), 0) / sessions.length
      : 0;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back
              {user?.user_metadata?.display_name ? `, ${user.user_metadata.display_name}` : ""}
            </h1>
            <p className="text-sm text-muted-foreground">Your saved analyses and code health.</p>
          </div>
          <Button asChild variant="hero" size="lg">
            <Link to="/debug">
              <Terminal className="h-4 w-4" /> New analysis
            </Link>
          </Button>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard label="Saved analyses" value={sessions.length.toString()} icon={FileCode2} />
          <StatCard
            label="Critical findings"
            value={sessions
              .reduce(
                (s, r) => s + (r.analysis?.findings.filter((f) => f.severity === "critical").length ?? 0),
                0,
              )
              .toString()}
            icon={Terminal}
          />
          <div className="clay flex items-center justify-between rounded-3xl bg-card p-5">
            <div>
              <p className="text-sm text-muted-foreground">Avg. defect risk</p>
              <p className="font-display text-2xl font-bold">{Math.round(avgRisk * 100)}%</p>
            </div>
            <DefectGauge value={avgRisk} size={84} />
          </div>
        </div>

        <h2 className="mb-4 text-xl font-bold">History</h2>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : sessions.length === 0 ? (
          <div className="clay rounded-4xl bg-card p-10 text-center">
            <p className="font-display text-lg font-semibold">No analyses yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Run the X-Debug engine and hit Save to build your history.
            </p>
            <Button asChild variant="clay" size="lg" className="mt-5">
              <Link to="/debug">Start debugging</Link>
            </Button>
          </div>
        ) : (
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
            {sessions.map((s) => {
              const risk = s.defect_probability ?? s.analysis?.defectProbability ?? 0;
              const findings = s.analysis?.findings ?? [];
              return (
                <div key={s.id} className="clay break-inside-avoid rounded-3xl bg-card p-5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] uppercase text-muted-foreground">
                      {s.language}
                    </span>
                    <button
                      onClick={() => del(s.id)}
                      className="text-muted-foreground/60 transition-colors hover:text-critical"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <h3 className="mt-2 font-semibold leading-snug">{s.title}</h3>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                  </div>

                  <pre className="clay-inset mt-3 max-h-28 overflow-hidden rounded-xl bg-[oklch(0.17_0.012_265)] p-3 font-mono text-[11px] leading-5 text-foreground/70">
                    {s.original_code.split("\n").slice(0, 6).join("\n")}
                  </pre>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex gap-1.5">
                      {(["critical", "warning", "informational"] as const).map((sev) => {
                        const n = findings.filter((f) => f.severity === sev).length;
                        if (!n) return null;
                        const m = severityMeta[sev];
                        return (
                          <span
                            key={sev}
                            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.bg} ${m.text}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
                            {n}
                          </span>
                        );
                      })}
                    </div>
                    <span className="font-mono text-xs font-semibold text-muted-foreground">
                      {Math.round(risk * 100)}% risk
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Terminal;
}) {
  return (
    <div className="clay flex items-center justify-between rounded-3xl bg-card p-5">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-display text-2xl font-bold">{value}</p>
      </div>
      <span className="clay-sm flex h-11 w-11 items-center justify-center rounded-2xl bg-card">
        <Icon className="h-5 w-5 text-primary" />
      </span>
    </div>
  );
}