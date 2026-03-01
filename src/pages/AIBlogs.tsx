import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Search, Calendar, Clock, ArrowRight, Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  content: string | null;
  category: string;
  image_url: string | null;
  read_time: string;
  published_at: string;
};

const fallbackPosts = [
  {
    id: "fallback-1",
    title: "How Generative AI is Transforming Online Education in 2026",
    excerpt: "Discover how AI-powered tools are reshaping the learning experience, from personalized curricula to intelligent tutoring systems.",
    content: null,
    category: "AI in Education",
    image_url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop",
    read_time: "6 min read",
    published_at: new Date().toISOString(),
  },
  {
    id: "fallback-2",
    title: "Top 10 AI Tools Every Coach Should Know About",
    excerpt: "From content generation to student analytics, these AI tools can supercharge your coaching workflow.",
    content: null,
    category: "AI Tools",
    image_url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&h=400&fit=crop",
    read_time: "8 min read",
    published_at: new Date().toISOString(),
  },
  {
    id: "fallback-3",
    title: "Understanding Large Language Models: A Beginner's Guide",
    excerpt: "What are LLMs, how do they work, and why should you care? A non-technical breakdown.",
    content: null,
    category: "AI Fundamentals",
    image_url: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&h=400&fit=crop",
    read_time: "10 min read",
    published_at: new Date().toISOString(),
  },
];

const categories = ["All", "AI in Education", "AI Tools", "AI Fundamentals", "AI Trends", "Weekly Update", "AI Careers", "AI Research", "AI Policy"];

const AIBlogs = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

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
      .limit(50);

    if (error || !data || data.length === 0) {
      setPosts(fallbackPosts);
    } else {
      setPosts(data);
    }
    setLoading(false);
  };

  const filtered = posts.filter((post) => {
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (selectedPost) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16">
          <article className="container mx-auto max-w-3xl px-4 py-12">
            <button
              onClick={() => setSelectedPost(null)}
              className="mb-6 text-sm text-primary hover:underline"
            >
              ← Back to all articles
            </button>
            {selectedPost.image_url && (
              <img
                src={selectedPost.image_url}
                alt={selectedPost.title}
                className="mb-6 w-full rounded-xl object-cover aspect-video"
              />
            )}
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {selectedPost.category}
            </span>
            <h1 className="mt-4 text-3xl font-bold text-foreground md:text-4xl">
              {selectedPost.title}
            </h1>
            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(selectedPost.published_at), "MMM dd, yyyy")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {selectedPost.read_time}
              </span>
            </div>
            <div className="prose prose-lg dark:prose-invert mt-8 max-w-none whitespace-pre-wrap text-foreground">
              {selectedPost.content || selectedPost.excerpt}
            </div>
          </article>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        {/* Hero */}
        <section className="border-b border-border bg-card/50 py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary w-fit mb-6">
              <Sparkles className="h-4 w-4" />
              AI-Powered Insights · Updated Daily
            </div>
            <h1 className="text-4xl font-bold text-foreground md:text-5xl">AI Blogs</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Stay ahead with the latest AI trends, tools, and insights — auto-generated daily from trending topics.
            </p>

            <div className="mx-auto mt-8 flex max-w-md items-center gap-2 rounded-lg border border-border bg-background px-4 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </section>

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

        {/* Blog Grid */}
        <section className="container mx-auto px-4 py-12">
          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground">No articles found.</p>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((post) => (
                <article
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg hover:border-primary/30"
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
                    <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {post.category}
                    </span>
                    <h2 className="mt-3 text-lg font-semibold text-foreground line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(post.published_at), "MMM dd, yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.read_time}
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AIBlogs;
