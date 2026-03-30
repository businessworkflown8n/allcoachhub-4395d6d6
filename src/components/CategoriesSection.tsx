import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/i18n/TranslationProvider";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
  coachCount: number;
}

const CategoriesSection = () => {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      const { data: cats } = await supabase
        .from("coach_categories")
        .select("id, name, slug, icon, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (!cats || cats.length === 0) {
        setLoading(false);
        return;
      }

      // Get coach counts per category_id
      const { data: profiles } = await supabase
        .from("profiles")
        .select("category_id")
        .not("category_id", "is", null);

      const counts: Record<string, number> = {};
      (profiles || []).forEach((p: any) => {
        counts[p.category_id] = (counts[p.category_id] || 0) + 1;
      });

      setCategories(
        cats.map((c) => ({
          ...c,
          coachCount: counts[c.id] || 0,
        }))
      );
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <section className="py-12 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold text-foreground">
            {t("categories.title")}
          </h2>
          <p className="text-muted-foreground">{t("categories.subtitle")}</p>
        </div>

        {loading ? (
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-center text-muted-foreground">No categories available yet.</p>
        ) : (
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/categories/${cat.slug}`}
                className="group cursor-pointer rounded-xl border border-border bg-card p-4 text-center transition-all duration-200 hover:scale-[1.03] hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 sm:p-6"
              >
                <div className="mb-2 text-2xl sm:mb-3 sm:text-3xl">
                  {cat.icon || "📂"}
                </div>
                <h3 className="mb-1 text-xs font-semibold text-foreground sm:text-sm">
                  {cat.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {cat.coachCount} {cat.coachCount === 1 ? "coach" : "coaches"}
                </p>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            to="/categories"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
          >
            View All Categories →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
