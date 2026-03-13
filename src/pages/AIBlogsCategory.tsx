import { useState, useEffect } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Search, Calendar, Clock, ArrowRight, Sparkles, RefreshCw, MapPin, Building2, Briefcase, ExternalLink, BadgeIndianRupee, DollarSign, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type JobData = {
  company: string;
  location: string;
  salary_range: string;
  source: string;
  job_type: string;
  experience: string;
  skills: string[];
  apply_url: string;
};

type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  content: string | null;
  category: string;
  image_url: string | null;
  read_time: string;
  published_at: string;
  blog_type: string;
  job_data: JobData | null;
  slug: string | null;
  author: string | null;
};

const categoryConfig: Record<string, { slug: string; label: string; dbCategory: string; metaTitle: string; metaDescription: string }> = {
  "ai-trends": {
    slug: "ai-trends",
    label: "AI Trends",
    dbCategory: "AI Trends",
    metaTitle: "Latest AI Trends 2026 | Artificial Intelligence Innovations",
    metaDescription: "Explore the latest AI trends, innovations, and breakthroughs shaping the future of artificial intelligence across industries.",
  },
  "ai-education": {
    slug: "ai-education",
    label: "AI in Education",
    dbCategory: "AI in Education",
    metaTitle: "AI in Education | How Artificial Intelligence is Transforming Learning",
    metaDescription: "Discover how AI is transforming education, online learning, and teaching methods through automation, personalization, and smart tools.",
  },
  "ai-tools": {
    slug: "ai-tools",
    label: "AI Tools",
    dbCategory: "AI Tools",
    metaTitle: "Best AI Tools for Productivity, Marketing & Learning",
    metaDescription: "Explore the best AI tools for business, marketing, automation, content creation, and productivity.",
  },
  "ai-fundamentals": {
    slug: "ai-fundamentals",
    label: "AI Fundamentals",
    dbCategory: "AI Fundamentals",
    metaTitle: "AI Fundamentals | Beginner Guide to Artificial Intelligence",
    metaDescription: "Learn the fundamentals of artificial intelligence including machine learning, neural networks, and AI basics for beginners.",
  },
  "ai-careers": {
    slug: "ai-careers",
    label: "AI Careers",
    dbCategory: "AI Careers",
    metaTitle: "AI Careers & Jobs | Opportunities in Artificial Intelligence",
    metaDescription: "Explore career opportunities in AI including AI engineer, data scientist, prompt engineer, and machine learning jobs.",
  },
  "ai-research": {
    slug: "ai-research",
    label: "AI Research",
    dbCategory: "AI Research",
    metaTitle: "Latest AI Research & Innovations",
    metaDescription: "Stay updated with cutting-edge AI research, breakthroughs, and developments from top universities and tech companies.",
  },
  "ai-policy": {
    slug: "ai-policy",
    label: "AI Policy",
    dbCategory: "AI Policy",
    metaTitle: "AI Policy & Regulations | Global AI Governance",
    metaDescription: "Learn about global AI policies, ethical AI frameworks, and regulations shaping the future of artificial intelligence.",
  },
  "weekly-ai-news": {
    slug: "weekly-ai-news",
    label: "Weekly Update",
    dbCategory: "Weekly Update",
    metaTitle: "Weekly AI News & Updates",
    metaDescription: "Get weekly updates on artificial intelligence news, tools, research, and AI industry developments.",
  },
};

const sourceColors: Record<string, string> = {
  "Naukri.com": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "Google Jobs": "bg-red-500/10 text-red-600 border-red-500/20",
  "LinkedIn": "bg-sky-500/10 text-sky-600 border-sky-500/20",
};

