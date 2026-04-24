import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { useJsonLd, buildBreadcrumbSchema } from "@/lib/seoSchema";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ChevronRight } from "lucide-react";

interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
}
interface Question {
  id: string;
  question: string;
  slug: string;
  ai_summary: string | null;
}

const KnowledgeTopic = () => {
  const { topic: topicSlug } = useParams<{ topic: string }>();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!topicSlug) return;
    (async () => {
      const { data: t } = await supabase
        .from("knowledge_topics")
        .select("*")
        .eq("slug", topicSlug)
        .eq("is_published", true)
        .maybeSingle();
      setTopic(t as Topic | null);
      if (t) {
        const { data: qs } = await supabase
          .from("knowledge_questions")
          .select("id, question, slug, ai_summary")
          .eq("topic_id", (t as Topic).id)
          .eq("is_published", true)
          .order("created_at", { ascending: false });
        setQuestions(qs || []);
      }
      setLoading(false);
    })();
  }, [topicSlug]);

  useSEO({
    title: topic?.meta_title || (topic ? `${topic.name} — Knowledge Hub` : "Knowledge Hub"),
    description: topic?.meta_description || topic?.description || undefined,
    canonical: `https://www.aicoachportal.com/knowledge/${topicSlug}`,
  });

  useJsonLd(
    topic
      ? [
          buildBreadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "Knowledge Hub", url: "/knowledge" },
            { name: topic.name, url: `/knowledge/${topic.slug}` },
          ]),
        ]
      : [],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Topic not found</h1>
          <Link to="/knowledge" className="mt-4 inline-block text-primary hover:underline">
            ← Back to Knowledge Hub
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-4xl px-4 py-12">
        <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/knowledge" className="hover:text-foreground">Knowledge Hub</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">{topic.name}</span>
        </nav>

        <h1 className="text-4xl font-bold text-foreground">{topic.name}</h1>
        {topic.description && (
          <p className="mt-3 text-lg text-muted-foreground">{topic.description}</p>
        )}

        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold text-foreground">All questions</h2>
          <ul className="space-y-3">
            {questions.map((q) => (
              <li key={q.id}>
                <Link
                  to={`/knowledge/${topic.slug}/${q.slug}`}
                  className="block rounded-lg border border-border bg-card p-4 transition hover:border-primary"
                >
                  <h3 className="font-semibold text-foreground">{q.question}</h3>
                  {q.ai_summary && (
                    <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                      {q.ai_summary}
                    </p>
                  )}
                </Link>
              </li>
            ))}
            {questions.length === 0 && (
              <p className="text-muted-foreground">No questions published yet for this topic.</p>
            )}
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default KnowledgeTopic;
