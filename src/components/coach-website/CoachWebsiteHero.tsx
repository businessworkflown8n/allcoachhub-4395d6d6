import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, MapPin, Star, Users, BookOpen, Play } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  site: any;
  coach: any;
  courseCount: number;
  themeColor: string;
}

const CoachWebsiteHero = ({ site, coach, courseCount, themeColor }: Props) => {
  const scrollToCourses = () => document.getElementById("cw-courses")?.scrollIntoView({ behavior: "smooth" });
  const scrollToDemo = () => document.getElementById("cw-demo")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="relative overflow-hidden border-b border-border py-20 lg:py-32">
      {site.banner_url && (
        <div className="absolute inset-0">
          <img src={site.banner_url} alt="Banner" className="h-full w-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>
      )}
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(ellipse at top, ${themeColor}18, transparent 70%)` }}
      />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          {site.logo_url && (
            <img
              src={site.logo_url}
              alt={site.institute_name}
              className="mx-auto mb-6 h-20 w-20 rounded-2xl border-2 object-cover shadow-lg"
              style={{ borderColor: themeColor }}
            />
          )}

          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-6xl">
            {site.institute_name}
          </h1>

          {site.tagline && (
            <p className="mt-4 text-lg text-muted-foreground sm:text-xl">{site.tagline}</p>
          )}

          {coach && (
            <p className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              by <span className="font-medium text-foreground">{coach.full_name}</span>
              {coach.country && (
                <>
                  <MapPin className="h-3.5 w-3.5" /> {coach.country}
                </>
              )}
            </p>
          )}

          {/* Trust Badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {courseCount > 0 && (
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs">
                <BookOpen className="h-3.5 w-3.5" /> {courseCount} Courses
              </Badge>
            )}
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs">
              <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" /> 4.8 Rating
            </Badge>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs">
              <Users className="h-3.5 w-3.5" /> 500+ Students
            </Badge>
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="gap-2 text-base font-semibold" style={{ backgroundColor: themeColor }} onClick={scrollToDemo}>
              <Play className="h-4 w-4" /> Book Free Demo
            </Button>
            {courseCount > 0 && (
              <Button size="lg" variant="outline" className="text-base font-semibold" onClick={scrollToCourses}>
                <GraduationCap className="h-4 w-4 mr-2" /> View Courses
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoachWebsiteHero;
