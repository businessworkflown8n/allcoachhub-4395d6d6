import { Award, Users, BookOpen, Calendar } from "lucide-react";

interface Props {
  courseCount: number;
  themeColor: string;
}

const CoachWebsiteStats = ({ courseCount, themeColor }: Props) => {
  const stats = [
    { icon: Users, value: "500+", label: "Students Trained" },
    { icon: BookOpen, value: String(courseCount || "10+"), label: "Courses Available" },
    { icon: Calendar, value: "3+", label: "Years Experience" },
    { icon: Award, value: "95%", label: "Success Rate" },
  ];

  return (
    <section className="border-b border-border bg-secondary/30 py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center text-center">
              <s.icon className="mb-2 h-6 w-6" style={{ color: themeColor }} />
              <span className="text-2xl font-bold text-foreground sm:text-3xl">{s.value}</span>
              <span className="text-xs text-muted-foreground sm:text-sm">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoachWebsiteStats;
