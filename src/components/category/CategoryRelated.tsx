import { Link } from "react-router-dom";
import { categoryMap } from "@/pages/CategoryPage";

const CategoryRelated = ({ currentSlug }: { currentSlug: string }) => {
  const others = Object.entries(categoryMap).filter(([slug]) => slug !== currentSlug);

  return (
    <section className="border-t border-border bg-card/30 py-12">
      <div className="container mx-auto px-4">
        <h2 className="mb-6 text-xl font-bold text-foreground">Explore Other Categories</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {others.map(([slug, cat]) => (
            <Link
              key={slug}
              to={`/courses/${slug}`}
              className="group cursor-pointer rounded-xl border border-border bg-card p-4 text-center transition-all duration-200 hover:scale-[1.03] hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
            >
              <span className="mb-2 block text-2xl">{cat.emoji}</span>
              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary">{cat.name}</h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryRelated;
