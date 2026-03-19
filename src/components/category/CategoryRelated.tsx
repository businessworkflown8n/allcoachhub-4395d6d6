import { Link } from "react-router-dom";
import { categoryMap } from "@/pages/CategoryPage";

const CategoryRelated = ({ currentSlug }: { currentSlug: string }) => {
  const others = Object.entries(categoryMap).filter(([slug]) => slug !== currentSlug);

  return (
    <section className="border-t border-border bg-card/30 py-12">
      <div className="container mx-auto px-4">
        <h2 className="mb-6 text-xl font-bold text-foreground">Explore Other Categories</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {others.map(([slug, cat]) => (
            <Link
              key={slug}
              to={`/courses/${slug}`}
              className="group rounded-xl border border-border bg-card p-4 text-center transition-all hover:border-primary/30 hover:shadow-md"
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
