import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { X, Clock } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

const categories = [
  { emoji: "✨", name: "Prompt Engineering", count: 42 },
  { emoji: "🤖", name: "AI Agents", count: 28 },
  { emoji: "🧠", name: "LLMs & Fine-tuning", count: 35 },
  { emoji: "⚡", name: "AI Automation", count: 31 },
  { emoji: "🔧", name: "No-Code AI", count: 24 },
  { emoji: "📈", name: "AI for Marketing", count: 19 },
  { emoji: "💻", name: "Gen AI for Devs", count: 38 },
  { emoji: "🏢", name: "AI for Business", count: 22 },
];

const staticCoursesByCategory: Record<string, any[]> = {
  "Prompt Engineering": [
    { id: "s1", title: "Master Prompt Engineering: Zero to Expert", level: "Beginner", duration_hours: 8, price_usd: 49, price_inr: 3999, original_price_usd: 99, original_price_inr: 7999, discount_percent: 51 },
    { id: "s2", title: "Advanced Prompt Patterns for ChatGPT & Claude", level: "Advanced", duration_hours: 6, price_usd: 59, price_inr: 4799, original_price_usd: null, original_price_inr: null, discount_percent: null },
    { id: "s3", title: "Prompt Engineering for Business Teams", level: "Intermediate", duration_hours: 5, price_usd: 39, price_inr: 3199, original_price_usd: 79, original_price_inr: 6499, discount_percent: 51 },
  ],
  "AI Agents": [
    { id: "s4", title: "Build AI Agents with No Code", level: "Intermediate", duration_hours: 12, price_usd: 69, price_inr: 5699, original_price_usd: 129, original_price_inr: 10699, discount_percent: 47 },
    { id: "s5", title: "Autonomous AI Agents Masterclass", level: "Advanced", duration_hours: 14, price_usd: 89, price_inr: 7399, original_price_usd: null, original_price_inr: null, discount_percent: null },
  ],
  "LLMs & Fine-tuning": [
    { id: "s6", title: "Fine-Tune Your Own LLM", level: "Advanced", duration_hours: 16, price_usd: 99, price_inr: 8199, original_price_usd: 199, original_price_inr: 16499, discount_percent: 50 },
    { id: "s7", title: "Understanding Large Language Models", level: "Beginner", duration_hours: 10, price_usd: 49, price_inr: 3999, original_price_usd: null, original_price_inr: null, discount_percent: null },
  ],
  "AI Automation": [
    { id: "s8", title: "AI Automation Bootcamp", level: "Intermediate", duration_hours: 10, price_usd: 59, price_inr: 4799, original_price_usd: 99, original_price_inr: 7999, discount_percent: 40 },
    { id: "s9", title: "Automate Everything with AI & Zapier", level: "Beginner", duration_hours: 6, price_usd: 39, price_inr: 3199, original_price_usd: null, original_price_inr: null, discount_percent: null },
  ],
  "No-Code AI": [
    { id: "s10", title: "No-Code AI Tools Masterclass", level: "Beginner", duration_hours: 8, price_usd: 39, price_inr: 3199, original_price_usd: 69, original_price_inr: 5699, discount_percent: 43 },
    { id: "s11", title: "Build AI Apps Without Coding", level: "Intermediate", duration_hours: 10, price_usd: 59, price_inr: 4799, original_price_usd: null, original_price_inr: null, discount_percent: null },
  ],
  "AI for Marketing": [
    { id: "s12", title: "AI-Powered Marketing Masterclass", level: "Beginner", duration_hours: 6, price_usd: 39, price_inr: 3199, original_price_usd: null, original_price_inr: null, discount_percent: null },
    { id: "s13", title: "Content Creation with Generative AI", level: "Intermediate", duration_hours: 8, price_usd: 49, price_inr: 3999, original_price_usd: 89, original_price_inr: 7399, discount_percent: 45 },
  ],
  "Gen AI for Devs": [
    { id: "s14", title: "Generative AI for Software Developers", level: "Intermediate", duration_hours: 12, price_usd: 69, price_inr: 5699, original_price_usd: 129, original_price_inr: 10699, discount_percent: 47 },
    { id: "s15", title: "Building with OpenAI & LangChain", level: "Advanced", duration_hours: 14, price_usd: 89, price_inr: 7399, original_price_usd: null, original_price_inr: null, discount_percent: null },
  ],
  "AI for Business": [
    { id: "s16", title: "AI Strategy for Business Leaders", level: "Beginner", duration_hours: 5, price_usd: 49, price_inr: 3999, original_price_usd: null, original_price_inr: null, discount_percent: null },
    { id: "s17", title: "Implementing AI in Your Organization", level: "Intermediate", duration_hours: 8, price_usd: 59, price_inr: 4799, original_price_usd: 99, original_price_inr: 7999, discount_percent: 40 },
  ],
};

const CategoriesSection = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [dbCourses, setDbCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { symbol, priceKey, originalPriceKey } = useCurrency();

  useEffect(() => {
    if (!activeCategory) return;
    setLoading(true);
    supabase
      .from("courses")
      .select("*")
      .eq("is_published", true)
      .eq("category", activeCategory)
      .then(({ data }) => {
        setDbCourses(data || []);
        setLoading(false);
      });
  }, [activeCategory]);

  const displayCourses = dbCourses.length > 0 ? dbCourses : (staticCoursesByCategory[activeCategory || ""] || []);

  return (
    <section className="py-12 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold text-foreground">Explore AI Categories</h2>
          <p className="text-muted-foreground">Find the perfect AI skill to level up your career</p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`group cursor-pointer rounded-xl border p-4 text-center transition-all hover:border-primary/30 hover:bg-secondary sm:p-6 ${
                activeCategory === cat.name ? "border-primary bg-secondary" : "border-border bg-card"
              }`}
            >
              <div className="mb-2 text-2xl sm:mb-3 sm:text-3xl">{cat.emoji}</div>
              <h3 className="mb-1 text-xs font-semibold text-foreground sm:text-sm">{cat.name}</h3>
              <p className="text-xs text-muted-foreground">{cat.count} courses</p>
            </button>
          ))}
        </div>

        {activeCategory && (
          <div className="mx-auto mt-8 max-w-5xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{activeCategory}</h3>
                  <p className="text-xs text-muted-foreground">{displayCourses.length} course{displayCourses.length !== 1 ? "s" : ""} available</p>
                </div>
                <button onClick={() => setActiveCategory(null)} className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : displayCourses.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No courses in this category yet. Check back soon!</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {displayCourses.map((course) => {
                    const isStatic = course.id?.startsWith("s");
                    const price = Number(course[priceKey] || course.price_usd);
                    const originalPrice = Number(course[originalPriceKey] || course.original_price_usd || 0);
                    return (
                      <Link
                        to={isStatic ? "#" : `/course/${course.slug || course.id}`}
                        key={course.id}
                        className="group/card flex flex-col rounded-lg border border-border bg-background p-4 transition-all hover:border-primary/20 hover:shadow-md"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">{course.level}</span>
                          {Number(course.discount_percent) > 0 && (
                            <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">{Number(course.discount_percent)}% OFF</span>
                          )}
                        </div>
                        <h4 className="mb-3 text-sm font-bold leading-snug text-foreground">{course.title}</h4>
                        <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{Number(course.duration_hours)}h</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">{symbol}{price}</span>
                            {originalPrice > price && (
                              <span className="text-xs text-muted-foreground line-through">{symbol}{originalPrice}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoriesSection;
