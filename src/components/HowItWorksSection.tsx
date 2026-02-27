import { useState } from "react";
import {
  UserPlus, Search, CreditCard, Share2, Award, BookOpen,
  Upload, BarChart3, ArrowRight, Users, DollarSign,
  TrendingUp, Star, Globe, Play, FileText, ChevronRight,
  GraduationCap, Briefcase
} from "lucide-react";

/* ── tiny animated counter ── */
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
  num, icon: Icon, title, bullets, accent,
}: {
  num: number;
  icon: React.ElementType;
  title: string;
  bullets: string[];
  accent: string;
}) => (
  <div className="group relative rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
    {/* step number */}
    <div
      className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shadow-md"
      style={{ background: accent, color: "#fff" }}
    >
      {num}
    </div>
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: `${accent}22` }}>
      <Icon className="h-6 w-6" style={{ color: accent }} />
    </div>
    <h4 className="mb-2 text-base font-bold text-foreground">{title}</h4>
    <ul className="space-y-1.5">
      {bullets.map((b) => (
        <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
          <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
          {b}
        </li>
      ))}
    </ul>
  </div>
);

/* ── connector arrow ── */
const Arrow = ({ accent }: { accent: string }) => (
  <div className="hidden md:flex items-center justify-center py-1">
    <ArrowRight className="h-5 w-5 animate-pulse" style={{ color: accent }} />
  </div>
);

