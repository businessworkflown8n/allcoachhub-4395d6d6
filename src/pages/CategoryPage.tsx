import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { useCurrency } from "@/hooks/useCurrency";
import { trackEvent } from "@/lib/analytics";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CategoryHero from "@/components/category/CategoryHero";
import CategoryFilters from "@/components/category/CategoryFilters";
import CategoryCourseGrid from "@/components/category/CategoryCourseGrid";
import CategorySEOSection from "@/components/category/CategorySEOSection";
import CategoryRelated from "@/components/category/CategoryRelated";

export const categoryMap: Record<string, { name: string; emoji: string; slug: string; description: string; seoText: string }> = {
  "prompt-engineering": {
    name: "Prompt Engineering",
    emoji: "✨",
    slug: "prompt-engineering",
    description: "Master the art of crafting effective prompts for ChatGPT, Claude, and other AI models.",
    seoText: "Prompt Engineering is one of the most in-demand AI skills today. Our expert-led Prompt Engineering courses teach you how to craft precise, effective prompts for large language models like ChatGPT, Claude, and Gemini. Whether you're a beginner looking to understand the fundamentals or an advanced practitioner seeking to master complex prompt patterns, chain-of-thought reasoning, and few-shot learning techniques, our courses cover it all. Learn prompt engineering online with real-world projects, hands-on exercises, and certification. Join thousands of learners who have transformed their AI productivity through structured prompt engineering training on AI Coach Portal.",
  },
  "ai-agents": {
    name: "AI Agents",
    emoji: "🤖",
    slug: "ai-agents",
    description: "Build autonomous AI agents that can reason, plan, and execute complex tasks.",
    seoText: "AI Agents represent the next frontier of artificial intelligence — autonomous systems that can reason, plan, and execute multi-step tasks independently. Our AI Agents courses guide you through building intelligent agents using frameworks like LangChain, AutoGPT, and CrewAI. Learn how to design agent architectures, implement tool use and function calling, create multi-agent systems, and deploy production-ready AI agents. From no-code agent builders to advanced Python implementations, our expert coaches provide practical, project-based training. Master AI agent development and stay ahead in the rapidly evolving landscape of autonomous AI systems.",
  },
  "llms-fine-tuning": {
    name: "LLMs & Fine-tuning",
    emoji: "🧠",
    slug: "llms-fine-tuning",
    description: "Understand and fine-tune large language models for custom use cases.",
    seoText: "Large Language Models (LLMs) are the foundation of modern AI applications. Our LLM and Fine-tuning courses teach you how these models work under the hood — from transformer architectures and attention mechanisms to tokenization and training pipelines. Learn to fine-tune open-source models like LLaMA, Mistral, and Falcon for your specific use cases using techniques like LoRA, QLoRA, and RLHF. Our courses cover dataset preparation, evaluation metrics, deployment strategies, and cost optimization. Whether you're building a custom chatbot, domain-specific assistant, or enterprise AI solution, master the skills to adapt LLMs to your needs.",
  },
  "ai-automation": {
    name: "AI Automation",
    emoji: "⚡",
    slug: "ai-automation",
    description: "Automate workflows and processes using AI tools and platforms.",
    seoText: "AI Automation is transforming how businesses operate by eliminating repetitive tasks and streamlining complex workflows. Our AI Automation courses teach you to build intelligent automation systems using tools like Zapier, Make, n8n, and custom AI pipelines. Learn to automate content creation, data processing, customer support, email marketing, and business operations with AI. From simple task automation to sophisticated multi-step AI workflows, our expert coaches guide you through practical implementations that deliver immediate ROI. Discover how to combine AI models with automation platforms to create powerful, scalable solutions for any industry.",
  },
  "no-code-ai": {
    name: "No-Code AI",
    emoji: "🔧",
    slug: "no-code-ai",
    description: "Build AI-powered applications without writing a single line of code.",
    seoText: "No-Code AI tools are democratizing artificial intelligence, enabling anyone to build powerful AI applications without programming knowledge. Our No-Code AI courses teach you to create chatbots, image generators, data analyzers, and custom AI workflows using visual platforms and drag-and-drop interfaces. Learn to leverage tools like Bubble, Voiceflow, Relevance AI, and Stack AI to build production-ready applications. Our courses cover AI app design, integration patterns, user experience best practices, and deployment strategies. Whether you're an entrepreneur, marketer, or business professional, unlock the power of AI without writing a single line of code.",
  },
  "ai-marketing": {
    name: "AI for Marketing",
    emoji: "📈",
    slug: "ai-marketing",
    description: "Leverage AI for content creation, SEO, advertising, and marketing automation.",
    seoText: "AI is revolutionizing digital marketing, offering unprecedented capabilities in content creation, SEO optimization, advertising, and customer engagement. Our AI for Marketing courses teach you to leverage cutting-edge AI tools for copywriting, social media management, email marketing, ad optimization, and analytics. Learn to use ChatGPT, Jasper, Midjourney, and other AI platforms to create compelling marketing campaigns at scale. Our expert coaches share proven strategies for AI-powered SEO, content marketing, paid advertising optimization, and marketing automation. Transform your marketing efficiency and results with practical, hands-on AI marketing training.",
  },
  "generative-ai-for-developers": {
    name: "Gen AI for Devs",
    emoji: "💻",
    slug: "generative-ai-for-developers",
    description: "Integrate generative AI into software applications with OpenAI, LangChain, and more.",
    seoText: "Generative AI is reshaping software development, and developers who master these technologies are in high demand. Our Gen AI for Developers courses teach you to build AI-powered applications using OpenAI APIs, LangChain, vector databases, and modern AI frameworks. Learn to implement RAG (Retrieval-Augmented Generation), build conversational AI systems, create AI-powered code assistants, and deploy production-grade AI applications. Our courses cover prompt engineering for developers, embedding models, semantic search, and AI application architecture. From API integration to full-stack AI development, gain the skills to build the next generation of intelligent software.",
  },
  "ai-business": {
    name: "AI for Business",
    emoji: "🏢",
    slug: "ai-business",
    description: "Implement AI strategy and transformation in your organization.",
    seoText: "AI adoption is no longer optional for businesses that want to remain competitive. Our AI for Business courses provide executives, managers, and business leaders with the knowledge to drive AI transformation in their organizations. Learn to develop AI strategy, identify high-impact use cases, build AI teams, manage AI projects, and measure ROI. Our courses cover AI governance, ethical AI implementation, change management, and vendor evaluation. Whether you're leading a startup or managing enterprise AI initiatives, our expert coaches provide practical frameworks and case studies to help you successfully implement AI across your organization.",
  },
};

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const cat = categoryMap[slug || ""];
  const { symbol, priceKey, originalPriceKey } = useCurrency();

  const [courses, setCourses] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<Record<string, any>>({});
  const [enrollCounts, setEnrollCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [levelFilter, setLevelFilter] = useState("All");
  const [priceFilter, setPriceFilter] = useState("All");
  const [languageFilter, setLanguageFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  useSEO({
    title: cat ? `${cat.name} Courses | AI Coach Portal` : "Category – AI Coach Portal",
    description: cat ? `Explore ${cat.name} courses created by expert coaches. Learn and master skills with real-world applications.` : "Browse AI courses by category.",
    canonical: `https://www.aicoachportal.com/courses/${slug}`,
    ogTitle: cat ? `${cat.name} Courses | AI Coach Portal` : undefined,
    ogDescription: cat ? `Explore ${cat.name} courses created by expert coaches.` : undefined,
  });

  useEffect(() => {
    if (!cat) { setLoading(false); return; }
    trackEvent("category_page_view", { category: cat.name });

    const fetchData = async () => {
      setLoading(true);
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
        for (const course of list.slice(0, 30)) {
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
    fetchData();
  }, [slug]);

  // Derive available languages
  const availableLanguages = useMemo(() => {
    const langs = new Set(courses.map(c => c.language));
    return ["All", ...Array.from(langs)];
  }, [courses]);

  // Filter & sort
  const displayCourses = useMemo(() => {
    let filtered = [...courses];

    if (levelFilter !== "All") filtered = filtered.filter(c => c.level === levelFilter);
    if (priceFilter === "Free") filtered = filtered.filter(c => Number(c[priceKey] || c.price_usd) === 0);
    if (priceFilter === "Paid") filtered = filtered.filter(c => Number(c[priceKey] || c.price_usd) > 0);
    if (languageFilter !== "All") filtered = filtered.filter(c => c.language === languageFilter);

    if (sortBy === "newest") filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (sortBy === "popularity") filtered.sort((a, b) => (enrollCounts[b.id] || 0) - (enrollCounts[a.id] || 0));
    if (sortBy === "price-low") filtered.sort((a, b) => Number(a[priceKey] || a.price_usd) - Number(b[priceKey] || b.price_usd));
    if (sortBy === "price-high") filtered.sort((a, b) => Number(b[priceKey] || b.price_usd) - Number(a[priceKey] || a.price_usd));

    return filtered;
  }, [courses, levelFilter, priceFilter, languageFilter, sortBy, enrollCounts, priceKey]);

  // Trending courses (top by enrollment)
  const trendingCourses = useMemo(() => {
    return [...courses]
      .sort((a, b) => (enrollCounts[b.id] || 0) - (enrollCounts[a.id] || 0))
      .slice(0, 4);
  }, [courses, enrollCounts]);

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
    url: `https://www.aicoachportal.com/courses/${slug}`,
    itemListElement: displayCourses.slice(0, 10).map((c, i) => ({
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

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.aicoachportal.com/" },
      { "@type": "ListItem", position: 2, name: "Courses", item: "https://www.aicoachportal.com/courses" },
      { "@type": "ListItem", position: 3, name: cat.name, item: `https://www.aicoachportal.com/courses/${slug}` },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Navbar />
      <main className="pt-16">
        <CategoryHero
          cat={cat}
          slug={slug || ""}
          totalCourses={courses.length}
          loading={loading}
        />

        <CategoryFilters
          levelFilter={levelFilter}
          setLevelFilter={setLevelFilter}
          priceFilter={priceFilter}
          setPriceFilter={setPriceFilter}
          languageFilter={languageFilter}
          setLanguageFilter={setLanguageFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          availableLanguages={availableLanguages}
          resultCount={displayCourses.length}
        />

        <CategoryCourseGrid
          courses={displayCourses}
          coaches={coaches}
          enrollCounts={enrollCounts}
          loading={loading}
          symbol={symbol}
          priceKey={priceKey}
          originalPriceKey={originalPriceKey}
          categoryName={cat.name}
          trendingCourses={trendingCourses}
        />

        <CategoryRelated currentSlug={slug || ""} />

        <CategorySEOSection cat={cat} />
      </main>
      <Footer />
    </div>
  );
};

export default CategoryPage;
