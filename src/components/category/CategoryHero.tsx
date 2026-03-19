import { Link } from "react-router-dom";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage,
} from "@/components/ui/breadcrumb";

interface CategoryHeroProps {
  cat: { name: string; emoji: string; description: string };
  slug: string;
  totalCourses: number;
  loading: boolean;
}

const CategoryHero = ({ cat, slug, totalCourses, loading }: CategoryHeroProps) => (
  <section className="border-b border-border bg-card/50 py-12 md:py-16">
    <div className="container mx-auto px-4">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink asChild><Link to="/courses">Courses</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{cat.name}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-4">
          <span className="text-5xl">{cat.emoji}</span>
          <div>
            <h1 className="text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">{cat.name} Courses</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">{cat.description}</p>
            <div className="mt-3 flex items-center gap-3">
              {!loading && (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                  {totalCourses} Course{totalCourses !== 1 ? "s" : ""} Available
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            to="/courses"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            All Courses
          </Link>
          <Link
            to="/auth"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
          >
            Become a Coach
          </Link>
        </div>
      </div>
    </div>
  </section>
);

export default CategoryHero;
