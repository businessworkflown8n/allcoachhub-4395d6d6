import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  CheckCircle, Loader2, ArrowRight, Star, Users, Zap, Shield,
  TrendingUp, DollarSign, Award, Sparkles, Quote, GraduationCap,
  Target, BarChart3, Clock
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const LandingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", mobile: "", years_of_expertise: "", city: "",
    specialization: "", linkedin_url: "", current_students: "",
  });

  useEffect(() => {
    const fetchPage = async () => {
      const { data } = await supabase
        .from("landing_pages")
        .select("*")
        .eq("slug", slug)
        .single();
      setPage(data);
      setLoading(false);
    };
    if (slug) fetchPage();
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
      navigate(`/lp/${slug}/thank-you?name=${encodeURIComponent(form.name)}&category=${encodeURIComponent(page.category || '')}`);
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
  const category = page.category || "Expert";

  const testimonials = [
    { name: "Rahul Sharma", role: `${category} Coach`, text: `Joining this platform was the best decision. I got 40+ students in my first month without spending on ads!`, rating: 5, students: "120+" },
    { name: "Priya Mehta", role: `${category} Mentor`, text: `The pay-after-admission model removed all my risk. I focus on teaching, they handle everything else.`, rating: 5, students: "85+" },
    { name: "Vikram Singh", role: `${category} Trainer`, text: `My revenue tripled in 3 months. The platform's marketing engine is incredibly powerful.`, rating: 5, students: "200+" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-56 h-56 bg-primary/3 rounded-full blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <Badge variant="secondary" className="mb-4 text-sm px-4 py-1.5 bg-primary/10 text-primary border-primary/20">
                🔥 {category} Coaching — Limited Slots
              </Badge>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                {page.headline}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                {page.subheadline}
              </p>

              {/* Value Props */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-card/60 border border-border/50">
                  <DollarSign className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm font-medium text-foreground">Pay After Admissions</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-card/60 border border-border/50">
                  <Users className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm font-medium text-foreground">Get Students at Low Cost</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-card/60 border border-border/50">
                  <TrendingUp className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm font-medium text-foreground">Zero Upfront Fees</span>
                </div>
              </div>

              <Button
                size="lg"
                className="text-lg px-8 py-6 shadow-lg shadow-primary/20"
                onClick={() => document.getElementById("lp-form")?.scrollIntoView({ behavior: "smooth" })}
              >
                Start Getting Students <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Stats Card on Hero */}
            <div className="hidden lg:block">
              <Card className="border-border/30 bg-card/40 backdrop-blur-lg p-6 space-y-5">
                <h3 className="text-lg font-semibold text-foreground text-center">Platform Highlights</h3>
                {[
                  { icon: GraduationCap, label: "Students Placed", value: "10,000+", color: "text-primary" },
                  { icon: Award, label: "Coaches Earning ₹1L+/mo", value: "200+", color: "text-green-400" },
                  { icon: Target, label: "Avg. Cost Per Student", value: "₹150", color: "text-blue-400" },
                  { icon: BarChart3, label: "Coach Satisfaction", value: "4.9★", color: "text-yellow-400" },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                    <stat.icon className={`h-6 w-6 ${stat.color} shrink-0`} />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-xl font-bold text-foreground">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pay After Admissions Section */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-primary/5 via-background to-primary/5">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">RISK-FREE MODEL</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
            Get Students at Less Cost — Pay Only After Admissions
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto mb-10">
            No upfront investment. No marketing headaches. We bring students to you and you only pay when they enroll. It's that simple.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Zero Risk", desc: "No joining fee, no monthly charges. Pay only when students join your course." },
              { icon: DollarSign, title: "80% Lower Cost", desc: "Our platform acquires students at 80% less cost than traditional ads." },
              { icon: Clock, title: "Start in 24 Hours", desc: "Get your profile live and start receiving student inquiries within a day." },
            ].map((item, i) => (
              <Card key={i} className="border-border/30 bg-card/60 backdrop-blur-sm hover:border-primary/30 transition-all group">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      {benefits.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-3">
              Why Join as a {category} Coach?
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Everything you need to build a thriving coaching business — all in one platform.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {benefits.map((b: string, i: number) => (
                <Card key={i} className="border-border/40 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all">
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-foreground font-medium">{b}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      <section className="py-16 md:py-20 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3 bg-primary/10 text-primary border-primary/20">
              <Quote className="h-3 w-3 mr-1" /> Coach Success Stories
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Coaches Love Our Platform
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Card key={i} className="border-border/30 bg-card/60 backdrop-blur-sm hover:border-primary/20 transition-all">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-1">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground text-sm italic leading-relaxed">"{t.text}"</p>
                  <div className="flex items-center justify-between pt-2 border-t border-border/30">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                    <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                      {t.students} students
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      {howItWorks.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {howItWorks.map((h, i) => (
                <div key={i} className="text-center space-y-3 relative">
                  {i < howItWorks.length - 1 && (
                    <div className="hidden md:block absolute top-7 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/40 to-transparent" />
                  )}
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-xl font-bold text-primary">
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
      <section id="lp-form" className="py-16 md:py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-xl mx-auto px-4">
          <Card className="border-border/30 bg-card/80 backdrop-blur-lg shadow-2xl shadow-primary/5">
            <CardContent className="p-8 md:p-10">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Register as a Coach</h2>
                <p className="text-muted-foreground mt-2">Fill in your details to get started — it's free!</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                {[
                  { label: "Full Name", key: "name", type: "text", placeholder: "Your full name", required: true },
                  { label: "Email", key: "email", type: "email", placeholder: "you@example.com", required: true },
                  { label: "Mobile Number", key: "mobile", type: "tel", placeholder: "+91 98765 43210", required: true },
                  { label: "Specialization", key: "specialization", type: "text", placeholder: `e.g. ${category} Strategy, Leadership` },
                  { label: "Years of Expertise", key: "years_of_expertise", type: "number", placeholder: "e.g. 5" },
                  { label: "City", key: "city", type: "text", placeholder: "Your city" },
                  { label: "Current Students (approx)", key: "current_students", type: "number", placeholder: "e.g. 50" },
                  { label: "LinkedIn Profile", key: "linkedin_url", type: "url", placeholder: "https://linkedin.com/in/yourprofile" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      {field.label} {field.required && <span className="text-red-400">*</span>}
                    </label>
                    <Input
                      type={field.type}
                      value={(form as any)[field.key]}
                      onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      required={field.required}
                      className="h-12 bg-muted/30 border-border/50 focus:border-primary/50"
                    />
                  </div>
                ))}
                <Button type="submit" className="w-full text-lg py-6 mt-2 shadow-lg shadow-primary/20" disabled={submitting}>
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                  Submit Application
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  🔒 Your information is secure. No spam, ever.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trust Section */}
      {trustPoints.length > 0 && (
        <section className="py-12 md:py-16">
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
