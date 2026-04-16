import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Globe, BookOpen, Newspaper, Video, Zap, UserPlus, Download } from "lucide-react";

const sections = [
  {
    title: "Main Pages",
    icon: <Globe className="h-5 w-5 text-primary" />,
    links: [
      { label: "Home", to: "/" },
      { label: "All Courses", to: "/courses" },
      { label: "Webinars", to: "/webinars" },
      
      { label: "Install App", to: "/install" },
    ],
  },
  {
    title: "AI Jobs & News Hub",
    icon: <Newspaper className="h-5 w-5 text-primary" />,
    links: [
      { label: "All AI Blogs", to: "/ai-blogs" },
      { label: "AI Trends", to: "/ai-jobs-news/ai-trends" },
      { label: "AI in Education", to: "/ai-jobs-news/ai-education" },
      { label: "AI Tools", to: "/ai-jobs-news/ai-tools" },
      { label: "AI Fundamentals", to: "/ai-jobs-news/ai-fundamentals" },
      { label: "AI Careers", to: "/ai-jobs-news/ai-careers" },
      { label: "AI Research", to: "/ai-jobs-news/ai-research" },
      { label: "AI Policy", to: "/ai-jobs-news/ai-policy" },
      { label: "Weekly AI News", to: "/ai-jobs-news/weekly-ai-news" },
    ],
  },
  {
    title: "Featured Articles",
    icon: <BookOpen className="h-5 w-5 text-primary" />,
    links: [
      { label: "How to Learn AI in 2026 – Complete Beginner Guide", to: "/ai-blogs/how-to-learn-ai-in-2026-complete-beginner-guide" },
      { label: "Best AI Tools Everyone Should Learn in 2026", to: "/ai-blogs/best-ai-tools-everyone-should-learn-2026" },
      { label: "How to Become an AI Coach & Earn Money Online", to: "/ai-blogs/how-to-become-ai-coach-earn-money-online" },
      { label: "Top AI Skills in Demand 2026", to: "/ai-blogs/top-ai-skills-in-demand-2026" },
      { label: "Best AI Courses – Learn Artificial Intelligence Online", to: "/ai-blogs/best-ai-courses-learn-artificial-intelligence-online" },
      { label: "How AI Is Changing Jobs and Careers", to: "/ai-blogs/how-ai-is-changing-jobs-and-careers" },
    ],
  },
  {
    title: "Account & Auth",
    icon: <UserPlus className="h-5 w-5 text-primary" />,
    links: [
      { label: "Choose Role (Login / Signup)", to: "/auth" },
      { label: "Learner Login", to: "/login/learner" },
      { label: "Coach Login", to: "/login/coach" },
      { label: "Learner Signup", to: "/signup/learner" },
      { label: "Coach Signup", to: "/signup/coach" },
    ],
  },
];

const Sitemap = () => {
  useSEO({
    title: "Sitemap – AI Coach Portal | All Pages & Resources",
    description: "Browse the complete sitemap of AI Coach Portal. Find all courses, blogs, webinars, and resources in one place.",
    canonical: "https://www.aicoachportal.com/sitemap",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Sitemap</h1>
        <p className="text-muted-foreground mb-8">
          A complete list of all pages on AI Coach Portal for easy navigation.
        </p>

        <div className="grid gap-8 md:grid-cols-2">
          {sections.map((section) => (
            <div key={section.title} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                {section.icon}
                <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              </div>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-primary hover:underline hover:text-primary/80 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-border bg-muted/30 p-5 text-center">
          <p className="text-sm text-muted-foreground">
            XML Sitemap for search engines:{" "}
            <a
              href="https://www.aicoachportal.com/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              https://www.aicoachportal.com/sitemap.xml
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Sitemap;
