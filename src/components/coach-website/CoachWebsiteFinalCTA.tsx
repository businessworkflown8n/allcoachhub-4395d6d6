import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface Props {
  themeColor: string;
  contentSections?: any;
}

const CoachWebsiteFinalCTA = ({ themeColor, contentSections }: Props) => {
  const cs = contentSections || {};
  const headline = cs.cta_headline || "Start Your Learning Journey Today";
  const subtext = cs.cta_subtext || "Don't wait — take the first step toward your new career. Join hundreds of successful students.";

  const scrollToDemo = () => document.getElementById("cw-demo")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="py-16" style={{ background: `linear-gradient(135deg, ${themeColor}15, transparent, ${themeColor}10)` }}>
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">{headline}</h2>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">{subtext}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" className="gap-2 text-base font-semibold" style={{ backgroundColor: themeColor }} onClick={scrollToDemo}>
            Book Free Demo <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" className="text-base font-semibold" onClick={() => document.getElementById("cw-courses")?.scrollIntoView({ behavior: "smooth" })}>
            Explore Courses
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CoachWebsiteFinalCTA;
