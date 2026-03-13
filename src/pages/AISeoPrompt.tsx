import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, Sparkles, Lock, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const DOCUMENT_URL = "https://docs.google.com/document/d/1YST8WemQag2Qu8Kqivrg3KEzTXQDvMXkQ_Uh-7uPXsc/edit";

const AISeoPrompt = () => {
  const { user } = useAuth();

  useSEO({
    title: "100+ AI SEO Prompts for ChatGPT, Gemini & Claude | AI Coach Portal",
    description: "Access 100+ AI SEO prompts that you can use with ChatGPT, Gemini, and Claude to improve your SEO workflow. Register to unlock the prompts.",
    canonical: "https://www.aicoachportal.com/ai-jobs-news/ai-research/ai-seo-prompt",
    ogTitle: "100+ AI SEO Prompts for ChatGPT, Gemini & Claude",
    ogDescription: "Access 100+ AI SEO prompts to supercharge your SEO workflow with AI tools.",
  });

  const handleGetPrompts = () => {
    if (user) {
      window.open(DOCUMENT_URL, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = "/signup/learner?redirect=/ai-jobs-news/ai-research/ai-seo-prompt";
    }
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "100+ AI SEO Prompts",
    description: "Access 100+ AI SEO prompts for ChatGPT, Gemini, and Claude.",
    url: "https://www.aicoachportal.com/ai-jobs-news/ai-research/ai-seo-prompt",
    isPartOf: {
      "@type": "Blog",
      name: "AI Research",
      url: "https://www.aicoachportal.com/ai-jobs-news/ai-research",
    },
    publisher: { "@type": "Organization", name: "AI Coach Portal" },
  };

  const features = [
    "Keyword research & topic clustering prompts",
    "On-page SEO optimization prompts",
    "Content brief & outline generation",
    "Technical SEO audit prompts",
    "Link building & outreach templates",
    "Local SEO & schema markup prompts",
  ];

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <main className="pt-16">
        {/* Hero */}
        <section className="border-b border-border bg-card/50 py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary w-fit mb-6">
              <Sparkles className="h-4 w-4" />
              AI Research · Free Resource
            </div>
            <h1 className="text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
              100+ AI SEO Prompts
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Access 100+ AI SEO prompts that you can use with <strong className="text-foreground">ChatGPT</strong>, <strong className="text-foreground">Gemini</strong>, and <strong className="text-foreground">Claude</strong> to improve your SEO workflow.
            </p>
            {!user && (
              <p className="mt-2 text-sm text-muted-foreground">
                Register to unlock the prompts.
              </p>
            )}
            <div className="mt-8">
              <Button
                size="lg"
                onClick={handleGetPrompts}
                className="gap-2 px-8 py-6 text-base font-semibold"
              >
                {user ? (
                  <>
                    <FileText className="h-5 w-5" />
                    Get 100+ AI SEO Prompts
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5" />
                    Get 100+ AI SEO Prompts
                  </>
                )}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
            {user && (
              <p className="mt-3 text-sm text-muted-foreground">
                ✅ You're logged in — click to open the document
              </p>
            )}
          </div>
        </section>

        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 pt-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/ai-blogs">AI Jobs & News</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/ai-jobs-news/ai-research">AI Research</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>AI SEO Prompts</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* What's included */}
        <section className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-foreground text-center mb-8">What's Inside the Prompt Pack</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Second CTA */}
        <section className="border-t border-border bg-card/50 py-12">
          <div className="container mx-auto max-w-2xl px-4 text-center">
            <h2 className="text-2xl font-bold text-foreground">Ready to Supercharge Your SEO?</h2>
            <p className="mt-2 text-muted-foreground">
              {user
                ? "Access the prompts now and start improving your SEO workflow."
                : "Sign up for free and get instant access to 100+ AI SEO prompts."}
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" onClick={handleGetPrompts} className="gap-2">
                {user ? "Open Prompts Document" : "Register & Get Prompts"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Link to="/courses" className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-6 py-3 font-semibold text-foreground hover:bg-border">
                Explore AI Courses
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AISeoPrompt;
