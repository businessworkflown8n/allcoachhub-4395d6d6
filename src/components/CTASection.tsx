import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-12 text-center md:p-16">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">Ready to Master AI?</h2>
          <p className="mb-8 text-muted-foreground">
            Join thousands of professionals learning from the best AI coaches. Start your journey today.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button className="glow-lime inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 font-semibold text-primary-foreground transition-all hover:brightness-110">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </button>
            <button className="rounded-lg border border-border bg-secondary px-8 py-3.5 font-semibold text-foreground transition-colors hover:bg-border">
              Browse Coaches
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
