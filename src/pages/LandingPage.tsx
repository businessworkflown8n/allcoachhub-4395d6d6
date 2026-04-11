import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, Loader2, ArrowRight, Star, Users, Zap, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const LandingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", mobile: "", years_of_expertise: "", city: "" });

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("landing_pages")
        .select("*")
        .eq("slug", slug)
        .single();
      setPage(data);
      setLoading(false);
    };
    if (slug) fetch();
  }, [slug]);

  useSEO({
    title: page?.meta_title || page?.headline || "Landing Page",
    description: page?.meta_description || page?.subheadline || "",
    canonical: `https://www.aicoachportal.com/lp/${slug}`,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.mobile) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("landing_page_leads").insert({
      landing_page_id: page.id,
      name: form.name,
      email: form.email,
      mobile: form.mobile,
      years_of_expertise: form.years_of_expertise ? parseInt(form.years_of_expertise) : null,
      city: form.city || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
    } else {
      setSubmitted(true);
      toast({ title: "Application submitted successfully!" });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <p className="text-muted-foreground text-lg">Landing page not found.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const benefits: string[] = Array.isArray(page.benefits) ? page.benefits : [];
  const howItWorks: { step: string; description: string }[] = Array.isArray(page.how_it_works) ? page.how_it_works : [];
  const trustPoints: string[] = Array.isArray(page.trust_points) ? page.trust_points : [];
  const themeColor = page.theme_color || "#84cc16";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4 text-sm px-4 py-1">{page.category} Coaching</Badge>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            {page.headline}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            {page.subheadline}
          </p>
          <Button
            size="lg"
            className="text-lg px-8 py-6"
            onClick={() => document.getElementById("lp-form")?.scrollIntoView({ behavior: "smooth" })}
          >
            Apply Now <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Benefits Section */}
      {benefits.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">Why Join as a {page.category} Coach?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {benefits.map((b: string, i: number) => (
                <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-foreground">{b}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      {howItWorks.length > 0 && (
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {howItWorks.map((h, i) => (
                <div key={i} className="text-center space-y-3">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto text-xl font-bold text-primary-foreground"
                    style={{ backgroundColor: themeColor }}
                  >
                    {i + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{h.step}</h3>
                  <p className="text-muted-foreground text-sm">{h.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Registration Form */}
      <section id="lp-form" className="py-16 md:py-20">
        <div className="max-w-xl mx-auto px-4">
          <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-8">
              {submitted ? (
                <div className="text-center py-8 space-y-4">
                  <CheckCircle className="h-16 w-16 text-primary mx-auto" />
                  <h3 className="text-2xl font-bold text-foreground">Application Submitted!</h3>
                  <p className="text-muted-foreground">We'll review your application and get back to you shortly.</p>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-foreground text-center mb-2">Register as a Coach</h2>
                  <p className="text-muted-foreground text-center mb-6">Fill in your details to get started</p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Full Name *</label>
                      <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Your full name" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Email *</label>
                      <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="you@example.com" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Mobile Number *</label>
                      <Input value={form.mobile} onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))} placeholder="+91 98765 43210" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Years of Expertise</label>
                      <Input type="number" value={form.years_of_expertise} onChange={(e) => setForm((f) => ({ ...f, years_of_expertise: e.target.value }))} placeholder="e.g. 5" min="0" max="50" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">City</label>
                      <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="Your city" />
                    </div>
                    <Button type="submit" className="w-full text-lg py-6" disabled={submitting}>
                      {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                      Submit Application
                    </Button>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trust Section */}
      {trustPoints.length > 0 && (
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-8">
              {trustPoints.map((t: string, i: number) => {
                const icons = [Star, Users, Zap, Shield];
                const Icon = icons[i % icons.length];
                return (
                  <div key={i} className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{t}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default LandingPage;
