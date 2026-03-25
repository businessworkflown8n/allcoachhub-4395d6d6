import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus, Search, CreditCard, Share2,
  Upload, BarChart3, Globe, ChevronDown,
  Users, DollarSign, GraduationCap, Briefcase,
  BookOpen, Star, ChevronRight
} from "lucide-react";
import { useTranslation } from "@/i18n/TranslationProvider";

/* ── animated counter ── */
const AnimCounter = ({ end, prefix = "" }: { end: number; prefix?: string }) => {
  const [val, setVal] = useState(0);
  const ref = (node: HTMLSpanElement | null) => {
    if (!node) return;
    const ob = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          let cur = 0;
          const step = Math.max(1, Math.floor(end / 40));
          const id = setInterval(() => {
            cur = Math.min(cur + step, end);
            setVal(cur);
            if (cur >= end) clearInterval(id);
          }, 30);
          ob.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    ob.observe(node);
  };
  return <span ref={ref}>{prefix}{val.toLocaleString()}</span>;
};

/* ── step card ── */
const StepCard = ({
  num, icon: Icon, title, bullets, onClick,
}: {
  num: number;
  icon: React.ElementType;
  title: string;
  bullets: string[];
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={`group relative rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 ${onClick ? "cursor-pointer" : ""}`}
  >
    <div className="absolute -top-4 -left-4 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-primary-foreground shadow-lg ring-2 ring-primary/30">
      {num}
    </div>
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
      <Icon className="h-6 w-6 text-primary" />
    </div>
    <h4 className="mb-2 text-base font-bold text-foreground">{title}</h4>
    <ul className="space-y-1.5">
      {bullets.map((b) => (
        <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
          <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          {b}
        </li>
      ))}
    </ul>
  </div>
);

/* ── mini dashboards ── */
const LearnerDashboardPreview = () => {
  const { t } = useTranslation();
  return (
  <div className="rounded-2xl border border-border bg-card p-5 shadow-md">
    <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("howItWorks.referralDashboard")}</p>
    <div className="grid grid-cols-3 gap-3 mb-4">
      {[
        { labelKey: "howItWorks.totalReferred", value: 48, icon: Users, prefix: "" },
        { labelKey: "howItWorks.totalEnrolled", value: 32, icon: GraduationCap, prefix: "" },
        { labelKey: "howItWorks.commissionEarned", value: 1250, icon: DollarSign, prefix: "$" },
      ].map((s) => (
        <div key={s.labelKey} className="rounded-xl border border-border bg-secondary/50 p-3 text-center">
          <s.icon className="mx-auto mb-1.5 h-4 w-4 text-primary" />
          <p className="text-lg font-bold text-foreground"><AnimCounter end={s.value} prefix={s.prefix} /></p>
          <p className="text-[10px] text-muted-foreground">{t(s.labelKey)}</p>
        </div>
      ))}
    </div>
    <div className="flex items-end gap-1.5 h-16">
      {[35, 55, 40, 70, 60, 85, 75, 90, 65, 80, 95, 88].map((h, i) => (
        <div key={i} className="flex-1 rounded-t-sm bg-primary/60 transition-all duration-500" style={{ height: `${h}%`, opacity: 0.5 + h / 200 }} />
      ))}
    </div>
    <p className="mt-2 text-[10px] text-muted-foreground text-center">{t("howItWorks.monthlyReferral")}</p>
  </div>
  );
};

const CoachDashboardPreview = () => {
  const { t } = useTranslation();
  return (
  <div className="rounded-2xl border border-border bg-card p-5 shadow-md">
    <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("howItWorks.coachDashboard")}</p>
    <div className="grid grid-cols-2 gap-3 mb-4">
      {[
        { labelKey: "howItWorks.totalEnrollments", value: 214, icon: Users, prefix: "" },
        { labelKey: "howItWorks.revenueGenerated", value: 8420, icon: DollarSign, prefix: "$" },
        { labelKey: "howItWorks.coursesPublished", value: 6, icon: BookOpen, prefix: "" },
        { labelKey: "howItWorks.avgRating", value: 4.8, icon: Star, prefix: "", fixed: true },
      ].map((s) => (
        <div key={s.labelKey} className="rounded-xl border border-border bg-secondary/50 p-3">
          <div className="flex items-center gap-2 mb-1">
            <s.icon className="h-4 w-4 text-primary" />
            <span className="text-[10px] text-muted-foreground">{t(s.labelKey)}</span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {(s as any).fixed ? (s as any).value : <AnimCounter end={s.value as number} prefix={s.prefix} />}
          </p>
        </div>
      ))}
    </div>
    <svg viewBox="0 0 200 60" className="w-full h-14">
      <defs>
        <linearGradient id="coachGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(72,100%,50%)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(72,100%,50%)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0,50 Q20,45 40,40 T80,30 T120,25 T160,15 T200,10 V60 H0 Z" fill="url(#coachGrad)" />
      <path d="M0,50 Q20,45 40,40 T80,30 T120,25 T160,15 T200,10" fill="none" stroke="hsl(72,100%,50%)" strokeWidth="2" />
    </svg>
    <p className="mt-1 text-[10px] text-muted-foreground text-center">{t("howItWorks.revenueGrowth")}</p>
  </div>
  );
};

