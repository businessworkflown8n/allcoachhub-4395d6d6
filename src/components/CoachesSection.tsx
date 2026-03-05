import { useState } from "react";
import { Star, SlidersHorizontal } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/i18n/TranslationProvider";

const coaches = [
  {
    initials: "SC", name: "Sarah Chen", title: "AI Strategy & Prompt Engineering Expert",
    rating: 4.9, reviews: 234, tags: ["Prompt Engineering", "LLMs", "AI Strategy"],
    bio: "Former Google AI researcher with 10+ years in machine learning. I help professionals master prompt engineering and build AI-powered workflows that save hours daily.",
    students: "1,820", price_usd: 49, price_inr: 3999,
  },
  {
    initials: "MR", name: "Marcus Rivera", title: "AI Automation & No-Code Specialist",
    rating: 4.8, reviews: 189, tags: ["AI Automation", "No-Code AI", "AI Agents"],
    bio: "Built 200+ AI automations for Fortune 500 companies. Teaching founders and teams to automate their business with AI — no coding required.",
    students: "1,450", price_usd: 59, price_inr: 4799,
  },
  {
    initials: "DAP", name: "Dr. Aisha Patel", title: "LLM Fine-tuning & AI Research",
    rating: 4.9, reviews: 156, tags: ["LLMs & Fine-tuning", "Gen AI for Devs", "AI Research"],
    bio: "PhD in NLP from Stanford. I simplify complex AI concepts and teach developers how to fine-tune and deploy custom language models.",
    students: "980", price_usd: 79, price_inr: 6499,
  },
  {
    initials: "LN", name: "Lina Nakamura", title: "AI Agents & Autonomous Systems",
    rating: 4.8, reviews: 98, tags: ["AI Agents", "AI Automation", "Gen AI for Devs"],
    bio: "Building the future of autonomous AI agents. Learn to create, deploy, and manage AI agents that work 24/7 for your business.",
    students: "670", price_usd: 69, price_inr: 5699,
  },
];

const CoachesSection = () => {
  const { symbol, currency } = useCurrency();
  const [ratingFilter, setRatingFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const { t } = useTranslation();

  const filtered = coaches
    .filter((c) => {
      if (ratingFilter === "4.9") return c.rating >= 4.9;
      if (ratingFilter === "4.8") return c.rating >= 4.8;
      if (ratingFilter === "4.5") return c.rating >= 4.5;
      return true;
    })
    .sort((a, b) => {
      const key = currency === "INR" ? "price_inr" : "price_usd";
      if (priceFilter === "low") return a[key] - b[key];
      if (priceFilter === "high") return b[key] - a[key];
      return 0;
    });

  return (
    <section id="coaches" className="py-12 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="mb-3 text-3xl font-bold text-foreground">{t("coaches.title")}</h2>
            <p className="text-muted-foreground">{t("coaches.subtitle")}</p>
          </div>
          <button className="text-sm font-medium text-primary transition-colors hover:underline">{t("coaches.viewAll")}</button>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-40 bg-card border-border">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              <SelectItem value="all">{t("coaches.allRatings")}</SelectItem>
              <SelectItem value="4.9">4.9+ ★</SelectItem>
              <SelectItem value="4.8">4.8+ ★</SelectItem>
              <SelectItem value="4.5">4.5+ ★</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priceFilter} onValueChange={setPriceFilter}>
            <SelectTrigger className="w-44 bg-card border-border">
              <SelectValue placeholder="Price" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              <SelectItem value="all">{t("coaches.defaultOrder")}</SelectItem>
              <SelectItem value="low">{t("coaches.priceLowHigh")}</SelectItem>
              <SelectItem value="high">{t("coaches.priceHighLow")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {filtered.length === 0 && (
            <div className="col-span-2 py-12 text-center text-muted-foreground">{t("coaches.noMatch")}</div>
          )}
          {filtered.map((coach) => (
            <div
              key={coach.name}
              className="rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/20"
            >
              <div className="mb-4 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                  {coach.initials}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground">{coach.name}</h3>
                  <p className="text-sm text-muted-foreground">{coach.title}</p>
                  <div className="mt-1 flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                    <span className="text-sm font-medium text-foreground">{coach.rating}</span>
                    <span className="text-sm text-muted-foreground">({coach.reviews})</span>
                  </div>
                </div>
              </div>

              <div className="mb-3 flex flex-wrap gap-2">
                {coach.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">{tag}</span>
                ))}
              </div>

              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{coach.bio}</p>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <span className="text-sm text-muted-foreground">{coach.students} {t("coaches.students")}</span>
                <span className="text-sm font-semibold text-foreground">{t("coaches.from")} {symbol}{currency === "INR" ? coach.price_inr : coach.price_usd}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoachesSection;
