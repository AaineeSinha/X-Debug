import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ScanSearch,
  BrainCircuit,
  MessageSquareText,
  GitBranch,
  ListOrdered,
  ShieldCheck,
  ArrowRight,
  Bug,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero with parallax layers */}
      <section className="bg-hero relative overflow-hidden">
        <div
          className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        />
        <div
          className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-accent/20 blur-3xl"
          style={{ transform: `translateY(${scrollY * -0.2}px)` }}
        />
        <div className="relative mx-auto max-w-5xl px-6 py-24 text-center sm:py-32">
          <span className="clay-sm mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <Bug className="h-3.5 w-3.5 text-primary" /> AI reverse debugging · Python & C
          </span>
          <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">
            Debug backwards.
            <br />
            <span className="text-gradient">Ship forward.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            X-Debug traces every bug to its root cause with a 3-layer engine, visualizes cause and
            effect as a live causal graph, and stages ranked AI fixes in a safe git-branch sandbox —
            so nothing changes until you commit.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button asChild variant="hero" size="xl">
              <Link to="/auth">
                Start debugging <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="clay" size="xl">
              <Link to="/" hash="engine">
                See the engine
              </Link>
            </Button>
          </div>

          <div
            className="clay mx-auto mt-16 max-w-3xl rounded-4xl bg-card p-5 text-left"
            style={{ transform: `translateY(${scrollY * -0.05}px)` }}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-critical/70" />
              <span className="h-3 w-3 rounded-full bg-warning/70" />
              <span className="h-3 w-3 rounded-full bg-success/70" />
              <span className="ml-2 font-mono text-xs text-muted-foreground">causal_trace.py</span>
            </div>
            <pre className="clay-inset overflow-x-auto rounded-2xl bg-[oklch(0.17_0.012_265)] p-4 font-mono text-[13px] leading-6">
<span className="text-muted-foreground">{`# eval() on untrusted input`}</span>{"\n"}
<span className="text-diff-remove">{`- config = eval(data)`}</span>{"\n"}
<span className="text-diff-add">{`+ config = json.loads(data)`}</span>{"\n"}
<span className="text-muted-foreground">{`# root cause → data → eval → RCE`}</span>
            </pre>
          </div>
        </div>
      </section>

      {/* Engine layers */}
      <section id="engine" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold">The X-Debug engine</h2>
          <p className="mt-3 text-muted-foreground">
            Three cooperating layers turn raw code into an actionable diagnosis.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: ScanSearch,
              tag: "Layer 1",
              title: "Expert System",
              body: "Rule-based static analysis catches syntax and structural anomalies — unused variables, null pointers, uninitialized memory, and insecure input.",
            },
            {
              icon: BrainCircuit,
              tag: "Layer 2",
              title: "ML Analysis",
              body: "A CodeBERT-style model assigns a defect probability to your file and every finding, so you fix what actually matters first.",
            },
            {
              icon: MessageSquareText,
              tag: "Layer 3",
              title: "NLP Explanation",
              body: "Every bug gets a plain-English narrative — what it is, why it's dangerous, and how the fix resolves it.",
            },
          ].map((c) => (
            <div key={c.title} className="clay rounded-4xl bg-card p-7">
              <span className="clay-sm flex h-12 w-12 items-center justify-center rounded-2xl bg-card">
                <c.icon className="h-6 w-6 text-primary" />
              </span>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-primary">
                {c.tag}
              </p>
              <h3 className="mt-1 text-xl font-bold">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Killer features */}
      <section id="features" className="bg-card/30 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-4xl font-bold">Built for the hard bugs</h2>
            <p className="mt-3 text-muted-foreground">
              Not just detection — a full workflow from root cause to a safe commit.
            </p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: GitBranch,
                title: "Causal Graph Debugger",
                body: "A live visual graph of cause-and-effect between variables, functions and control flow — hover any node to trace how a bug propagates.",
              },
              {
                icon: ListOrdered,
                title: "Multi-Fix Ranking Engine",
                body: "Multiple alternative fixes, each scored by confidence, efficiency and code quality, ranked best-first.",
              },
              {
                icon: ShieldCheck,
                title: "Git-Branch Sandbox",
                body: "Fixes are staged in a safe sandbox with a red/green diff viewer. Nothing merges into your live code until you hit Commit.",
              },
            ].map((c) => (
              <div key={c.title} className="clay rounded-4xl bg-card p-7">
                <span className="clay-sm flex h-12 w-12 items-center justify-center rounded-2xl bg-card">
                  <c.icon className="h-6 w-6 text-accent" />
                </span>
                <h3 className="mt-5 text-xl font-bold">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <div className="clay-glow rounded-4xl bg-card p-12 text-center">
          <h2 className="font-display text-4xl font-bold">
            Find the bug. <span className="text-gradient">Understand the cause.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Sign in and run your first analysis in seconds. Works offline as an installable app.
          </p>
          <Button asChild variant="hero" size="xl" className="mt-8">
            <Link to="/auth">
              Get started free <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
