import { Check } from "lucide-react";

interface Step { id: number; label: string }
const STEPS: Step[] = [
  { id: 1, label: "Niche" },
  { id: 2, label: "Avatar" },
  { id: 3, label: "Problems" },
  { id: 4, label: "Offer" },
  { id: 5, label: "Pricing" },
  { id: 6, label: "Curriculum" },
  { id: 7, label: "Funnel" },
  { id: 8, label: "Roadmap" },
  { id: 9, label: "Dashboard" },
  { id: 10, label: "Certificate" },
];

export default function BlueprintStepper({ current, completed, onJump }: { current: number; completed: number[]; onJump: (s: number) => void }) {
  const pct = Math.round((completed.length / 10) * 100);
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Blueprint Progress</h3>
        <span className="text-xs text-muted-foreground">{pct}% complete</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex flex-wrap gap-2">
        {STEPS.map((s) => {
          const done = completed.includes(s.id);
          const active = current === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onJump(s.id)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all ${
                active ? "border-primary bg-primary text-primary-foreground" :
                done ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" :
                "border-border bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                active ? "bg-primary-foreground/20" : done ? "bg-emerald-500/20" : "bg-background"
              }`}>
                {done ? <Check className="h-2.5 w-2.5" /> : s.id}
              </span>
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
