import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import {
  useJsonLd,
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildArticleSchema,
} from "@/lib/seoSchema";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { EEATFooter } from "@/components/seo/EEATFooter";
import { Sparkles, ChevronRight } from "lucide-react";

interface KQ {
  id: string;
  question: string;
  slug: string;
  ai_summary: string | null;
  detailed_explanation: string | null;
  key_takeaways: string[] | null;
  faqs: { question: string; answer: string }[] | null;
  source_references: { title: string; url: string }[] | null;
  meta_title: string | null;
  meta_description: string | null;
  hero_image_url: string | null;
  author_name: string | null;
  author_expertise: string | null;
  reviewed_by: string | null;
  last_reviewed_at: string;
  published_at: string | null;
  updated_at: string;
}

const KnowledgeQuestion = () => {
  const { topic: topicSlug, question: questionSlug } = useParams<{ topic: string; question: string }>();
  const [topicName, setTopicName] = useState<string>("");
  const [q, setQ] = useState<KQ | null>(null);
  const [related, setRelated] = useState<{ slug: string; question: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!topicSlug || !questionSlug) return;
    (async () => {
      const { data: topic } = await supabase
        .from("knowledge_topics")
        .select("id, name")
        .eq("slug", topicSlug)
        .eq("is_published", true)
        .maybeSingle();
      if (!topic) { setLoading(false); return; }
      setTopicName((topic as { name: string }).name);
      const { data: qd } = await supabase
        .from("knowledge_questions")
        .select("*")
        .eq("topic_id", (topic as { id: string }).id)
        .eq("slug", questionSlug)
        .eq("is_published", true)
        .maybeSingle();
      setQ(qd as KQ | null);

      // related questions in same topic
      const { data: rel } = await supabase
        .from("knowledge_questions")
        .select("slug, question")
        .eq("topic_id", (topic as { id: string }).id)
        .eq("is_published", true)
        .neq("slug", questionSlug)
        .limit(5);
      setRelated(rel || []);
      setLoading(false);
    })();
  }, [topicSlug, questionSlug]);

  const url = `/knowledge/${topicSlug}/${questionSlug}`;
  const fullUrl = `https://www.aicoachportal.com${url}`;

  useSEO({
    title: q?.meta_title || q?.question,
    description: q?.meta_description || q?.ai_summary || undefined,
    canonical: fullUrl,
    ogType: "article",
    ogImage: q?.hero_image_url || undefined,
  });

  useJsonLd(
    q
      ? [
          buildBreadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "Knowledge Hub", url: "/knowledge" },
            { name: topicName, url: `/knowledge/${topicSlug}` },
            { name: q.question, url },
          ]),
          buildArticleSchema({
            headline: q.question,
            description: q.ai_summary || q.meta_description || q.question,
            url: fullUrl,
            image: q.hero_image_url || undefined,
            authorName: q.author_name || "AI Coach Portal Editorial",
            datePublished: q.published_at || q.last_reviewed_at,
            dateModified: q.updated_at,
          }),
          ...(q.faqs && q.faqs.length > 0 ? [buildFaqSchema(q.faqs)] : []),
        ]
      : [],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto max-w-3xl px-4 py-12">
          <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!q) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Question not found</h1>
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
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <nav className="mb-5 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <Link to="/knowledge" className="hover:text-foreground">Knowledge Hub</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to={`/knowledge/${topicSlug}`} className="hover:text-foreground">{topicName}</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground line-clamp-1">{q.question}</span>
        </nav>

        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{q.question}</h1>

        {q.ai_summary && (
          <section
            aria-label="AI Summary"
            className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-5"
          >
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-4 w-4" />
              AI Summary
            </h2>
            <p className="text-base leading-relaxed text-foreground">{q.ai_summary}</p>
          </section>
        )}

        {q.detailed_explanation && (
          <section className="mt-8">
            <h2 className="mb-3 text-2xl font-semibold text-foreground">Detailed explanation</h2>
            <div className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-a:text-primary">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {q.detailed_explanation}
              </ReactMarkdown>
            </div>
          </section>
        )}

        {q.key_takeaways && q.key_takeaways.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-2xl font-semibold text-foreground">Key takeaways</h2>
            <ul className="list-disc space-y-1.5 pl-6 text-foreground/90">
              {q.key_takeaways.map((k, i) => (
                <li key={i}>{k}</li>
              ))}
            </ul>
          </section>
        )}

        {q.faqs && q.faqs.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-2xl font-semibold text-foreground">FAQs</h2>
            <div className="space-y-4">
              {q.faqs.map((f, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-4">
                  <h3 className="font-semibold text-foreground">{f.question}</h3>
                  <p className="mt-1.5 text-sm text-foreground/85">{f.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-xl font-semibold text-foreground">Related questions</h2>
            <ul className="space-y-2">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    to={`/knowledge/${topicSlug}/${r.slug}`}
                    className="text-primary hover:underline"
                  >
                    {r.question}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <EEATFooter
          authorName={q.author_name || "AI Coach Portal Editorial"}
          authorExpertise={q.author_expertise || "AI coaching marketplace research team"}
          reviewedBy={q.reviewed_by}
          lastUpdated={q.updated_at}
          references={q.source_references}
        />
      </main>
      <Footer />
    </div>
  );
};

export default KnowledgeQuestion;
