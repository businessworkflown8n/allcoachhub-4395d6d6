import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Calendar, Clock, User, ArrowRight, ChevronRight, List, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type BlogPostType = {
  id: string;
  title: string;
  excerpt: string;
  content: string | null;
  category: string;
  image_url: string | null;
  read_time: string;
  published_at: string;
  blog_type: string;
  slug: string | null;
  meta_title: string | null;
  meta_description: string | null;
  author: string | null;
  cta_text: string | null;
  cta_link: string | null;
  tags: string[] | null;
};

// Extract headings from markdown for TOC
function extractHeadings(md: string): { id: string; text: string; level: number }[] {
  const headings: { id: string; text: string; level: number }[] = [];
  const lines = md.split("\n");
  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/[*_`]/g, "").trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      headings.push({ id, text, level });
    }
  }
  return headings;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [related, setRelated] = useState<BlogPostType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("ai_blogs")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (error || !data) {
        setLoading(false);
        return;
      }
      setPost(data as unknown as BlogPostType);

      // Fetch related posts from same category
      const { data: relData } = await supabase
        .from("ai_blogs")
        .select("*")
        .eq("is_published", true)
        .eq("category", data.category)
        .neq("id", data.id)
        .eq("blog_type", "article")
        .order("published_at", { ascending: false })
        .limit(3);
      if (relData) setRelated(relData as unknown as BlogPostType[]);
      setLoading(false);
    })();
  }, [slug]);

  // Set document head for SEO
  useEffect(() => {
    if (!post) return;
    document.title = post.meta_title || post.title;
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        if (name.startsWith("og:") || name.startsWith("article:")) {
          el.setAttribute("property", name);
        } else {
          el.setAttribute("name", name);
        }
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta("description", post.meta_description || post.excerpt);
    setMeta("og:title", post.meta_title || post.title);
    setMeta("og:description", post.meta_description || post.excerpt);
    setMeta("og:type", "article");
    setMeta("og:url", `https://www.aicoachportal.com/ai-blogs/${post.slug}`);
    if (post.image_url) setMeta("og:image", post.image_url);
    setMeta("article:published_time", post.published_at);
    setMeta("article:author", post.author || "AI Coach Portal");
  }, [post]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold text-foreground">Article Not Found</h1>
          <Link to="/ai-blogs" className="text-primary hover:underline">← Back to AI Blogs</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const headings = extractHeadings(post.content || "");
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    image: post.image_url,
    datePublished: post.published_at,
    author: { "@type": "Organization", name: post.author || "AI Coach Portal" },
    publisher: { "@type": "Organization", name: "AI Coach Portal", url: "https://www.aicoachportal.com" },
    mainEntityOfPage: `https://www.aicoachportal.com/ai-blogs/${post.slug}`,
  };

  // Extract FAQ from content (## FAQ or ## Frequently Asked Questions section)
  const faqMatch = (post.content || "").match(/##\s*(FAQ|Frequently Asked Questions)[\s\S]*$/i);
  let faqJsonLd: any = null;
  if (faqMatch) {
    const faqSection = faqMatch[0];
    const qaPairs: { q: string; a: string }[] = [];
    const qaMatches = faqSection.matchAll(/###?\s*(?:\d+\.\s*)?(.+?)\n+([\s\S]*?)(?=\n###?\s|\n##\s|$)/g);
    for (const m of qaMatches) {
      if (m[1] && m[2] && !m[1].match(/^(FAQ|Frequently)/i)) {
        qaPairs.push({ q: m[1].trim(), a: m[2].trim() });
      }
    }
    if (qaPairs.length > 0) {
      faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: qaPairs.map((qa) => ({
          "@type": "Question",
          name: qa.q,
          acceptedAnswer: { "@type": "Answer", text: qa.a.replace(/\n/g, " ").substring(0, 500) },
        })),
      };
    }
  }

  // Custom renderer to add IDs to headings for TOC linking
  const components = {
    h2: ({ children, ...props }: any) => {
      const text = String(children).replace(/[*_`]/g, "").trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      return <h2 id={id} className="scroll-mt-20" {...props}>{children}</h2>;
    },
    h3: ({ children, ...props }: any) => {
      const text = String(children).replace(/[*_`]/g, "").trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      return <h3 id={id} className="scroll-mt-20" {...props}>{children}</h3>;
    },
    a: ({ href, children, ...props }: any) => {
      // Make internal links use router
      if (href?.startsWith("/")) {
        return <Link to={href} className="text-primary underline hover:text-primary/80" {...props}>{children}</Link>;
      }
      return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80" {...props}>{children}</a>;
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}
      <Navbar />
      <main className="pt-16">
        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 pt-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/ai-blogs">AI Blogs</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="line-clamp-1 max-w-[200px] sm:max-w-none">{post.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <article className="container mx-auto max-w-4xl px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {post.category}
            </span>
            <h1 className="mt-4 text-3xl font-bold text-foreground leading-tight md:text-4xl lg:text-5xl">
              {post.title}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><User className="h-4 w-4" />{post.author || "AI Coach Portal"}</span>
              <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{format(new Date(post.published_at), "MMMM dd, yyyy")}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{post.read_time}</span>
            </div>
          </div>

          {/* Featured image */}
          {post.image_url && (
            <img
              src={post.image_url}
              alt={post.title}
              className="mb-8 w-full rounded-xl object-cover aspect-video"
              loading="eager"
            />
          )}

          {/* Layout: TOC sidebar + Content */}
          <div className="flex gap-8">
            {/* Table of Contents (desktop) */}
            {headings.length > 3 && (
              <aside className="hidden lg:block w-64 shrink-0">
                <div className="sticky top-24 rounded-xl border border-border bg-card p-4">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <List className="h-4 w-4" /> Table of Contents
                  </h3>
                  <nav className="space-y-1">
                    {headings.map((h) => (
                      <a
                        key={h.id}
                        href={`#${h.id}`}
                        className={`block text-sm text-muted-foreground hover:text-primary transition-colors ${h.level === 3 ? "pl-4" : ""}`}
                      >
                        {h.text}
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>
            )}

            {/* Article Content */}
            <div className="min-w-0 flex-1">
              <div className="prose prose-lg dark:prose-invert max-w-none text-foreground prose-a:text-primary prose-a:underline hover:prose-a:text-primary/80 prose-headings:text-foreground prose-strong:text-foreground prose-li:text-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                  {post.content || post.excerpt}
                </ReactMarkdown>
              </div>

              {/* Social Share Buttons */}
              <div className="mt-8 flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"><Share2 className="h-4 w-4" /> Share:</span>
                {(() => {
                  const url = encodeURIComponent(`https://www.aicoachportal.com/ai-blogs/${post.slug}`);
                  const title = encodeURIComponent(post.title);
                  return (
                    <>
                      <a href={`https://api.whatsapp.com/send?text=${title}%20${url}`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors">WhatsApp</a>
                      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${url}`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors">LinkedIn</a>
                      <a href={`https://twitter.com/intent/tweet?text=${title}&url=${url}`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors">Twitter</a>
                      <a href={`https://www.facebook.com/sharer/sharer.php?u=${url}`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors">Facebook</a>
                    </>
                  );
                })()}
              </div>

              {/* CTA Section */}
              <div className="mt-12 rounded-xl border border-primary/20 bg-primary/5 p-6 text-center sm:p-8">
                <h3 className="text-xl font-bold text-foreground sm:text-2xl">Ready to Start Your AI Journey?</h3>
                <p className="mt-2 text-muted-foreground">Join thousands of learners and coaches on AI Coach Portal.</p>
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    to={post.cta_link || "/courses"}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-all hover:brightness-110"
                  >
                    {post.cta_text || "Explore AI Courses"} <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/auth?mode=signup"
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-6 py-3 font-semibold text-foreground transition-colors hover:bg-border"
                  >
                    Become an AI Coach
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Related Articles */}
          {related.length > 0 && (
            <section className="mt-16">
              <h2 className="mb-6 text-2xl font-bold text-foreground">Related Articles</h2>
              <div className="grid gap-6 md:grid-cols-3">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    to={`/ai-blogs/${r.slug || r.id}`}
                    className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg hover:border-primary/30"
                  >
                    {r.image_url && (
                      <img src={r.image_url} alt={r.title} className="aspect-video w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                    )}
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-foreground line-clamp-2">{r.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;
