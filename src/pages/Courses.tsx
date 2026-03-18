import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Search, Filter } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCurrency } from "@/hooks/useCurrency";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

const categories = [
  "All",
  "Prompt Engineering",
  "AI Agents",
  "LLMs & Fine-tuning",
  "AI Automation",
  "No-Code AI",
  "AI for Marketing",
  "Gen AI for Devs",
  "AI for Business",
];

const levels = ["All", "Beginner", "Intermediate", "Advanced"];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "AI Courses",
  description: "Browse all AI courses on AI Coach Portal — prompt engineering, AI agents, automation & more.",
  url: "https://www.aicoachportal.com/courses",
};

const Courses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "All";
  const activeLevel = searchParams.get("level") || "All";
  const searchQuery = searchParams.get("q") || "";

  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { symbol, priceKey, originalPriceKey } = useCurrency();

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      let query = supabase
        .from("courses")
        .select("*")
        .eq("is_published", true)
        .eq("approval_status", "approved")
        .order("created_at", { ascending: false });

      if (activeCategory !== "All") query = query.eq("category", activeCategory);
      if (activeLevel !== "All") query = query.eq("level", activeLevel);

      const { data } = await query;
      setCourses(data || []);
      setLoading(false);
    };
    fetchCourses();
  }, [activeCategory, activeLevel]);

  const filtered = searchQuery
    ? courses.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : courses;

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "All" || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="pt-16">
        {/* Hero */}
        <section className="border-b border-border bg-card/50 py-12">
          <div className="container mx-auto px-4">
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Courses</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <h1 className="text-3xl font-bold text-foreground md:text-4xl">
              Browse AI Courses
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Master AI skills with expert-led courses in prompt engineering, AI agents, automation & more.
            </p>

            <div className="mt-6 flex max-w-md items-center gap-2 rounded-lg border border-border bg-background px-4 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => updateParam("q", e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>Category:</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => updateParam("category", cat)}
                    className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      activeCategory === cat
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Level:</span>
              {levels.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => updateParam("level", lvl)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    activeLevel === lvl
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Course Grid */}
        <section className="container mx-auto px-4 py-12">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              No courses found. Try adjusting your filters.
            </p>
          ) : (
            <>
              <p className="mb-6 text-sm text-muted-foreground">
                {filtered.length} course{filtered.length !== 1 ? "s" : ""} found
              </p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((course) => {
                  const price = Number(course[priceKey] || course.price_usd);
                  const originalPrice = Number(
                    course[originalPriceKey] || course.original_price_usd || 0
                  );
                  return (
                    <Link
                      to={`/course/${course.slug || course.id}`}
                      key={course.id}
                      className="group flex flex-col rounded-xl border border-border bg-card transition-all hover:border-primary/20 hover:shadow-lg"
                    >
                      <div className="border-b border-border p-5">
                        <div className="mb-3 flex items-center gap-2">
                          <span className="text-2xl">🎓</span>
                          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
                            {course.level}
                          </span>
                          {Number(course.discount_percent) > 0 && (
                            <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                              {Number(course.discount_percent)}% OFF
                            </span>
                          )}
                        </div>
                        <p className="mb-1 text-xs text-primary">{course.category}</p>
                        <h2 className="text-sm font-bold leading-snug text-foreground line-clamp-2">
                          {course.title}
                        </h2>
                      </div>
                      <div className="flex flex-1 flex-col justify-between p-5">
                        <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {Number(course.duration_hours)} hours
                          </span>
                          <span>{course.language}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-border pt-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-foreground">
                              {symbol}
                              {price}
                            </span>
                            {originalPrice > price && (
                              <span className="text-sm text-muted-foreground line-through">
                                {symbol}
                                {originalPrice}
                              </span>
                            )}
                          </div>
                          <span className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-all group-hover:brightness-110">
                            View
                          </span>
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

export default Courses;
