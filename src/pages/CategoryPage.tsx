import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { useCurrency } from "@/hooks/useCurrency";
import { trackEvent } from "@/lib/analytics";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Clock, Users, ArrowRight } from "lucide-react";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage,
} from "@/components/ui/breadcrumb";

const categoryMap: Record<string, { name: string; emoji: string; description: string }> = {
  "prompt-engineering": { name: "Prompt Engineering", emoji: "✨", description: "Master the art of crafting effective prompts for ChatGPT, Claude, and other AI models." },
  "ai-agents": { name: "AI Agents", emoji: "🤖", description: "Build autonomous AI agents that can reason, plan, and execute complex tasks." },
  "llms-fine-tuning": { name: "LLMs & Fine-tuning", emoji: "🧠", description: "Understand and fine-tune large language models for custom use cases." },
  "ai-automation": { name: "AI Automation", emoji: "⚡", description: "Automate workflows and processes using AI tools and platforms." },
  "no-code-ai": { name: "No-Code AI", emoji: "🔧", description: "Build AI-powered applications without writing a single line of code." },
  "ai-marketing": { name: "AI for Marketing", emoji: "📈", description: "Leverage AI for content creation, SEO, advertising, and marketing automation." },
  "generative-ai-for-developers": { name: "Gen AI for Devs", emoji: "💻", description: "Integrate generative AI into software applications with OpenAI, LangChain, and more." },
  "ai-business": { name: "AI for Business", emoji: "🏢", description: "Implement AI strategy and transformation in your organization." },
};

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const cat = categoryMap[slug || ""];
  const { symbol, priceKey, originalPriceKey } = useCurrency();
  const [courses, setCourses] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<Record<string, any>>({});
  const [enrollCounts, setEnrollCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useSEO({
    title: cat ? `${cat.name} Courses – AI Coach Portal` : "Category – AI Coach Portal",
    description: cat?.description || "Browse AI courses by category on AI Coach Portal.",
    canonical: `https://www.aicoachportal.com/${slug}`,
    ogTitle: cat ? `${cat.name} Courses – AI Coach Portal` : undefined,
    ogDescription: cat?.description,
  });

  useEffect(() => {
    if (!cat) { setLoading(false); return; }
    trackEvent("category_click", { category: cat.name });

    const fetch = async () => {
      const { data: coursesData } = await supabase
        .from("courses")
        .select("*")
        .eq("is_published", true)
        .eq("approval_status", "approved")
        .eq("category", cat.name)
        .order("created_at", { ascending: false });

      const list = coursesData || [];
      setCourses(list);

      // Fetch coach profiles
      const coachIds = [...new Set(list.map(c => c.coach_id))];
      if (coachIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, slug, avatar_url")
          .in("user_id", coachIds);
        const map: Record<string, any> = {};
        (profiles || []).forEach(p => { map[p.user_id] = p; });
        setCoaches(map);
      }

      // Fetch enrollment counts
      if (list.length > 0) {
        const counts: Record<string, number> = {};
        for (const course of list.slice(0, 20)) {
          const { count } = await supabase
            .from("enrollments")
            .select("id", { count: "exact", head: true })
            .eq("course_id", course.id);
          counts[course.id] = count || 0;
        }
        setEnrollCounts(counts);
      }

      setLoading(false);
    };
    fetch();
  }, [slug]);

  if (!cat) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-background px-4">
          <h1 className="text-3xl font-bold text-foreground">Category Not Found</h1>
          <p className="text-muted-foreground">This category doesn't exist.</p>
          <Link to="/courses" className="text-primary hover:underline">Browse all courses →</Link>
        </div>
        <Footer />
      </>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${cat.name} Courses`,
    description: cat.description,
    url: `https://www.aicoachportal.com/${slug}`,
    itemListElement: courses.slice(0, 10).map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Course",
        name: c.title,
        url: `https://www.aicoachportal.com/course/${c.slug}`,
        provider: { "@type": "Person", name: coaches[c.coach_id]?.full_name || "Expert Coach" },
      },
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <main className="pt-16">
        {/* Hero */}
        <section className="border-b border-border bg-card/50 py-12">
          <div className="container mx-auto px-4">
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbLink asChild><Link to="/courses">Courses</Link></BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>{cat.name}</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{cat.emoji}</span>
              <div>
                <h1 className="text-3xl font-bold text-foreground md:text-4xl">{cat.name}</h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">{cat.description}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Course Grid */}
        <section className="container mx-auto px-4 py-12">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : courses.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No courses available in this category yet.</p>
              <Link to="/courses" className="mt-4 inline-block text-primary hover:underline">Browse all courses →</Link>
            </div>
          ) : (
            <>
              <p className="mb-6 text-sm text-muted-foreground">{courses.length} course{courses.length !== 1 ? "s" : ""} in {cat.name}</p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {courses.map((course) => {
                  const price = Number(course[priceKey] || course.price_usd);
                  const originalPrice = Number(course[originalPriceKey] || course.original_price_usd || 0);
                  const coach = coaches[course.coach_id];
                  return (
                    <Link
                      to={`/course/${course.slug || course.id}`}
                      key={course.id}
                      onClick={() => trackEvent("course_click", { course: course.title, coach: coach?.full_name, category: cat.name })}
                      className="group flex flex-col rounded-xl border border-border bg-card transition-all hover:border-primary/20 hover:shadow-lg"
                    >
                      {course.thumbnail_url && (
                        <img src={course.thumbnail_url} alt={course.title} className="h-40 w-full rounded-t-xl object-cover" loading="lazy" />
                      )}
                      <div className="flex flex-1 flex-col p-5">
                        <div className="mb-3 flex items-center gap-2">
                          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">{course.level}</span>
                          {Number(course.discount_percent) > 0 && (
                            <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">{Number(course.discount_percent)}% OFF</span>
                          )}
                        </div>
                        <h2 className="mb-2 text-sm font-bold leading-snug text-foreground line-clamp-2">{course.title}</h2>
                        {coach && (
                          <p className="mb-3 text-xs text-muted-foreground">by {coach.full_name}</p>
                        )}
                        <div className="mt-auto space-y-3">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {Number(course.duration_hours)}h</span>
                            {(enrollCounts[course.id] || 0) > 0 && (
                              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {enrollCounts[course.id]}</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between border-t border-border pt-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-foreground">{symbol}{price}</span>
                              {originalPrice > price && (
                                <span className="text-sm text-muted-foreground line-through">{symbol}{originalPrice}</span>
                              )}
                            </div>
                            <span className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-all group-hover:brightness-110">View</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CategoryPage;
