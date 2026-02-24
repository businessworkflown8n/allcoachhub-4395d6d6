import { ArrowRight, Users, BookOpen, Shield, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import heroBg from "@/assets/hero-bg.jpg";

const stats = [
  { icon: Users, value: "6,000+", label: "Students", key: "students" },
  { icon: BookOpen, value: "200+", label: "Courses", key: "courses" },
  { icon: Shield, value: "50+", label: "Expert Coaches", key: "coaches" },
];

const dummyStudents = [
  { name: "Raj K****r", course: "Master Prompt Engineering", expert: "Sarah C**n" },
  { name: "Pri***a S", course: "Build AI Agents", expert: "Marcus R***ra" },
  { name: "Am**d M", course: "Fine-Tune Your Own LLM", expert: "Dr. Aisha P***l" },
  { name: "Jes***a L", course: "AI-Powered Marketing", expert: "Lina N***ra" },
  { name: "Vik***m T", course: "AI Automation Bootcamp", expert: "Marcus R***ra" },
  { name: "So***a W", course: "Prompt Engineering Pro", expert: "Sarah C**n" },
  { name: "Dav** P", course: "LLM Masterclass", expert: "Dr. Aisha P***l" },
  { name: "An***a R", course: "No-Code AI Tools", expert: "Lina N***ra" },
];

const dummyCourses = [
  { name: "Master Prompt Engineering", category: "Prompt Engineering", expert: "Sarah C**n" },
  { name: "Build AI Agents with No Code", category: "AI Agents", expert: "Marcus R***ra" },
  { name: "Fine-Tune Your Own LLM", category: "LLMs & Fine-tuning", expert: "Dr. Aisha P***l" },
  { name: "AI-Powered Marketing Masterclass", category: "AI for Marketing", expert: "Lina N***ra" },
  { name: "AI Automation Bootcamp", category: "AI Automation", expert: "Marcus R***ra" },
  { name: "Advanced Prompt Patterns", category: "Prompt Engineering", expert: "Sarah C**n" },
  { name: "Generative AI for Developers", category: "Gen AI for Devs", expert: "Dr. Aisha P***l" },
  { name: "AI Agents for Business", category: "AI Agents", expert: "Lina N***ra" },
];

const dummyCoaches = [
  { name: "Sarah C**n", specialty: "Prompt Engineering & AI Strategy", students: "1,820" },
  { name: "Marcus R***ra", specialty: "AI Automation & No-Code", students: "1,450" },
  { name: "Dr. Aisha P***l", specialty: "LLM Fine-tuning & Research", students: "980" },
  { name: "Lina N***ra", specialty: "AI Agents & Autonomous Systems", students: "670" },
  { name: "Jam** O", specialty: "AI for Healthcare", students: "540" },
  { name: "Fat***a Z", specialty: "Computer Vision & AI", students: "420" },
  { name: "Chr** B", specialty: "NLP & Chatbots", students: "380" },
  { name: "Me***a K", specialty: "AI Ethics & Governance", students: "310" },
];

const HeroSection = () => {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const renderModal = () => {
    if (!activeModal) return null;

    const titles: Record<string, string> = { students: "6,000+ Students Enrolled", courses: "200+ Courses Available", coaches: "50+ Expert Coaches" };
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setActiveModal(null)}>
        <div className="relative mx-4 max-h-[80vh] w-full max-w-lg overflow-auto rounded-xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setActiveModal(null)} className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
          <h3 className="mb-1 text-lg font-bold text-foreground">{titles[activeModal]}</h3>
          <p className="mb-4 text-xs text-muted-foreground">Some details are hidden for privacy</p>

          {activeModal === "students" && (
            <div className="space-y-2">
              {dummyStudents.map((s, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.course}</p>
                  </div>
                  <span className="text-xs text-primary">{s.expert}</span>
                </div>
              ))}
              <p className="pt-2 text-center text-xs text-muted-foreground">...and 5,992+ more students</p>
            </div>
          )}

          {activeModal === "courses" && (
            <div className="space-y-2">
              {dummyCourses.map((c, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.category}</p>
                  </div>
                  <span className="text-xs text-primary">{c.expert}</span>
                </div>
              ))}
              <p className="pt-2 text-center text-xs text-muted-foreground">...and 192+ more courses</p>
            </div>
          )}

          {activeModal === "coaches" && (
            <div className="space-y-2">
              {dummyCoaches.map((c, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.specialty}</p>
                  </div>
                  <span className="text-xs text-primary">{c.students} students</span>
                </div>
              ))}
              <p className="pt-2 text-center text-xs text-muted-foreground">...and 42+ more coaches</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-2 pt-16">
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

        <h1 className="mb-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl md:text-7xl">
          Learn AI from the{" "}
          <span className="text-gradient-lime">World's Best</span> Coaches
        </h1>

        <p className="mx-auto mb-8 max-w-2xl text-sm text-muted-foreground sm:text-base md:text-lg">
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

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:mt-16 sm:gap-10 md:gap-16">
          {stats.map((stat) => (
            <button
              key={stat.label}
              onClick={() => setActiveModal(stat.key)}
              className="flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all hover:bg-secondary/80 hover:scale-105 cursor-pointer sm:flex-row sm:gap-2"
            >
              <stat.icon className="h-5 w-5 text-muted-foreground" />
              <span className="text-lg font-bold text-foreground sm:text-xl">{stat.value}</span>
              <span className="text-xs text-muted-foreground sm:text-sm">{stat.label}</span>
            </button>
          ))}
        </div>
      </div>
      {renderModal()}
    </section>
  );
};

export default HeroSection;
