import { Star, Clock, Users } from "lucide-react";

const courses = [
  {
    emoji: "🎓",
    level: "Beginner",
    discount: "51% OFF",
    category: "Prompt Engineering",
    title: "Master Prompt Engineering: From Zero to Expert",
    hours: 8,
    students: 1240,
    instructor: { initials: "SC", name: "Sarah Chen" },
    rating: 4.9,
    reviews: 312,
    price: 49,
    originalPrice: 99,
  },
  {
    emoji: "🎓",
    level: "Intermediate",
    discount: "47% OFF",
    category: "AI Agents",
    title: "Build AI Agents with No Code",
    hours: 12,
    students: 890,
    instructor: { initials: "LN", name: "Lina Nakamura" },
    rating: 4.8,
    reviews: 187,
    price: 69,
    originalPrice: 129,
  },
  {
    emoji: "🎓",
    level: "Beginner",
    discount: null,
    category: "AI for Marketing",
    title: "AI-Powered Marketing Masterclass",
    hours: 6,
    students: 720,
    instructor: { initials: "JT", name: "Jake Thompson" },
    rating: 4.7,
    reviews: 156,
    price: 39,
    originalPrice: null,
  },
  {
    emoji: "🎓",
    level: "Advanced",
    discount: "50% OFF",
    category: "LLMs & Fine-tuning",
    title: "Fine-Tune Your Own LLM",
    hours: 16,
    students: 430,
    instructor: { initials: "DA", name: "Dr. Aisha Patel" },
    rating: 4.9,
    reviews: 98,
    price: 99,
    originalPrice: 199,
  },
];

const CoursesSection = () => {
  return (
    <section id="courses" className="py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="mb-3 text-3xl font-bold text-foreground">Popular Courses</h2>
            <p className="text-muted-foreground">Top-rated courses chosen by thousands of students</p>
          </div>
          <button className="text-sm font-medium text-primary transition-colors hover:underline">View All →</button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {courses.map((course) => (
            <div
              key={course.title}
              className="group flex flex-col rounded-xl border border-border bg-card transition-all hover:border-primary/20"
            >
              <div className="border-b border-border p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-2xl">{course.emoji}</span>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">{course.level}</span>
                  {course.discount && (
                    <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">{course.discount}</span>
                  )}
                </div>
                <p className="mb-1 text-xs text-primary">{course.category}</p>
                <h3 className="text-sm font-bold leading-snug text-foreground">{course.title}</h3>
              </div>

              <div className="flex flex-1 flex-col justify-between p-5">
                <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {course.hours} hours</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {course.students.toLocaleString()}</span>
                </div>

                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {course.instructor.initials}
                  </div>
                  <span className="text-xs text-muted-foreground">{course.instructor.name}</span>
                  <div className="ml-auto flex items-center gap-1">
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    <span className="text-xs font-medium text-foreground">{course.rating}</span>
                    <span className="text-xs text-muted-foreground">({course.reviews})</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-foreground">${course.price}</span>
                    {course.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">${course.originalPrice}</span>
                    )}
                  </div>
                  <button className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:brightness-110">
                    Enroll
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoursesSection;