const AIBlogsCategory = () => {
  const { category } = useParams<{ category: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const config = category ? categoryConfig[category] : null;
  
  useSEO({
    title: config?.metaTitle || "AI Blogs – AI Coach Portal",
    description: config?.metaDescription || "Explore the latest AI insights, trends, and educational content from industry experts.",
    canonical: `https://www.aicoachportal.com/ai-jobs-news/${category}`,
    ogTitle: config?.metaTitle || "AI Blogs – AI Coach Portal",
    ogDescription: config?.metaDescription || "Explore the latest AI insights, trends, and educational content from industry experts.",
  });

  useEffect(() => {
    if (config) fetchBlogs();
  }, [config]);

  const fetchBlogs = async () => {
    if (!config) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("ai_blogs")
      .select("*")
      .eq("is_published", true)
      .eq("category", config.dbCategory)
      .order("published_at", { ascending: false })
      .limit(100);

    if (!error && data) {
      setPosts(data as unknown as BlogPost[]);
    }
    setLoading(false);
  };

  if (!config) return <Navigate to="/ai-blogs" replace />;

  const filtered = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const jobPosts = filtered.filter((p) => p.blog_type === "job");
  const articlePosts = filtered.filter((p) => p.blog_type !== "job");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: config.label,
    description: config.metaDescription,
    url: `https://www.aicoachportal.com/ai-jobs-news/${config.slug}`,
    isPartOf: {
      "@type": "Blog",
      name: "AI Jobs & News",
      url: "https://www.aicoachportal.com/ai-blogs",
    },
    publisher: { "@type": "Organization", name: "AI Coach Portal" },
  };

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <main className="pt-16">
        {/* Hero */}
        <section className="border-b border-border bg-card/50 py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary w-fit mb-6">
              <Sparkles className="h-4 w-4" />
              {config.label} · Updated Daily
            </div>
            <h1 className="text-4xl font-bold text-foreground md:text-5xl">{config.label}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">{config.metaDescription}</p>
            <div className="mx-auto mt-8 flex max-w-md items-center gap-2 rounded-lg border border-border bg-background px-4 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={`Search ${config.label}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </section>

        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 pt-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/ai-blogs">AI Jobs & News</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{config.label}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Subpages for AI Research */}
        {category === "ai-research" && (
          <section className="container mx-auto px-4 pt-8">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Featured Resources</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                to="/ai-jobs-news/ai-research/ai-seo-prompt"
                className="group rounded-xl border border-primary/30 bg-primary/5 p-5 transition-all hover:shadow-lg hover:border-primary/50"
              >
                <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Free Resource</span>
                <h3 className="mt-3 text-lg font-semibold text-foreground">100+ AI SEO Prompts</h3>
                <p className="mt-2 text-sm text-muted-foreground">Access 100+ AI SEO prompts for ChatGPT, Gemini & Claude to supercharge your SEO workflow.</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-80 group-hover:opacity-100">
                  Get Prompts <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </section>
        )}

        <section className="container mx-auto px-4 py-12">
          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No articles found in {config.label}.</p>
              <Link to="/ai-blogs" className="mt-4 inline-flex items-center gap-2 text-primary hover:underline">
                Browse all articles <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Job Listings */}
              {jobPosts.length > 0 && (
                <div>
                  <div className="mb-6 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">AI Job Openings</h2>
                    <Badge variant="secondary" className="ml-2">{jobPosts.length} jobs</Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {jobPosts.map((job) => (
                      <div key={job.id} className="group rounded-xl border border-border bg-card p-5 transition-all hover:shadow-lg hover:border-primary/30">
                        <div className="flex items-start justify-between gap-2">
                          <Badge variant="outline" className={`text-xs ${sourceColors[job.job_data?.source || ""] || "bg-secondary text-muted-foreground"}`}>
                            {job.job_data?.source}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">{job.job_data?.job_type}</Badge>
                        </div>
                        <h3 className="mt-3 text-base font-semibold text-foreground line-clamp-2">{job.title}</h3>
                        <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                          <p className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />{job.job_data?.company}</p>
                          <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{job.job_data?.location}</p>
                          <p className="flex items-center gap-1.5">
                            {job.job_data?.salary_range?.includes("₹") ? <BadgeIndianRupee className="h-3.5 w-3.5" /> : <DollarSign className="h-3.5 w-3.5" />}
                            {job.job_data?.salary_range}
                          </p>
                          <p className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" />{job.job_data?.experience}</p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {job.job_data?.skills?.slice(0, 4).map((skill, i) => (
                            <span key={i} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{skill}</span>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                          <span className="text-xs text-muted-foreground">{format(new Date(job.published_at), "MMM dd, yyyy")}</span>
                          {job.job_data?.apply_url && (
                            <a href={job.job_data.apply_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                              Apply <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Articles */}
              {articlePosts.length > 0 && (
                <div>
                  <div className="mb-6 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">{config.label} Articles</h2>
                  </div>
                  <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {articlePosts.map((post) => (
                      <Link
                        key={post.id}
                        to={`/ai-blogs/${post.slug || post.id}`}
                        className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg hover:border-primary/30"
                      >
                        <div className="aspect-video overflow-hidden">
                          <img
                            src={post.image_url || "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop"}
                            alt={post.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                        <div className="p-5">
                          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{post.category}</span>
                          <h3 className="mt-3 text-lg font-semibold text-foreground line-clamp-2">{post.title}</h3>
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(post.published_at), "MMM dd, yyyy")}</span>
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.read_time}</span>
                            </div>
                            <ArrowRight className="h-4 w-4 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Internal linking CTA */}
        <section className="border-t border-border bg-card/50 py-12">
          <div className="container mx-auto max-w-2xl px-4 text-center">
            <h2 className="text-2xl font-bold text-foreground">Start Your AI Learning Journey</h2>
            <p className="mt-2 text-muted-foreground">Join AI Coach Portal to learn from expert coaches and advance your AI career.</p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/courses" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:brightness-110">
                Explore AI Courses <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/webinars" className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-6 py-3 font-semibold text-foreground hover:bg-border">
                Join Free Webinars
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AIBlogsCategory;
