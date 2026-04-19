import { useState, useEffect } from "react";
import { useBlueprint } from "@/hooks/useBlueprint";
import { useCoachFeatures } from "@/hooks/useCoachFeatures";
import { Navigate } from "react-router-dom";
import BlueprintStepper from "./BlueprintStepper";
import BlueprintAIChat from "./BlueprintAIChat";
import Step1Niche from "./steps/Step1Niche";
import Step2Avatar from "./steps/Step2Avatar";
import Step3Problems from "./steps/Step3Problems";
import Step4Offer from "./steps/Step4Offer";
import Step5Pricing from "./steps/Step5Pricing";
import Step6Curriculum from "./steps/Step6Curriculum";
import Step7Funnel from "./steps/Step7Funnel";
import Step8Roadmap from "./steps/Step8Roadmap";
import Step9Dashboard from "./steps/Step9Dashboard";
import Step10Certificate from "./steps/Step10Certificate";
import { Rocket } from "lucide-react";

export default function CoachBlueprintWorkspace() {
  const { blueprint, loading, update, markStepComplete } = useBlueprint();
  const features: any = useCoachFeatures();
  const [step, setStep] = useState(1);

  useEffect(() => { if (blueprint?.current_step) setStep(blueprint.current_step); }, [blueprint?.current_step]);

  if (features.loading || loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-12" />;
  if (features.blueprint_access === false) return <Navigate to="/coach/overview" replace />;
  if (!blueprint) return null;

  const next = (s: number) => { markStepComplete(s); setStep(s + 1); };
  const props = { blueprint, update, onComplete: () => next(step) };

  const stepEl = {
    1: <Step1Niche {...props} />,
    2: <Step2Avatar {...props} />,
    3: <Step3Problems {...props} />,
    4: <Step4Offer {...props} />,
    5: <Step5Pricing {...props} />,
    6: <Step6Curriculum {...props} />,
    7: <Step7Funnel {...props} />,
    8: <Step8Roadmap {...props} />,
    9: <Step9Dashboard {...props} />,
    10: <Step10Certificate blueprint={blueprint} update={update} />,
  }[step];

  const completedCount = (blueprint.completed_steps || []).length;

  return (
    <div className="space-y-6">
      {/* Gradient Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-violet-600 via-pink-500 to-orange-400 p-6 text-white shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <Rocket className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Coach Blueprint Super App</h1>
              <p className="text-sm text-white/85 mt-1 max-w-xl">
                From idea → validated, revenue-generating coaching business in 10 AI-powered steps. Goal: <strong>your first ₹1,00,000</strong> as fast as possible.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl bg-white/15 backdrop-blur-sm px-4 py-2.5">
            <div className="text-center">
              <p className="text-2xl font-bold leading-none">{completedCount}<span className="text-sm text-white/70">/10</span></p>
              <p className="text-[10px] uppercase tracking-wide text-white/80 mt-0.5">Steps</p>
            </div>
            <div className="h-8 w-px bg-white/25" />
            <div className="text-center">
              <p className="text-2xl font-bold leading-none">{blueprint.is_completed ? "✓" : Math.round((completedCount / 10) * 100) + "%"}</p>
              <p className="text-[10px] uppercase tracking-wide text-white/80 mt-0.5">Done</p>
            </div>
          </div>
        </div>
      </div>

      <BlueprintStepper current={step} completed={blueprint.completed_steps || []} onJump={setStep} />

      {/* Friendly tip */}
      {completedCount === 0 && (
        <div className="rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-500/5 to-pink-500/5 p-4 flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div className="text-sm">
            <p className="font-medium text-foreground">New here? Start with Step 1 · Niche.</p>
            <p className="text-muted-foreground mt-0.5">Every step builds on the previous one. The AI Coach Assistant (bottom-right) has full context — ask anytime.</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        {stepEl}
      </div>

      <BlueprintAIChat blueprint={blueprint} currentStep={step} />
    </div>
  );
}
