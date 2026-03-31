import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { useCurrency } from "@/hooks/useCurrency";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, GraduationCap, ExternalLink, Play, Mail, MapPin } from "lucide-react";

const CoachWebsite = () => {
  const { slug } = useParams<{ slug: string }>();
  const { symbol, priceKey } = useCurrency();
  const [site, setSite] = useState<any>(null);
  const [coach, setCoach] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useSEO({
    title: site?.meta_title || site?.institute_name || "Coach Website",
    description: site?.meta_description || site?.tagline || "Discover expert coaching",
    canonical: `https://www.aicoachportal.com/coach-website/${slug}`,
    ogType: "website",
  });

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      const { data: website } = await supabase
        .from("coach_websites")
        .select("*")
        .eq("slug", slug)
        .eq("status", "approved")
        .eq("is_live", true)
        .maybeSingle();

      if (!website) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setSite(website);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", website.coach_id)
        .single();
      setCoach(profile);

      if (website.show_courses) {
        const { data: coursesData } = await supabase
          .from("courses")
          .select("*")
          .eq("coach_id", website.coach_id)
          .eq("is_published", true)
          .eq("approval_status", "approved")
          .order("created_at", { ascending: false });
        setCourses(coursesData || []);
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (notFound) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-background px-4">
          <h1 className="text-3xl font-bold text-foreground">Page Not Found</h1>
          <p className="text-muted-foreground">This coach website doesn't exist or isn't published yet.</p>
          <Link to="/"><Button>Back to Home</Button></Link>
        </div>
        <Footer />
      </>
    );
  }

  const socialLinks = (site.social_links || {}) as Record<string, string>;
  const themeColor = site.theme_color || "#6366f1";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Hero Banner */}
        <section
          className="relative overflow-hidden border-b border-border py-16 lg:py-24"
          style={{ background: `linear-gradient(135deg, ${themeColor}22, transparent, ${themeColor}11)` }}
        >
          {site.banner_url && (
            <div className="absolute inset-0">
              <img src={site.banner_url} alt="Banner" className="h-full w-full object-cover opacity-20" />
              <div className="absolute inset-0 bg-background/80" />
            </div>
          )}
          <div className="container relative mx-auto px-4 text-center">
            {site.logo_url && (
              <img src={site.logo_url} alt={site.institute_name} className="mx-auto mb-6 h-20 w-20 rounded-xl object-cover border-2 shadow-lg" style={{ borderColor: themeColor }} />
            )}
            <h1 className="text-3xl font-bold text-foreground lg:text-5xl">{site.institute_name}</h1>
            {site.tagline && <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">{site.tagline}</p>}
            {coach && (
              <p className="mt-2 text-sm text-muted-foreground flex items-center justify-center gap-2">
                by {coach.full_name}
                {coach.country && <><MapPin className="h-3.5 w-3.5" /> {coach.country}</>}
              </p>
            )}
            <div className="mt-6 flex justify-center gap-3">
              {courses.length > 0 && (
                <Button size="lg" style={{ backgroundColor: themeColor }}>
                  <GraduationCap className="h-4 w-4 mr-2" /> Explore Courses
                </Button>
              )}
              {coach?.slug && (
                <Link to={`/coach-profile/${coach.slug}`}>
                  <Button variant="outline" size="lg">View Coach Profile</Button>
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* About Section */}
        {site.show_about && site.about_text && (
          <section className="container mx-auto px-4 py-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">About Us</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line max-w-3xl">{site.about_text}</p>
          </section>
        )}

        {/* Description */}
        {site.description && (
          <section className="container mx-auto px-4 py-8">
            <p className="text-muted-foreground leading-relaxed max-w-3xl">{site.description}</p>
          </section>
        )}

        {/* Video Section */}
        {site.show_video && site.video_url && (
          <section className="container mx-auto px-4 py-12">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Play className="h-5 w-5" style={{ color: themeColor }} /> Introduction
            </h2>
            <div className="max-w-3xl mx-auto">
              <iframe
                src={site.video_url.replace("watch?v=", "embed/")}
                className="aspect-video w-full rounded-xl border border-border"
                allowFullScreen
                title="Intro video"
              />
            </div>
          </section>
        )}

        {/* Courses Section */}
        {site.show_courses && courses.length > 0 && (
          <section className="container mx-auto px-4 py-12">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <GraduationCap className="h-5 w-5" style={{ color: themeColor }} /> Our Courses
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Card key={course.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
                  {course.thumbnail_url && <img src={course.thumbnail_url} alt={course.title} className="h-44 w-full object-cover" />}
                  <CardHeader className="pb-2">
                    <CardTitle className="line-clamp-2 text-lg">{course.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {course.duration_hours}h</span>
                        <Badge variant="outline" className="text-xs">{course.level}</Badge>
                        <Badge variant="outline" className="text-xs">{course.category}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold" style={{ color: themeColor }}>{symbol}{course[priceKey]}</p>
                        {course.original_price_usd && course.discount_percent > 0 && (
                          <span className="text-sm text-muted-foreground line-through">{symbol}{course[priceKey === "price_usd" ? "original_price_usd" : "original_price_inr"]}</span>
                        )}
                      </div>
                    </div>
                    <Link to={`/course/${course.slug}`}>
                      <Button className="w-full" style={{ backgroundColor: themeColor }}>View & Enroll</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Social Links */}
        {Object.values(socialLinks).some((v) => v) && (
          <section className="container mx-auto px-4 py-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Connect With Us</h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(socialLinks).map(([platform, url]) =>
                url ? (
                  <a key={platform} href={url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="capitalize">
                      <ExternalLink className="h-3.5 w-3.5 mr-1" /> {platform}
                    </Button>
                  </a>
                ) : null
              )}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
};

export default CoachWebsite;