/* ── mini dashboard cards ── */
const LearnerDashboardPreview = () => (
  <div className="rounded-2xl border border-border bg-card p-5 shadow-md">
    <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      Referral Dashboard Preview
    </p>
    <div className="grid grid-cols-3 gap-3 mb-4">
      {[
        { label: "Total Referred", value: 48, icon: Users, color: "#6366f1" },
        { label: "Total Enrolled", value: 32, icon: GraduationCap, color: "#0ea5e9" },
        { label: "Commission Earned", value: 1250, icon: DollarSign, color: "#22c55e", prefix: "$" },
      ].map((s) => (
        <div key={s.label} className="rounded-xl border border-border bg-secondary/50 p-3 text-center">
          <s.icon className="mx-auto mb-1.5 h-4 w-4" style={{ color: s.color }} />
          <p className="text-lg font-bold text-foreground">
            <AnimCounter end={s.value} prefix={s.prefix} />
          </p>
          <p className="text-[10px] text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>
    {/* mini chart bars */}
    <div className="flex items-end gap-1.5 h-16">
      {[35, 55, 40, 70, 60, 85, 75, 90, 65, 80, 95, 88].map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm transition-all duration-500"
          style={{
            height: `${h}%`,
            background: `linear-gradient(to top, #6366f1, #0ea5e9)`,
            opacity: 0.7 + (h / 400),
          }}
        />
      ))}
    </div>
    <p className="mt-2 text-[10px] text-muted-foreground text-center">Monthly Referral Earnings</p>
  </div>
);

const CoachDashboardPreview = () => (
  <div className="rounded-2xl border border-border bg-card p-5 shadow-md">
    <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      Coach Dashboard Preview
    </p>
    <div className="grid grid-cols-2 gap-3 mb-4">
      {[
        { label: "Total Enrollments", value: 214, icon: Users, color: "#8b5cf6" },
        { label: "Revenue Generated", value: 8420, icon: DollarSign, color: "#22c55e", prefix: "$" },
        { label: "Courses Published", value: 6, icon: BookOpen, color: "#0ea5e9" },
        { label: "Avg Rating", value: 4.8, icon: Star, color: "#f59e0b", fixed: true },
      ].map((s) => (
        <div key={s.label} className="rounded-xl border border-border bg-secondary/50 p-3">
          <div className="flex items-center gap-2 mb-1">
            <s.icon className="h-4 w-4" style={{ color: s.color }} />
            <span className="text-[10px] text-muted-foreground">{s.label}</span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {s.fixed ? (
              s.value
            ) : (
              <AnimCounter end={s.value as number} prefix={s.prefix} />
            )}
          </p>
        </div>
      ))}
    </div>
    {/* mini area chart */}
    <svg viewBox="0 0 200 60" className="w-full h-14">
      <defs>
        <linearGradient id="coachGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0,50 Q20,45 40,40 T80,30 T120,25 T160,15 T200,10 V60 H0 Z" fill="url(#coachGrad)" />
      <path d="M0,50 Q20,45 40,40 T80,30 T120,25 T160,15 T200,10" fill="none" stroke="#8b5cf6" strokeWidth="2" />
    </svg>
    <p className="mt-1 text-[10px] text-muted-foreground text-center">Revenue Growth Trend</p>
  </div>
);

/* ── main section ── */
const HowItWorksSection = () => {
  const learnerAccent = "#0ea5e9";
  const coachAccent = "#8b5cf6";

  const learnerSteps = [
    {
      icon: UserPlus,
      title: "Sign Up",
      bullets: ["Create free account", "Simple registration process", "Email verification"],
    },
    {
      icon: Search,
      title: "Browse & Select Courses",
      bullets: [
        "Explore AI, Business, Marketing & more",
        "Filter by category, price, rating",
        "View course details & coach profile",
      ],
    },
    {
      icon: CreditCard,
      title: "Enroll in Course",
      bullets: [
        "Secure payment system",
        "Instant access to course dashboard",
        "Lifetime / duration-based access",
      ],
    },
    {
      icon: Share2,
      title: "Earn Referral Income",
      bullets: [
        "Get unique referral link",
        "Share with friends & colleagues",
        "Earn min 10% commission per enrollment",
      ],
    },
  ];

  const coachSteps = [
    {
      icon: Briefcase,
      title: "Register as a Coach",
      bullets: ["Create coach profile", "Add bio, expertise & experience", "Upload profile photo"],
    },
    {
      icon: Upload,
      title: "Add Your Course",
      bullets: [
        "Set title, description & price (INR/USD)",
        "Upload video, PDF or live sessions",
        "Structured curriculum builder",
      ],
    },
    {
      icon: Globe,
      title: "Publish & Start Selling",
      bullets: [
        "Course goes live globally",
        "Learners can enroll instantly",
        "Automated payment processing",
      ],
    },
    {
      icon: BarChart3,
      title: "Track Growth in Dashboard",
      bullets: [
        "Monitor enrollments & revenue",
        "Course-wise performance analytics",
        "Student insights & ratings",
      ],
    },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-24">
      <div className="container mx-auto px-4">
        {/* section header */}
        <div className="mb-14 text-center">
          <span className="mb-3 inline-block rounded-full border border-border bg-secondary px-4 py-1 text-xs font-medium text-muted-foreground">
            Simple &amp; Transparent Process
          </span>
          <h2 className="mb-3 text-3xl font-extrabold text-foreground sm:text-4xl">
            How It <span className="text-gradient-lime">Works</span>
          </h2>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Whether you want to learn new skills or share your expertise — get started in minutes.
          </p>
        </div>

        {/* two columns */}
        <div className="grid gap-12 lg:grid-cols-2">
          {/* ── LEARNERS ── */}
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${learnerAccent}22` }}>
                <GraduationCap className="h-5 w-5" style={{ color: learnerAccent }} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">For Learners</h3>
                <p className="text-xs text-muted-foreground">Start learning in 4 simple steps</p>
              </div>
            </div>

            <div className="space-y-4">
              {learnerSteps.map((s, i) => (
                <div key={s.title}>
                  <StepCard num={i + 1} icon={s.icon} title={s.title} bullets={s.bullets} accent={learnerAccent} />
                  {i < learnerSteps.length - 1 && <Arrow accent={learnerAccent} />}
                </div>
              ))}
            </div>

            {/* dashboard preview */}
            <div className="mt-6">
              <LearnerDashboardPreview />
            </div>
          </div>

          {/* ── COACHES ── */}
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${coachAccent}22` }}>
                <Briefcase className="h-5 w-5" style={{ color: coachAccent }} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">For Coaches</h3>
                <p className="text-xs text-muted-foreground">Start teaching in 4 simple steps</p>
              </div>
            </div>

            <div className="space-y-4">
              {coachSteps.map((s, i) => (
                <div key={s.title}>
                  <StepCard num={i + 1} icon={s.icon} title={s.title} bullets={s.bullets} accent={coachAccent} />
                  {i < coachSteps.length - 1 && <Arrow accent={coachAccent} />}
                </div>
              ))}
            </div>

            {/* dashboard preview */}
            <div className="mt-6">
              <CoachDashboardPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
