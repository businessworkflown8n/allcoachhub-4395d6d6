import { Award, Users, BookOpen, Calendar, TrendingUp, Star } from "lucide-react";

interface Props {
  courseCount: number;
  themeColor: string;
  contentSections?: any;
}

const iconMap: Record<string, any> = {
  students: Users, courses: BookOpen, experience: Calendar, years: Calendar,
  success: TrendingUp, rate: TrendingUp, rating: Star, award: Award,
};

const getIcon = (label: string) => {
  const l = label.toLowerCase();
  for (const [key, Icon] of Object.entries(iconMap)) {
    if (l.includes(key)) return Icon;
  }
  return Award;
};

const CoachWebsiteStats = ({ courseCount, themeColor, contentSections }: Props) => {
  const cs = contentSections || {};
  const stats = cs.stats || [
    { value: "500+", label: "Students Trained" },
    { value: String(courseCount || "10+"), label: "Courses Available" },
    { value: "3+", label: "Years Experience" },
    { value: "95%", label: "Success Rate" },
  ];

  return (
    <section className="border-b border-border bg-secondary/30 py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.filter((s: any) => s.value && s.label).map((s: any) => {
            const Icon = getIcon(s.label);
            return (
              <div key={s.label} className="flex flex-col items-center text-center">
                <Icon className="mb-2 h-6 w-6" style={{ color: themeColor }} />
                <span className="text-2xl font-bold text-foreground sm:text-3xl">{s.value}</span>
                <span className="text-xs text-muted-foreground sm:text-sm">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CoachWebsiteStats;
