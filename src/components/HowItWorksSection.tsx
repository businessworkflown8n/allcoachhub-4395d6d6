const steps = [
  { emoji: "🔍", num: "01", title: "Find Your Coach", desc: "Browse expert AI coaches by specialty, rating, and price. Read reviews from real students." },
  { emoji: "📚", num: "02", title: "Enroll or Book", desc: "Choose a structured course or book a 1:1 mentoring session tailored to your goals." },
  { emoji: "🚀", num: "03", title: "Master AI Skills", desc: "Learn at your own pace with hands-on projects, live sessions, and community support." },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-12 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold text-foreground">How It Works</h2>
          <p className="text-muted-foreground">Start learning AI in three simple steps</p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.num} className="relative rounded-xl border border-border bg-card p-8 text-center">
              <div className="mb-4 text-4xl">{step.emoji}</div>
              <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {i + 1}
              </div>
              <p className="mb-2 text-xs text-muted-foreground">{step.num}</p>
              <h3 className="mb-2 text-lg font-bold text-foreground">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
