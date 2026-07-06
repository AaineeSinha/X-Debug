import { useMemo, useState } from "react";
import type { CausalGraph as CausalGraphData, CausalNode } from "@/lib/types";
import { GitBranch } from "lucide-react";

const KIND_ORDER: CausalNode["kind"][] = ["io", "variable", "function", "control", "bug"];

const KIND_META: Record<CausalNode["kind"], { label: string; color: string }> = {
  io: { label: "I/O", color: "var(--color-chart-4)" },
  variable: { label: "Variable", color: "var(--color-chart-1)" },
  function: { label: "Function", color: "var(--color-chart-2)" },
  control: { label: "Control", color: "var(--color-chart-3)" },
  bug: { label: "Bug", color: "var(--color-critical)" },
};

interface Positioned extends CausalNode {
  x: number;
  y: number;
}

const WIDTH = 960;
const COL_H = 460;

export function CausalGraph({ graph }: { graph: CausalGraphData }) {
  const [active, setActive] = useState<string | null>(null);

  const { nodes, edges } = useMemo(() => {
    const columns = KIND_ORDER.map((kind) => graph.nodes.filter((n) => n.kind === kind));
    // Include any unknown-kind nodes in the variable column so nothing is dropped.
    const known = new Set(graph.nodes.map((n) => n.id));
    const positioned: Positioned[] = [];
    const usableCols = columns.filter((c) => c.length > 0);
    const colGap = WIDTH / (usableCols.length + 1);
    let colIndex = 0;
    for (const col of columns) {
      if (col.length === 0) continue;
      colIndex++;
      const x = colGap * colIndex;
      const rowGap = COL_H / (col.length + 1);
      col.forEach((node, r) => {
        positioned.push({ ...node, x, y: rowGap * (r + 1) });
      });
    }
    const byId = new Map(positioned.map((p) => [p.id, p]));
    const drawEdges = graph.edges.filter((e) => byId.has(e.source) && byId.has(e.target));
    return { nodes: positioned, edges: drawEdges, byId, known };
  }, [graph]);

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  if (nodes.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
        <GitBranch className="h-8 w-8 opacity-50" />
        <p className="text-sm">No causal relationships detected.</p>
      </div>
    );
  }

  const isDimmed = (id: string) => {
    if (!active) return false;
    if (id === active) return false;
    return !edges.some(
      (e) =>
        (e.source === active && e.target === id) || (e.target === active && e.source === id),
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${WIDTH} ${COL_H}`} className="min-w-[820px] w-full" role="img">
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-muted-foreground)" />
          </marker>
        </defs>

        {edges.map((e, i) => {
          const s = byId.get(e.source)!;
          const t = byId.get(e.target)!;
          const highlight = active && (e.source === active || e.target === active);
          const mx = (s.x + t.x) / 2;
          const my = (s.y + t.y) / 2;
          // Stagger labels above/below the midline so adjacent labels don't collide.
          const sameRow = Math.abs(s.y - t.y) < 4;
          const labelY = sameRow ? my + (i % 2 === 0 ? -18 : 18) : my - 6;
          const relation = e.relation.length > 14 ? e.relation.slice(0, 13) + "…" : e.relation;
          const labelW = relation.length * 5.6 + 10;
          return (
            <g key={i} opacity={active && !highlight ? 0.12 : 1}>
              <path
                d={`M ${s.x + 26} ${s.y} C ${mx} ${s.y}, ${mx} ${t.y}, ${t.x - 30} ${t.y}`}
                fill="none"
                stroke={highlight ? "var(--color-primary)" : "var(--color-border)"}
                strokeWidth={highlight ? 2.5 : 1.5}
                markerEnd="url(#arrow)"
              />
              <rect
                x={mx - labelW / 2}
                y={labelY - 9}
                width={labelW}
                height={14}
                rx={7}
                fill="var(--color-card)"
                opacity={0.92}
              />
              <text
                x={mx}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className={highlight ? "fill-primary" : "fill-muted-foreground"}
                style={{ fontSize: 10 }}
              >
                <title>{e.relation}</title>
                {relation}
              </text>
            </g>
          );
        })}

        {nodes.map((n) => {
          const meta = KIND_META[n.kind];
          const dim = isDimmed(n.id);
          return (
            <g
              key={n.id}
              transform={`translate(${n.x}, ${n.y})`}
              opacity={dim ? 0.25 : 1}
              onMouseEnter={() => setActive(n.id)}
              onMouseLeave={() => setActive(null)}
              style={{ cursor: "pointer", transition: "opacity 150ms" }}
            >
              <circle
                r={n.kind === "bug" ? 30 : 26}
                fill="var(--color-card)"
                stroke={meta.color}
                strokeWidth={n.id === active ? 3.5 : 2}
                style={{ filter: "drop-shadow(3px 4px 6px rgba(0,0,0,0.45))" }}
              />
              <circle r={5} cy={-11} fill={meta.color} />
              <text
                textAnchor="middle"
                dy="4"
                className="fill-foreground"
                style={{ fontSize: 10, fontWeight: 600 }}
              >
                {n.label.length > 10 ? n.label.slice(0, 9) + "…" : n.label}
              </text>
              {n.detail && (
                <title>
                  {n.label} — {n.detail}
                </title>
              )}
            </g>
          );
        })}
      </svg>

      <div className="mt-3 flex flex-wrap gap-3">
        {KIND_ORDER.map((k) => (
          <div key={k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: KIND_META[k].color }} />
            {KIND_META[k].label}
          </div>
        ))}
      </div>
    </div>
  );
}