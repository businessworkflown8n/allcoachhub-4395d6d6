import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { useJsonLd, buildBreadcrumbSchema, buildOrganizationSchema } from "@/lib/seoSchema";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BookOpen } from "lucide-react";

interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  hero_image_url: string | null;
}

const KnowledgeHub = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("knowledge_topics")
        .select("id, name, slug, description, hero_image_url")
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      setTopics(data || []);
      setLoading(false);
    })();
  }, []);

  useSEO({
    title: "AI Knowledge Hub — Expert Answers | AI Coach Portal",
    description:
      "Browse expert, AI-curated answers on prompt engineering, AI agents, automation, and more. Optimized for Google, ChatGPT, Perplexity & Claude.",
    canonical: "https://www.aicoachportal.com/knowledge",
  });

  useJsonLd([
    buildOrganizationSchema(),
    buildBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Knowledge Hub", url: "/knowledge" },
    ]),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl">AI Knowledge Hub</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Direct, expert answers — extractable by Google, ChatGPT, Perplexity & Claude.
          </p>
        </header>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((t) => (
              <Link
                key={t.id}
                to={`/knowledge/${t.slug}`}
                className="group rounded-xl border border-border bg-card p-6 transition hover:border-primary hover:shadow-lg"
              >
                <BookOpen className="mb-3 h-6 w-6 text-primary" />
                <h2 className="text-lg font-semibold text-foreground group-hover:text-primary">
                  {t.name}
                </h2>
                {t.description && (
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                    {t.description}
                  </p>
                )}
              </Link>
            ))}
            {topics.length === 0 && (
              <p className="col-span-full text-center text-muted-foreground">
                No topics published yet.
              </p>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default KnowledgeHub;
