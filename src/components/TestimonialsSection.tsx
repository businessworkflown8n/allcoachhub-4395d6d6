const testimonials = [
  {
    quote: "Sarah's prompt engineering course completely changed how I work. I'm saving 3+ hours daily with the workflows I built. Best investment I've made this year.",
    initials: "AM",
    name: "Alex Morgan",
    date: "December 2025",
  },
  {
    quote: "Marcus taught me how to automate my entire content pipeline. What used to take my team a week now runs on autopilot. Incredible value.",
    initials: "PS",
    name: "Priya Sharma",
    date: "November 2025",
  },
  {
    quote: "Dr. Patel makes fine-tuning LLMs accessible. I went from zero ML knowledge to deploying my own custom model in 3 weeks. Mind-blowing.",
    initials: "TW",
    name: "Tom Williams",
    date: "January 2026",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold text-foreground">What Students Say</h2>
          <p className="text-muted-foreground">Real feedback from our learning community</p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-xl border border-border bg-card p-6">
              <p className="mb-6 text-sm italic leading-relaxed text-muted-foreground">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
