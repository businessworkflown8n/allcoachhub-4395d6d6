import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle, ArrowRight, BookOpen, GraduationCap, Clock,
  Phone, MessageCircle, Star, Users, Shield
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const maskEmail = (email: string) => {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  return user.slice(0, 2) + "***@" + domain;
};

const maskPhone = (phone: string) => {
  if (phone.length < 6) return phone;
  return phone.slice(0, 4) + "****" + phone.slice(-2);
};

const CoachWebsiteThankYou = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [site, setSite] = useState<any>(null);
  const [coach, setCoach] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const leadName = searchParams.get("name") || "";
  const leadEmail = searchParams.get("email") || "";
  const leadPhone = searchParams.get("phone") || "";

  useSEO({
    title: `Thank You | ${site?.institute_name || "Coach"}`,
    description: "Your request has been successfully submitted. Our team will contact you shortly.",
    canonical: `https://www.aicoachportal.com/coach-website/${slug}/thank-you`,
  });

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      const { data: website } = await supabase
        .from("coach_websites").select("*")
        .eq("slug", slug).eq("status", "approved").eq("is_live", true)
        .maybeSingle();

      if (!website) { setNotFound(true); setLoading(false); return; }
      setSite(website);

      const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", website.coach_id).single();
      setCoach(profile);

      const { data: coursesData } = await supabase.from("courses").select("*")
        .eq("coach_id", website.coach_id).eq("is_published", true).eq("approval_status", "approved")
        .order("created_at", { ascending: false }).limit(3);
      setCourses(coursesData || []);

      setLoading(false);
    };
    load();
  }, [slug]);

  // Fire tracking events on load
  useEffect(() => {
    if (!site || !slug) return;
    const utmSource = searchParams.get("utm_source") || "";
    const utmMedium = searchParams.get("utm_medium") || "";
    const utmCampaign = searchParams.get("utm_campaign") || "";

    trackEvent("generate_lead", {
      coach_slug: slug,
      institute: site.institute_name,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
    });

    trackEvent("thank_you_page_view", { coach_slug: slug });
  }, [site, slug, searchParams]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  if (notFound) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-background px-4">
          <h1 className="text-3xl font-bold text-foreground">Page Not Found</h1>
          <Link to="/"><Button>Back to Home</Button></Link>
        </div>
        <Footer />
      </>
    );
  }

  const themeColor = site.theme_color || "#6366f1";
  const socialLinks = (site.social_links || {}) as Record<string, string>;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Hero Confirmation */}
        <section className="relative overflow-hidden border-b border-border py-16 lg:py-24">
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at top, ${themeColor}15, transparent 70%)` }} />
          <div className="container relative mx-auto max-w-2xl px-4 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: `${themeColor}15` }}>
              <CheckCircle className="h-10 w-10" style={{ color: themeColor }} />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Thank You! 🎉
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Your request has been successfully submitted.
            </p>

            {/* Submitted Details */}
            {(leadName || leadEmail || leadPhone) && (
              <div className="mt-6 rounded-xl border border-border bg-card p-4 text-left shadow-sm">
                <p className="mb-2 text-sm font-semibold text-foreground">Your Submitted Details:</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {leadName && <p>👤 <span className="font-medium text-foreground">{leadName}</span></p>}
                  {leadEmail && <p>📧 {maskEmail(leadEmail)}</p>}
                  {leadPhone && <p>📱 {maskPhone(leadPhone)}</p>}
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="mb-3 text-base font-bold text-foreground">What Happens Next?</h3>
              <div className="space-y-3 text-left text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0" style={{ color: themeColor }} />
                  <p>Our team will contact you within <strong className="text-foreground">24 hours</strong></p>
                </div>
                <div className="flex gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0" style={{ color: themeColor }} />
                  <p>You'll receive a call/WhatsApp from our counselor</p>
                </div>
                <div className="flex gap-3">
                  <GraduationCap className="mt-0.5 h-4 w-4 shrink-0" style={{ color: themeColor }} />
                  <p>Get a personalized learning roadmap tailored to your goals</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Coach Profile */}
        {coach && (
          <section className="border-b border-border py-10">
            <div className="container mx-auto max-w-2xl px-4">
              <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
                {site.logo_url ? (
                  <img src={site.logo_url} alt={site.institute_name} className="h-16 w-16 rounded-xl border object-cover" style={{ borderColor: themeColor }} />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold text-white" style={{ backgroundColor: themeColor }}>
                    {site.institute_name?.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground">{site.institute_name}</h3>
                  <p className="text-sm text-muted-foreground">by {coach.full_name}</p>
                  {coach.bio && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{coach.bio}</p>}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="border-b border-border py-10">
          <div className="container mx-auto max-w-2xl px-4">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link to={`/coach-website/${slug}`}>
                <Button size="lg" className="gap-2 text-base font-semibold" style={{ backgroundColor: themeColor }}>
                  <BookOpen className="h-4 w-4" /> Explore Courses
                </Button>
              </Link>
              {socialLinks.whatsapp && (
                <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="gap-2 text-base font-semibold">
                    <MessageCircle className="h-4 w-4" /> Join WhatsApp
                  </Button>
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Featured Courses */}
        {courses.length > 0 && (
          <section className="py-12">
            <div className="container mx-auto max-w-4xl px-4">
              <h2 className="mb-6 text-center text-2xl font-bold text-foreground">Popular Courses</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <Link key={course.id} to={`/course/${course.slug || course.id}`} className="group rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md">
                    {course.thumbnail_url && (
                      <img src={course.thumbnail_url} alt={course.title} className="mb-3 h-32 w-full rounded-lg object-cover" loading="lazy" />
                    )}
                    <h3 className="line-clamp-2 text-sm font-bold text-foreground group-hover:underline">{course.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{course.level} · {course.duration_hours}h</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Trust Badges */}
        <section className="border-t border-border py-10">
          <div className="container mx-auto max-w-2xl px-4">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Badge variant="secondary" className="gap-1.5 px-4 py-2"><Shield className="h-4 w-4" /> Verified Coach</Badge>
              <Badge variant="secondary" className="gap-1.5 px-4 py-2"><Star className="h-4 w-4 fill-yellow-500 text-yellow-500" /> Trusted Platform</Badge>
              <Badge variant="secondary" className="gap-1.5 px-4 py-2"><Users className="h-4 w-4" /> 1000+ Learners</Badge>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* Floating CTA */}
      <div className="fixed bottom-6 right-6 z-40 hidden md:block">
        <Link to={`/coach-website/${slug}#cw-demo`}>
          <Button
            size="lg"
            className="gap-2 rounded-full px-6 text-base font-semibold shadow-lg transition-transform hover:scale-105"
            style={{ backgroundColor: themeColor }}
          >
            Book Free Demo <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm py-3 px-4 md:hidden">
        <Link to={`/coach-website/${slug}#cw-demo`}>
          <Button className="w-full gap-2 text-base font-semibold" style={{ backgroundColor: themeColor }}>
            Book Free Demo <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </>
  );
};

export default CoachWebsiteThankYou;
