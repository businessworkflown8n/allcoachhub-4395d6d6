export const CATEGORY_DEFAULTS: Record<string, {
  headline: string;
  subheadline: string;
  benefits: string[];
  how_it_works: { step: string; description: string }[];
  trust_points: string[];
}> = {
  Career: {
    headline: "Launch Your Dream Career with Expert Coaching",
    subheadline: "Get personalized guidance from industry leaders to accelerate your career growth",
    benefits: [
      "1-on-1 mentorship from hiring managers & leaders",
      "Resume, LinkedIn & interview preparation",
      "Salary negotiation strategies",
      "Career transition roadmaps",
    ],
    how_it_works: [
      { step: "Register", description: "Fill in your details and area of expertise" },
      { step: "Get Matched", description: "We match you with the right coaching opportunities" },
      { step: "Start Coaching", description: "Begin your journey as a career coach" },
    ],
    trust_points: ["500+ coaches onboarded", "10,000+ learners helped", "4.8★ average rating"],
  },
  Coding: {
    headline: "Teach Coding & Build the Next Generation of Developers",
    subheadline: "Share your programming expertise and earn while making an impact",
    benefits: [
      "Access to a global learner base",
      "Flexible scheduling & pricing",
      "Built-in course builder & LMS",
      "Automated marketing & lead generation",
    ],
    how_it_works: [
      { step: "Sign Up", description: "Register as a coding coach in minutes" },
      { step: "Create Courses", description: "Use our tools to build engaging content" },
      { step: "Earn Revenue", description: "Start earning from day one" },
    ],
    trust_points: ["200+ coding coaches", "50+ programming languages covered", "95% satisfaction rate"],
  },
  Wellness: {
    headline: "Empower Lives Through Wellness Coaching",
    subheadline: "Join our platform and reach thousands seeking health & wellness guidance",
    benefits: [
      "Dedicated wellness coaching tools",
      "Session booking & payment automation",
      "Marketing support & visibility",
      "Community of wellness professionals",
    ],
    how_it_works: [
      { step: "Apply", description: "Share your wellness expertise and credentials" },
      { step: "Get Approved", description: "Quick verification and onboarding" },
      { step: "Start Coaching", description: "Connect with clients seeking wellness guidance" },
    ],
    trust_points: ["300+ wellness coaches", "Trusted by 8,000+ clients", "HIPAA-aware platform"],
  },
  Business: {
    headline: "Scale Your Business Coaching Practice",
    subheadline: "Leverage our platform to grow your consulting and coaching business",
    benefits: [
      "Enterprise-grade coaching tools",
      "Automated client acquisition",
      "Revenue analytics & insights",
      "White-label landing pages",
    ],
    how_it_works: [
      { step: "Register", description: "Create your business coaching profile" },
      { step: "Set Up", description: "Configure courses, pricing & branding" },
      { step: "Grow", description: "Scale with our marketing engine" },
    ],
    trust_points: ["150+ business coaches", "$2M+ revenue generated", "Fortune 500 alumni"],
  },
};

export const getDefaults = (category: string) => {
  return CATEGORY_DEFAULTS[category] || {
    headline: `Become a Top ${category} Coach`,
    subheadline: `Join our platform and share your ${category.toLowerCase()} expertise with thousands of eager learners`,
    benefits: [
      "Access to a growing learner community",
      "Professional coaching tools & LMS",
      "Automated marketing & lead generation",
      "Flexible scheduling & earnings",
    ],
    how_it_works: [
      { step: "Register", description: "Fill in your details and expertise" },
      { step: "Get Verified", description: "Quick profile review and approval" },
      { step: "Start Earning", description: "Create courses and start coaching" },
    ],
    trust_points: ["500+ coaches", "10,000+ learners", "4.8★ platform rating"],
  };
};
