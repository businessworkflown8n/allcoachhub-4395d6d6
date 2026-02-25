import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Search, Calendar, Clock, ArrowRight, Sparkles } from "lucide-react";

const blogPosts = [
  {
    id: 1,
    title: "How Generative AI is Transforming Online Education in 2026",
    excerpt: "Discover how AI-powered tools are reshaping the learning experience, from personalized curricula to intelligent tutoring systems.",
    category: "AI in Education",
    date: "Feb 24, 2026",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop",
  },
  {
    id: 2,
    title: "Top 10 AI Tools Every Coach Should Know About",
    excerpt: "From content generation to student analytics, these AI tools can supercharge your coaching workflow and boost learner outcomes.",
    category: "AI Tools",
    date: "Feb 22, 2026",
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&h=400&fit=crop",
  },
  {
    id: 3,
    title: "Understanding Large Language Models: A Beginner's Guide",
    excerpt: "What are LLMs, how do they work, and why should you care? A non-technical breakdown of the technology behind ChatGPT and beyond.",
    category: "AI Fundamentals",
    date: "Feb 20, 2026",
    readTime: "10 min read",
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&h=400&fit=crop",
  },
  {
    id: 4,
    title: "AI-Powered Certifications: The Future of Professional Development",
    excerpt: "How AI is changing the way certifications are earned, validated, and recognized across industries worldwide.",
    category: "AI Trends",
    date: "Feb 18, 2026",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1531746790095-e5981e8e4993?w=600&h=400&fit=crop",
  },
  {
    id: 5,
    title: "Weekly AI Roundup: Breakthroughs in Multimodal AI",
    excerpt: "This week's biggest AI developments including new vision-language models, robotics advances, and policy updates.",
    category: "Weekly Update",
    date: "Feb 16, 2026",
    readTime: "7 min read",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=400&fit=crop",
  },
  {
    id: 6,
    title: "Building Your Career in AI: Skills That Matter in 2026",
    excerpt: "The most in-demand AI skills, certifications, and career paths that can set you apart in today's competitive job market.",
    category: "AI Careers",
    date: "Feb 14, 2026",
    readTime: "9 min read",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=400&fit=crop",
  },
];

const categories = ["All", "AI in Education", "AI Tools", "AI Fundamentals", "AI Trends", "Weekly Update", "AI Careers"];

const AIBlogs = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = blogPosts.filter((post) => {
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        {/* Hero */}
        <section className="border-b border-border bg-card/50 py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary w-fit mb-6">
              <Sparkles className="h-4 w-4" />
              AI-Powered Insights
            </div>
            <h1 className="text-4xl font-bold text-foreground md:text-5xl">AI Blogs</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Stay ahead with the latest AI trends, tools, and insights — updated daily & weekly.
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
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground">No articles found.</p>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((post) => (
                <article
                  key={post.id}
                  className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg hover:border-primary/30"
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={post.image}
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
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{post.date}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}</span>
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
