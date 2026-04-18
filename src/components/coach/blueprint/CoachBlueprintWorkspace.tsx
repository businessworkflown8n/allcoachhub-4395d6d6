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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Rocket className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Coach Blueprint Super App</h1>
          <p className="text-sm text-muted-foreground">From idea → validated, revenue-generating coaching business in 10 AI-powered steps.</p>
        </div>
      </div>

      <BlueprintStepper current={step} completed={blueprint.completed_steps || []} onJump={setStep} />

      <div className="rounded-2xl border border-border bg-card p-6">
        {stepEl}
      </div>

      <BlueprintAIChat blueprint={blueprint} currentStep={step} />
    </div>
  );
}
