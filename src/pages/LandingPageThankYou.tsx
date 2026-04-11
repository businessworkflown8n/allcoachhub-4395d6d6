import { useParams, useSearchParams, Link } from "react-router-dom";
import { CheckCircle, ArrowRight, Users, TrendingUp, Star, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const categoryContent: Record<string, { title: string; message: string; nextSteps: string[]; tip: string }> = {
  Career: {
    title: "Welcome to the Career Coaching Community!",
    message: "You're about to help thousands of professionals unlock their dream careers.",
    nextSteps: [
      "Our team will review your profile within 24 hours",
      "You'll receive an onboarding email with your dashboard access",
      "Set up your first course and start attracting students",
      "Use our marketing tools to grow your coaching brand",
    ],
    tip: "Career coaches on our platform earn an average of ₹80,000/month within the first 3 months!",
  },
  Coding: {
    title: "Welcome to the Coding Coaching Network!",
    message: "Developers worldwide are waiting to learn from experts like you.",
    nextSteps: [
      "Profile review completed within 24 hours",
      "Access our course builder with code playground integration",
      "Create your first programming course or bootcamp",
      "Get matched with students based on your tech stack",
    ],
    tip: "Coding coaches see 3x more enrollments when they offer a free trial lesson!",
  },
  Wellness: {
    title: "Welcome to the Wellness Coaching Family!",
    message: "Your expertise will transform lives and promote holistic well-being.",
    nextSteps: [
      "Quick verification of your wellness credentials",
      "Personalized onboarding call with our team",
      "Set up your wellness sessions and packages",
      "Start connecting with clients seeking your guidance",
    ],
    tip: "Wellness coaches who offer group sessions earn 2x more than 1-on-1 only!",
  },
  Business: {
    title: "Welcome to the Business Coaching Elite!",
    message: "Entrepreneurs and leaders are ready to learn from your experience.",
    nextSteps: [
      "Priority profile review for business coaches",
      "Access to enterprise-grade coaching tools",
      "Create consulting packages and group masterminds",
      "Leverage our B2B network for premium clients",
    ],
    tip: "Business coaches who create case-study-based courses see 5x higher conversion!",
  },
};

const getContent = (category: string) => {
  return categoryContent[category] || {
    title: `Welcome to the ${category || "Expert"} Coaching Community!`,
    message: `Your expertise in ${(category || "your field").toLowerCase()} will make a real difference.`,
    nextSteps: [
      "Our team will review your application within 24 hours",
      "You'll receive a personalized onboarding email",
      "Set up your profile and create your first course",
      "Start receiving student inquiries through our platform",
    ],
    tip: "Coaches who complete their profile within 48 hours get 3x more visibility!",
  };
};

const LandingPageThankYou = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const name = searchParams.get("name") || "Coach";
  const category = searchParams.get("category") || "";
  const content = getContent(category);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-4">
          {/* Success Card */}
          <Card className="border-primary/20 bg-card/80 backdrop-blur-lg shadow-2xl shadow-primary/10 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-primary via-primary/80 to-primary/40" />
            <CardContent className="p-8 md:p-12">
              <div className="text-center mb-10">
                <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
                  <CheckCircle className="h-10 w-10 text-primary" />
                </div>
                <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-primary/20">
                  <Sparkles className="h-3 w-3 mr-1" /> Application Submitted
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                  Thank You, {name}! 🎉
                </h1>
                <h2 className="text-xl text-primary font-semibold mb-3">{content.title}</h2>
                <p className="text-muted-foreground text-lg">{content.message}</p>
              </div>

              {/* Next Steps */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" /> What Happens Next
                </h3>
                <div className="space-y-3">
                  {content.nextSteps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                        {i + 1}
                      </div>
                      <p className="text-sm text-foreground pt-0.5">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro Tip */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-8">
                <p className="text-sm text-foreground flex items-start gap-2">
                  <Star className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span><strong className="text-primary">Pro Tip:</strong> {content.tip}</span>
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { icon: Users, label: "Active Coaches", value: "500+" },
                  { icon: TrendingUp, label: "Avg. Monthly Earnings", value: "₹75K" },
                  { icon: Star, label: "Platform Rating", value: "4.9★" },
                ].map((stat, i) => (
                  <div key={i} className="text-center p-3 rounded-lg bg-muted/20">
                    <stat.icon className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="text-lg font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg" className="shadow-lg shadow-primary/20">
                  <Link to="/browse-coaches">
                    Explore Other Coaches <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/">Back to Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPageThankYou;