/* ── 3D button ── */
const Toggle3DButton = ({
  icon: Icon, label, subtitle, active, onClick,
}: {
  icon: React.ElementType;
  label: string;
  subtitle: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`
      relative flex items-center gap-4 rounded-2xl border-2 px-8 py-5 text-left
      transition-all duration-300 cursor-pointer select-none
      ${active
        ? "border-primary bg-primary/10 shadow-[0_6px_0_0_hsl(var(--primary)/0.5)] translate-y-0"
        : "border-border bg-card shadow-[0_6px_0_0_hsl(var(--border))] hover:shadow-[0_4px_0_0_hsl(var(--primary)/0.4)] hover:border-primary/50"
      }
      active:translate-y-[3px] active:shadow-[0_2px_0_0_hsl(var(--primary)/0.4)]
    `}
    style={{ minWidth: 260 }}
  >
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${active ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"}`}>
      <Icon className="h-6 w-6" />
    </div>
    <div className="flex-1">
      <p className="text-lg font-bold text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${active ? "rotate-180 text-primary" : ""}`} />
  </button>
);

/* ── main section ── */
const HowItWorksSection = () => {
  const [activeTab, setActiveTab] = useState<"learner" | "coach" | null>(null);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const learnerSteps = [
    { icon: UserPlus, title: t("howItWorks.learner.step1.title"), bullets: [t("howItWorks.learner.step1.b1"), t("howItWorks.learner.step1.b2"), t("howItWorks.learner.step1.b3")], onClick: () => navigate("/auth?mode=signup") },
    { icon: Search, title: t("howItWorks.learner.step2.title"), bullets: [t("howItWorks.learner.step2.b1"), t("howItWorks.learner.step2.b2"), t("howItWorks.learner.step2.b3")], onClick: () => navigate("/courses") },
    { icon: CreditCard, title: t("howItWorks.learner.step3.title"), bullets: [t("howItWorks.learner.step3.b1"), t("howItWorks.learner.step3.b2"), t("howItWorks.learner.step3.b3")], onClick: () => navigate("/courses") },
    { icon: Share2, title: t("howItWorks.learner.step4.title"), bullets: [t("howItWorks.learner.step4.b1"), t("howItWorks.learner.step4.b2"), t("howItWorks.learner.step4.b3")], onClick: () => navigate("/auth?mode=signup") },
  ];

  const coachSteps = [
    { icon: Briefcase, title: t("howItWorks.coach.step1.title"), bullets: [t("howItWorks.coach.step1.b1"), t("howItWorks.coach.step1.b2"), t("howItWorks.coach.step1.b3")], onClick: () => navigate("/auth?mode=signup&role=coach") },
    { icon: Upload, title: t("howItWorks.coach.step2.title"), bullets: [t("howItWorks.coach.step2.b1"), t("howItWorks.coach.step2.b2"), t("howItWorks.coach.step2.b3")], onClick: () => navigate("/auth?mode=signup&role=coach") },
    { icon: Globe, title: t("howItWorks.coach.step3.title"), bullets: [t("howItWorks.coach.step3.b1"), t("howItWorks.coach.step3.b2"), t("howItWorks.coach.step3.b3")], onClick: () => navigate("/auth?mode=signup&role=coach") },
    { icon: BarChart3, title: t("howItWorks.coach.step4.title"), bullets: [t("howItWorks.coach.step4.b1"), t("howItWorks.coach.step4.b2"), t("howItWorks.coach.step4.b3")], onClick: () => navigate("/auth?mode=signup&role=coach") },
  ];

  const toggle = (tab: "learner" | "coach") =>
    setActiveTab((prev) => (prev === tab ? null : tab));

  return (
    <section id="how-it-works" className="py-16 sm:py-24">
      <div className="container mx-auto px-4">
        {/* header */}
        <div className="mb-14 text-center">
          <span className="mb-3 inline-block rounded-full border border-border bg-secondary px-4 py-1 text-xs font-medium text-muted-foreground">
            {t("howItWorks.badge")}
          </span>
          <h2 className="mb-3 text-3xl font-extrabold text-foreground sm:text-4xl">
            {t("howItWorks.title")} <span className="text-gradient-lime">{t("howItWorks.titleHighlight")}</span>
          </h2>
          <p className="mx-auto max-w-xl text-muted-foreground">
            {t("howItWorks.subtitle")}
          </p>
        </div>

        {/* 3D toggle buttons – centered */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-10">
          <Toggle3DButton
            icon={GraduationCap}
            label={t("howItWorks.forLearners")}
            subtitle={t("howItWorks.forLearnersSubtitle")}
            active={activeTab === "learner"}
            onClick={() => toggle("learner")}
          />
          <Toggle3DButton
            icon={Briefcase}
            label={t("howItWorks.forCoaches")}
            subtitle={t("howItWorks.forCoachesSubtitle")}
            active={activeTab === "coach"}
            onClick={() => toggle("coach")}
          />
        </div>

        {/* expandable content */}
        <div
          className="overflow-hidden transition-all duration-500 ease-in-out"
          style={{
            maxHeight: activeTab ? "3000px" : "0px",
            opacity: activeTab ? 1 : 0,
          }}
        >
          {/* learner flow */}
          {activeTab === "learner" && (
            <div className="mx-auto max-w-4xl animate-fade-in">
              <div className="grid gap-5 sm:grid-cols-2">
                {learnerSteps.map((s, i) => (
                  <StepCard key={s.title} num={i + 1} icon={s.icon} title={s.title} bullets={s.bullets} />
                ))}
              </div>
              <div className="mt-6">
                <LearnerDashboardPreview />
              </div>
            </div>
          )}

          {/* coach flow */}
          {activeTab === "coach" && (
            <div className="mx-auto max-w-4xl animate-fade-in">
              <div className="grid gap-5 sm:grid-cols-2">
                {coachSteps.map((s, i) => (
                  <StepCard key={s.title} num={i + 1} icon={s.icon} title={s.title} bullets={s.bullets} />
                ))}
              </div>
              <div className="mt-6">
                <CoachDashboardPreview />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
