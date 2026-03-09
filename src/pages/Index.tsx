import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CategoriesSection from "@/components/CategoriesSection";
import CoachesSection from "@/components/CoachesSection";
import CoursesSection from "@/components/CoursesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import CTASection from "@/components/CTASection";
import HomeBlogSection from "@/components/HomeBlogSection";
import Footer from "@/components/Footer";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "AI Coach Portal",
  "url": "https://allcoachhub.lovable.app",
  "description": "Master AI skills with 50+ expert coaches. Courses in prompt engineering, AI agents, automation & more.",
  "sameAs": [
    "https://x.com/Aicoachportal",
    "https://www.linkedin.com/company/aicoachportal/",
    "https://www.instagram.com/aicoachportal/",
    "https://www.facebook.com/people/Aicoachportal/61588588206814/",
    "https://www.youtube.com/@AicoachPortal"
  ]
};

const Index = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      setTimeout(() => {
        const el = document.querySelector(location.hash);
        el?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <header id="hero">
        <HeroSection />
      </header>
      <main>
        <section id="categories"><CategoriesSection /></section>
        <section id="coaches"><CoachesSection /></section>
        <section id="courses"><CoursesSection /></section>
        <section id="how-it-works"><HowItWorksSection /></section>
        <section id="testimonials"><TestimonialsSection /></section>
        <section id="blogs"><HomeBlogSection /></section>
        <section id="cta"><CTASection /></section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
