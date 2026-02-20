import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Star, Clock, Users } from "lucide-react";

const CoursesSection = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("courses").select("*").eq("is_published", true).limit(8).then(({ data }) => {
      setCourses(data || []);
      setLoading(false);
    });
  }, []);

  // Fallback static courses if no DB courses exist
  const staticCourses = [
    { id: "static-1", category: "Prompt Engineering", title: "Master Prompt Engineering: From Zero to Expert", duration_hours: 8, level: "Beginner", price_usd: 49, original_price_usd: 99, discount_percent: 51 },
    { id: "static-2", category: "AI Agents", title: "Build AI Agents with No Code", duration_hours: 12, level: "Intermediate", price_usd: 69, original_price_usd: 129, discount_percent: 47 },
    { id: "static-3", category: "AI for Marketing", title: "AI-Powered Marketing Masterclass", duration_hours: 6, level: "Beginner", price_usd: 39, original_price_usd: null, discount_percent: 0 },
    { id: "static-4", category: "LLMs & Fine-tuning", title: "Fine-Tune Your Own LLM", duration_hours: 16, level: "Advanced", price_usd: 99, original_price_usd: 199, discount_percent: 50 },
  ];

  const displayCourses = courses.length > 0 ? courses : staticCourses;

  return (
    <section id="courses" className="py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="mb-3 text-3xl font-bold text-foreground">Popular Courses</h2>
            <p className="text-muted-foreground">Top-rated courses chosen by thousands of students</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {displayCourses.map((course) => (
              <Link
                to={course.id?.startsWith("static") ? "#" : `/course/${course.id}`}
                key={course.id || course.title}
                className="group flex flex-col rounded-xl border border-border bg-card transition-all hover:border-primary/20"
              >
                <div className="border-b border-border p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-2xl">🎓</span>
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">{course.level}</span>
                    {Number(course.discount_percent) > 0 && (
                      <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">{Number(course.discount_percent)}% OFF</span>
                    )}
                  </div>
                  <p className="mb-1 text-xs text-primary">{course.category}</p>
                  <h3 className="text-sm font-bold leading-snug text-foreground">{course.title}</h3>
                </div>

                <div className="flex flex-1 flex-col justify-between p-5">
                  <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {Number(course.duration_hours)} hours</span>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-foreground">${Number(course.price_usd)}</span>
                      {course.original_price_usd && Number(course.original_price_usd) > Number(course.price_usd) && (
                        <span className="text-sm text-muted-foreground line-through">${Number(course.original_price_usd)}</span>
                      )}
                    </div>
                    <span className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-all group-hover:brightness-110">
                      Enroll
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CoursesSection;
