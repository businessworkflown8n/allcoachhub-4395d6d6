import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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

const categories = ["All", "AI Trends", "AI in Education", "AI Tools", "AI Fundamentals", "AI Careers", "AI Research", "AI Policy", "Weekly Update"];

const sourceColors: Record<string, string> = {
  "Naukri.com": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "Google Jobs": "bg-red-500/10 text-red-600 border-red-500/20",
  "LinkedIn": "bg-sky-500/10 text-sky-600 border-sky-500/20",
};

const blogListJsonLd = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "AI Jobs & News",
  description: "Explore AI jobs, news, trends, tools, career guides, and expert articles on artificial intelligence. Updated daily.",
  url: "https://www.aicoachportal.com/ai-blogs",
  publisher: { "@type": "Organization", name: "AI Coach Portal" },
};

const AIBlogs = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "AI Jobs & News | Latest AI Trends, Careers & Tools | AI Coach Portal";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Explore AI jobs, news, trends, tools, career guides, and expert articles on artificial intelligence. Updated daily.");
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ai_blogs")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(100);

    if (!error && data && data.length > 0) {
      setPosts(data as unknown as BlogPost[]);
    }
    setLoading(false);
  };

  const filtered = posts.filter((post) => {
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const jobPosts = filtered.filter((p) => p.blog_type === "job");
  const articlePosts = filtered.filter((p) => p.blog_type !== "job");

  // Separate featured (SEO long-form) from regular articles
  const featuredPosts = articlePosts.filter((p) => p.read_time && parseInt(p.read_time) >= 8);
  const regularPosts = articlePosts.filter((p) => !p.read_time || parseInt(p.read_time) < 8);

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListJsonLd) }} />
      <Navbar />
      <main className="pt-16">
        {/* Hero */}
        <section className="border-b border-border bg-card/50 py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary w-fit mb-6">
              <Sparkles className="h-4 w-4" />
              AI-Powered Insights · Updated Daily
            </div>
            <h1 className="text-4xl font-bold text-foreground md:text-5xl">AI Jobs & News</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Learn AI online with expert guides, AI tool reviews, career tips, and curated job openings from Naukri, Google Jobs & LinkedIn.
            </p>
            <div className="mx-auto mt-8 flex max-w-md items-center gap-2 rounded-lg border border-border bg-background px-4 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search articles & jobs..."
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
                <BreadcrumbPage>AI Jobs & News</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Categories */}
        <section className="border-b border-border">
          <div className="container mx-auto flex gap-2 overflow-x-auto px-4 py-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground">No articles or jobs found.</p>
          ) : (
            <div className="space-y-12">
              {/* Featured / Long-form SEO Articles */}
              {featuredPosts.length > 0 && (
                <div>
                  <div className="mb-6 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">Featured Guides</h2>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    {featuredPosts.slice(0, 6).map((post) => (
                      <Link
                        key={post.id}
                        to={`/ai-blogs/${post.slug || post.id}`}
                        className="group flex overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg hover:border-primary/30"
                      >
                        <div className="w-1/3 shrink-0 overflow-hidden">
                          <img
                            src={post.image_url || "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop"}
                            alt={post.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                        <div className="flex flex-col justify-center p-4 sm:p-5">
                          <span className="inline-block w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                            {post.category}
                          </span>
                          <h3 className="mt-2 text-base font-semibold text-foreground line-clamp-2 sm:text-lg">{post.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><User className="h-3 w-3" />{post.author || "AI Coach Portal"}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.read_time}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

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
                      <div
                        key={job.id}
                        className="group rounded-xl border border-border bg-card p-5 transition-all hover:shadow-lg hover:border-primary/30"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Badge variant="outline" className={`text-xs ${sourceColors[job.job_data?.source || ""] || "bg-secondary text-muted-foreground"}`}>
                            {job.job_data?.source}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {job.job_data?.job_type}
                          </Badge>
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

              {/* Regular Articles */}
              {regularPosts.length > 0 && (
                <div>
                  <div className="mb-6 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">Latest Articles</h2>
                  </div>
                  <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {regularPosts.map((post) => (
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

        {/* Bottom CTA */}
        <section className="border-t border-border bg-card/50 py-12">
          <div className="container mx-auto max-w-2xl px-4 text-center">
            <h2 className="text-2xl font-bold text-foreground">Start Your AI Learning Journey</h2>
            <p className="mt-2 text-muted-foreground">Join AI Coach Portal to learn from expert coaches and advance your AI career.</p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/courses" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:brightness-110">
                Explore AI Courses <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/auth?mode=signup" className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-6 py-3 font-semibold text-foreground hover:bg-border">
                Become an AI Coach
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AIBlogs;
