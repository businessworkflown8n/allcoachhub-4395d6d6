import { ArrowRight, Users, BookOpen, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const stats = [
  { icon: Users, value: "6,000+", label: "Students" },
  { icon: BookOpen, value: "200+", label: "Courses" },
  { icon: Shield, value: "50+", label: "Expert Coaches" },
];

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5">
          <span className="text-primary">✦</span>
          <span className="text-sm text-muted-foreground">The #1 Marketplace for AI Education</span>
        </div>

        <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-foreground md:text-7xl">
          Learn AI from the{" "}
          <span className="text-gradient-lime">World's Best</span> Coaches
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
          Master prompt engineering, AI agents, automation, and more. Book 1:1 sessions with expert coaches or enroll in structured courses.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button onClick={() => navigate("/auth?mode=signup")} className="glow-lime inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 font-semibold text-primary-foreground transition-all hover:brightness-110">
            Get Started Free <ArrowRight className="h-4 w-4" />
          </button>
          <button onClick={() => document.getElementById("coaches")?.scrollIntoView({ behavior: "smooth" })} className="rounded-lg border border-border bg-secondary px-8 py-3.5 font-semibold text-foreground transition-colors hover:bg-border">
            Browse Coaches
          </button>
        </div>

        <div className="mt-16 flex items-center justify-center gap-10 md:gap-16">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-2">
              <stat.icon className="h-5 w-5 text-muted-foreground" />
              <span className="text-xl font-bold text-foreground">{stat.value}</span>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
