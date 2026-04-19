import { Check, Target, User, AlertTriangle, Package, IndianRupee, BookOpen, Megaphone, Map, LayoutDashboard, Award } from "lucide-react";

const STEPS = [
  { id: 1, label: "Niche", icon: Target },
  { id: 2, label: "Avatar", icon: User },
  { id: 3, label: "Problems", icon: AlertTriangle },
  { id: 4, label: "Offer", icon: Package },
  { id: 5, label: "Pricing", icon: IndianRupee },
  { id: 6, label: "Curriculum", icon: BookOpen },
  { id: 7, label: "Funnel", icon: Megaphone },
  { id: 8, label: "Roadmap", icon: Map },
  { id: 9, label: "Dashboard", icon: LayoutDashboard },
  { id: 10, label: "Certificate", icon: Award },
];

export default function BlueprintStepper({ current, completed, onJump }: { current: number; completed: number[]; onJump: (s: number) => void }) {
  const pct = Math.round((completed.length / 10) * 100);
  const currentStep = STEPS.find((s) => s.id === current);

  return (
    <div className="sticky top-2 z-20 rounded-2xl border border-border bg-card/95 backdrop-blur-md p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
            {currentStep && <currentStep.icon className="h-4 w-4" />}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Step {current} of 10 · {currentStep?.label}</h3>
            <p className="text-xs text-muted-foreground">{pct}% complete · {completed.length}/10 steps done</p>
          </div>
        </div>
        <span className="text-xs font-medium text-primary">🎯 Goal: First ₹1,00,000</span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-gradient-to-r from-violet-500 via-pink-500 to-orange-400 transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STEPS.map((s) => {
          const done = completed.includes(s.id);
          const active = current === s.id;
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => onJump(s.id)}
              className={`group flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs transition-all ${
                active ? "border-transparent bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-sm" :
                done ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" :
                "border-border bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
              }`}
              title={`Step ${s.id}: ${s.label}`}
            >
              <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                active ? "bg-white/25" : done ? "bg-emerald-500/20" : "bg-background"
              }`}>
                {done ? <Check className="h-2.5 w-2.5" /> : s.id}
              </span>
              <Icon className="h-3 w-3" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
