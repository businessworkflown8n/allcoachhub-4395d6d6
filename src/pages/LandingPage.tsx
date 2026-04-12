import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  CheckCircle, Loader2, ArrowRight, Star, Users, Zap, Shield,
  TrendingUp, DollarSign, Award, Sparkles, Quote, GraduationCap,
  Target, BarChart3, Clock, Phone, MessageCircle, X,
  LayoutDashboard, Megaphone, Eye, Heart, Lightbulb, Rocket,
  Globe, BookOpen, Trophy, Briefcase
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ICON_MAP: Record<string, any> = {
  DollarSign, Users, TrendingUp, Star, Shield, Zap, Award, Target, Clock,
  GraduationCap, BarChart3, Sparkles, Heart, Lightbulb, Rocket, Globe,
  BookOpen, Trophy, Briefcase, LayoutDashboard, Megaphone, Eye, Phone, CheckCircle,
};

const LandingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<any>(null);
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", mobile: "", years_of_expertise: "", city: "",
    specialization: "", linkedin_url: "", current_students: "",
  });

  useEffect(() => {
    const fetch = async () => {
      const { data: p } = await supabase.from("landing_pages").select("*").eq("slug", slug).single();
      setPage(p);
      if (p) {
        const { data: f } = await supabase.from("landing_page_features").select("*").eq("landing_page_id", p.id).eq("is_active", true).order("sort_order");
        setFeatures(f || []);
      }
      setLoading(false);
    };
    if (slug) fetch();
  }, [slug]);

  useSEO({
    title: page?.meta_title || page?.headline || "Landing Page",
    description: page?.meta_description || page?.subheadline || "",
    canonical: `https://www.aicoachportal.com/lp/${slug}`,
  });

  const trackCta = async (ctaType: string) => {
    if (page?.id) {
      await supabase.from("landing_page_cta_clicks").insert({ landing_page_id: page.id, cta_type: ctaType });
    }
  };

  const handleCtaClick = () => {
    const ctaType = page?.cta_type || "form";
    trackCta(ctaType);
    if (ctaType === "form") { setShowForm(true); return; }
    if (ctaType === "whatsapp" && page?.whatsapp_number) {
      const msg = encodeURIComponent(page.whatsapp_message || "");
      window.open(`https://wa.me/${page.whatsapp_number.replace(/\D/g, "")}?text=${msg}`, "_blank");
      return;
    }
    if (ctaType === "call" && page?.phone_number) {
      window.location.href = `tel:${page.phone_number}`;
      return;
    }
    if (ctaType === "url" && page?.cta_link) {
      window.open(page.cta_link, "_blank");
      return;
    }
    setShowForm(true);
  };

  const handleFloatingCta = () => {
    const type = page?.floating_cta_type || "whatsapp";
    trackCta(`floating_${type}`);
    if (type === "whatsapp" && page?.whatsapp_number) {
      const msg = encodeURIComponent(page.whatsapp_message || "");
      window.open(`https://wa.me/${page.whatsapp_number.replace(/\D/g, "")}?text=${msg}`, "_blank");
    } else if (type === "call" && page?.phone_number) {
      window.location.href = `tel:${page.phone_number}`;
    } else {
      setShowForm(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.mobile) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("landing_page_leads").insert({
      landing_page_id: page.id, name: form.name, email: form.email,
      mobile: form.mobile, years_of_expertise: form.years_of_expertise ? parseInt(form.years_of_expertise) : null,
      city: form.city || null, source: "landing_page_form",
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
    } else {
      trackCta("form_submit");
      navigate(`/lp/${slug}/thank-you?name=${encodeURIComponent(form.name)}&category=${encodeURIComponent(page.category || "")}`);
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!page) return <div className="min-h-screen bg-background"><Navbar /><div className="flex items-center justify-center py-32"><p className="text-muted-foreground text-lg">Landing page not found.</p></div><Footer /></div>;

  const benefits: string[] = Array.isArray(page.benefits) ? page.benefits : [];
  const howItWorks: { step: string; description: string }[] = Array.isArray(page.how_it_works) ? page.how_it_works : [];
  const trustPoints: string[] = Array.isArray(page.trust_points) ? page.trust_points : [];
  const category = page.category || "Expert";
  const ctaText = page.cta_text || "Start Getting Students";
  const badgeText = page.badge_text || `🔥 ${category} Coaching — Limited Slots`;

  const testimonials = [
    { name: "Rahul Sharma", role: `${category} Coach`, text: "I got 40+ students in my first month without spending on ads!", rating: 5, students: "120+" },
    { name: "Priya Mehta", role: `${category} Mentor`, text: "The pay-after-admission model removed all my risk.", rating: 5, students: "85+" },
    { name: "Vikram Singh", role: `${category} Trainer`, text: "My revenue tripled in 3 months.", rating: 5, students: "200+" },
  ];

  const floatingPos = page.floating_cta_position === "bottom-left" ? "left-4" : "right-4";
  const floatingAnim = page.floating_cta_animation === "pulse" ? "animate-pulse" : page.floating_cta_animation === "glow" ? "shadow-lg shadow-primary/40" : "";
  const FloatingIcon = page.floating_cta_type === "call" ? Phone : page.floating_cta_type === "form" ? ArrowRight : MessageCircle;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* HERO */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <Badge variant="secondary" className="mb-4 text-sm px-4 py-1.5 bg-primary/10 text-primary border-primary/20">
                {badgeText}
              </Badge>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                {page.headline}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">{page.subheadline}</p>

              {/* Dynamic Feature Cards in Hero */}
              {features.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                  {features.slice(0, 3).map((f, i) => {
                    const Icon = ICON_MAP[f.icon] || Star;
                    return (
                      <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-card/60 border border-border/50">
                        <Icon className="h-5 w-5 text-primary shrink-0" />
                        <span className="text-sm font-medium text-foreground">{f.title}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <Button size="lg" className="text-lg px-8 py-6 shadow-lg shadow-primary/20" onClick={handleCtaClick}>
                {ctaText} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Stats */}
            <div className="hidden lg:block">
              <Card className="border-border/30 bg-card/40 backdrop-blur-lg p-6 space-y-5">
                <h3 className="text-lg font-semibold text-foreground text-center">Platform Highlights</h3>
                {[
                  { icon: GraduationCap, label: "Students Placed", value: "10,000+", color: "text-primary" },
                  { icon: Award, label: "Coaches Earning ₹1L+/mo", value: "200+", color: "text-green-400" },
                  { icon: Target, label: "Avg. Cost Per Student", value: "₹150", color: "text-blue-400" },
                  { icon: BarChart3, label: "Coach Satisfaction", value: "4.9★", color: "text-yellow-400" },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                    <s.icon className={`h-6 w-6 ${s.color} shrink-0`} />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                      <p className="text-xl font-bold text-foreground">{s.value}</p>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ALL FEATURE CARDS */}
      {features.length > 0 && (
        <section className="py-16 md:py-20 bg-gradient-to-r from-primary/5 via-background to-primary/5">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">WHY CHOOSE US</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-10">Everything You Need to Succeed</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((f, i) => {
                const Icon = ICON_MAP[f.icon] || Star;
                return (
                  <Card key={i} className="border-border/30 bg-card/60 backdrop-blur-sm hover:border-primary/30 transition-all group">
                    <CardContent className="p-6 text-center space-y-3">
                      <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-7 w-7 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground">{f.title}</h3>
                      {f.description && <p className="text-sm text-muted-foreground">{f.description}</p>}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* BENEFITS */}
      {benefits.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-3">Why Join as a {category} Coach?</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">Everything you need to build a thriving coaching business.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {benefits.map((b, i) => (
                <Card key={i} className="border-border/40 bg-card/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all">
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-primary/10 shrink-0"><CheckCircle className="h-5 w-5 text-primary" /></div>
                    <p className="text-foreground font-medium">{b}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      <section className="py-16 md:py-20 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3 bg-primary/10 text-primary border-primary/20"><Quote className="h-3 w-3 mr-1" /> Coach Success Stories</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Coaches Love Our Platform</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Card key={i} className="border-border/30 bg-card/60 hover:border-primary/20 transition-all">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-1">{Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}</div>
                  <p className="text-muted-foreground text-sm italic">"{t.text}"</p>
                  <div className="flex items-center justify-between pt-2 border-t border-border/30">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                    <Badge variant="outline" className="text-xs border-primary/30 text-primary">{t.students} students</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      {howItWorks.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {howItWorks.map((h, i) => (
                <div key={i} className="text-center space-y-3 relative">
                  {i < howItWorks.length - 1 && <div className="hidden md:block absolute top-7 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/40 to-transparent" />}
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-xl font-bold text-primary">{i + 1}</div>
                  <h3 className="text-lg font-semibold text-foreground">{h.step}</h3>
                  <p className="text-muted-foreground text-sm">{h.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* INLINE FORM */}
      <section id="lp-form" className="py-16 md:py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-xl mx-auto px-4">
          <Card className="border-border/30 bg-card/80 backdrop-blur-lg shadow-2xl shadow-primary/5">
            <CardContent className="p-8 md:p-10">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Register as a Coach</h2>
                <p className="text-muted-foreground mt-2">It's free — start getting students today!</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {[
                  { label: "Full Name", key: "name", type: "text", placeholder: "Your full name", required: true },
                  { label: "Email", key: "email", type: "email", placeholder: "you@example.com", required: true },
                  { label: "Phone Number", key: "mobile", type: "tel", placeholder: "+91 98765 43210", required: true },
                  { label: "Specialization", key: "specialization", type: "text", placeholder: `e.g. ${category} Strategy` },
                  { label: "Years of Expertise", key: "years_of_expertise", type: "number", placeholder: "e.g. 5" },
                  { label: "City", key: "city", type: "text", placeholder: "Your city" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      {field.label} {field.required && <span className="text-red-400">*</span>}
                    </label>
                    <Input
                      type={field.type} value={(form as any)[field.key]}
                      onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                      placeholder={field.placeholder} required={field.required}
                      className="h-11 bg-muted/30 border-border/50 focus:border-primary/50"
                    />
                  </div>
                ))}
                <Button type="submit" className="w-full text-lg py-6 mt-2 shadow-lg shadow-primary/20" disabled={submitting}>
                  {submitting && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
                  Submit Application
                </Button>
                <p className="text-xs text-muted-foreground text-center">🔒 Your information is secure.</p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* TRUST */}
      {trustPoints.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-8">
              {trustPoints.map((t, i) => {
                const icons = [Star, Users, Zap, Shield];
                const Icon = icons[i % icons.length];
                return (
                  <div key={i} className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="h-5 w-5 text-primary" /><span className="text-sm font-medium">{t}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <Footer />

      {/* FLOATING CTA */}
      {page.floating_cta_enabled && (
        <button
          onClick={handleFloatingCta}
          className={`fixed bottom-6 ${floatingPos} z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl hover:scale-110 transition-transform ${floatingAnim}`}
          aria-label="Contact us"
        >
          <FloatingIcon className="h-6 w-6" />
        </button>
      )}

      {/* FORM POPUP */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-foreground">Register as a Coach</h3>
            <p className="text-sm text-muted-foreground">Fill in your details to get started</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            {[
              { label: "Full Name", key: "name", type: "text", required: true },
              { label: "Email", key: "email", type: "email", required: true },
              { label: "Phone", key: "mobile", type: "tel", required: true },
              { label: "Specialization", key: "specialization", type: "text" },
              { label: "Experience (years)", key: "years_of_expertise", type: "number" },
              { label: "City", key: "city", type: "text" },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-xs font-medium text-foreground mb-1 block">{f.label} {f.required && <span className="text-red-400">*</span>}</label>
                <Input type={f.type} value={(form as any)[f.key]} onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))} required={f.required} className="h-10 bg-muted/30" />
              </div>
            ))}
            <Button type="submit" className="w-full py-5" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Submit
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPage;
