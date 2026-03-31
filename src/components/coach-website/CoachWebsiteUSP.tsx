import { Monitor, Video, Briefcase, Award, Users, Lightbulb, Shield, Zap } from "lucide-react";

interface Props {
  themeColor: string;
  contentSections?: any;
}

const iconPool = [Users, Video, Monitor, Briefcase, Award, Lightbulb, Shield, Zap];

const defaultUsps = [
  { title: "Industry Expert Coaches", desc: "Learn from professionals with real-world experience." },
  { title: "Live + Recorded Sessions", desc: "Attend live or revisit recordings at your pace." },
  { title: "Hands-On Projects", desc: "Apply skills with practical, real-world projects." },
  { title: "Career Support", desc: "Resume reviews, interview prep, and job placement." },
  { title: "Certification", desc: "Earn recognized certificates on completion." },
  { title: "Lifetime Access", desc: "Access course materials anytime, forever." },
];

const CoachWebsiteUSP = ({ themeColor, contentSections }: Props) => {
  const usps = (contentSections?.usps?.length > 0 ? contentSections.usps : defaultUsps).filter((u: any) => u.title);

  return (
    <section className="border-b border-border py-14">
      <div className="container mx-auto px-4">
        <h2 className="mb-2 text-center text-2xl font-bold text-foreground">Why Choose Us</h2>
        <p className="mx-auto mb-10 max-w-xl text-center text-sm text-muted-foreground">
          Everything you need to accelerate your learning journey
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {usps.map((u: any, i: number) => {
            const Icon = iconPool[i % iconPool.length];
            return (
              <div key={i} className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-lg">
                <Icon className="mb-3 h-7 w-7" style={{ color: themeColor }} />
                <h3 className="mb-1 text-base font-semibold text-foreground">{u.title}</h3>
                <p className="text-sm text-muted-foreground">{u.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CoachWebsiteUSP;
