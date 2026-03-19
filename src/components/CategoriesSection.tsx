import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { X, Clock, ArrowRight } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useTranslation } from "@/i18n/TranslationProvider";
import { trackEvent } from "@/lib/analytics";
import { PREDEFINED_CATEGORIES } from "@/lib/categories";

const CategoriesSection = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [dbCourses, setDbCourses] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [courseCounts, setCourseCounts] = useState<Record<string, number>>({});
  const { symbol, priceKey, originalPriceKey } = useCurrency();
  const { t } = useTranslation();

  // Fetch course counts per category on mount
  useEffect(() => {
    const fetchCounts = async () => {
      const { data } = await supabase
        .from("courses")
        .select("category")
        .eq("is_published", true)
        .eq("approval_status", "approved");

      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((c) => {
          const catName = c.category;
          const isPredefined = PREDEFINED_CATEGORIES.some((pc) => pc.name === catName);
          const key = isPredefined ? catName : "Others";
          counts[key] = (counts[key] || 0) + 1;
        });
        setCourseCounts(counts);
      }
    };
    fetchCounts();
  }, []);

  useEffect(() => {
    if (!activeCategory) return;
    setLoading(true);
    trackEvent("category_click", { category: activeCategory });

    const fetchCourses = async () => {
      let query = supabase
        .from("courses")
        .select("*")
        .eq("is_published", true)
        .eq("approval_status", "approved");

      if (activeCategory === "Others") {
        // Fetch courses NOT in any predefined category
        const predefinedNames = PREDEFINED_CATEGORIES.filter((c) => c.name !== "Others").map((c) => c.name);
        // Use NOT IN via individual neq is tedious; fetch all and filter client-side
        const { data } = await query.limit(50);
        const list = (data || []).filter((c) => !predefinedNames.includes(c.category));
        setDbCourses(list.slice(0, 3));
        await fetchCoaches(list.slice(0, 3));
      } else {
        query = query.eq("category", activeCategory).limit(3);
        const { data } = await query;
        const list = data || [];
        setDbCourses(list);
        await fetchCoaches(list);
      }

      setLoading(false);
    };

    const fetchCoaches = async (list: any[]) => {
      const coachIds = [...new Set(list.map((c) => c.coach_id))];
      if (coachIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", coachIds);
        const map: Record<string, string> = {};
        (profiles || []).forEach((p) => { map[p.user_id] = p.full_name || "Coach"; });
        setCoaches(map);
      }
    };

    fetchCourses();
  }, [activeCategory]);

  const activeCatObj = PREDEFINED_CATEGORIES.find((c) => c.name === activeCategory);

  const handleCardClick = (catName: string, slug: string) => {
    if (activeCategory === catName) {
      // Already active — navigate to full page
      navigate(`/courses/${slug}`);
    } else {
      setActiveCategory(catName);
    }
  };

  return (
    <section className="py-12 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold text-foreground">{t("categories.title")}</h2>
          <p className="text-muted-foreground">{t("categories.subtitle")}</p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {PREDEFINED_CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => handleCardClick(cat.name, cat.slug)}
              className={`group cursor-pointer rounded-xl border p-4 text-center transition-all duration-200 hover:scale-[1.03] hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 sm:p-6 ${
                activeCategory === cat.name
                  ? "border-primary bg-secondary shadow-md shadow-primary/10"
                  : "border-border bg-card"
              }`}
            >
              <div className="mb-2 text-2xl sm:mb-3 sm:text-3xl">{cat.emoji}</div>
              <h3 className="mb-1 text-xs font-semibold text-foreground sm:text-sm">{cat.name}</h3>
              <p className="text-xs text-muted-foreground">
                {courseCounts[cat.name] || 0} {t("categories.courses")}
              </p>
            </button>
          ))}
        </div>

        {activeCategory && activeCatObj && (
          <div className="mx-auto mt-8 max-w-5xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{activeCategory}</h3>
                  <p className="text-xs text-muted-foreground">Top {t("categories.courses")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to={`/courses/${activeCatObj.slug}`}
                    className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:brightness-110"
                  >
                    View All <ArrowRight className="h-3 w-3" />
                  </Link>
                  <button onClick={() => setActiveCategory(null)} className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : dbCourses.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground mb-3">{t("categories.noCourses")}</p>
                  <p className="text-xs text-muted-foreground">No courses available yet. Be the first coach to create one!</p>
                  <Link to="/auth?mode=signup" className="mt-3 inline-block rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:brightness-110">
                    + Create Course
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {dbCourses.map((course) => {
                    const price = Number(course[priceKey] || course.price_usd);
                    const originalPrice = Number(course[originalPriceKey] || course.original_price_usd || 0);
                    const coachName = coaches[course.coach_id] || "";
                    return (
                      <Link
                        to={`/course/${course.slug || course.id}`}
                        key={course.id}
                        onClick={() => trackEvent("course_click", { course: course.title, coach: coachName })}
                        className="group/card flex flex-col rounded-lg border border-border bg-background p-4 transition-all hover:border-primary/20 hover:shadow-md"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">{course.level}</span>
                          {Number(course.discount_percent) > 0 && (
                            <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">{Number(course.discount_percent)}% {t("common.off")}</span>
                          )}
                        </div>
                        <h4 className="mb-1 text-sm font-bold leading-snug text-foreground">{course.title}</h4>
                        {coachName && (
                          <p className="mb-3 text-xs text-muted-foreground">by {coachName}</p>
                        )}
                        <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{Number(course.duration_hours)}h</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">{symbol}{price}</span>
                            {originalPrice > price && (
                              <span className="text-xs text-muted-foreground line-through">{symbol}{originalPrice}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoriesSection;
