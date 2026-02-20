const categories = [
  { emoji: "✨", name: "Prompt Engineering", count: 42 },
  { emoji: "🤖", name: "AI Agents", count: 28 },
  { emoji: "🧠", name: "LLMs & Fine-tuning", count: 35 },
  { emoji: "⚡", name: "AI Automation", count: 31 },
  { emoji: "🔧", name: "No-Code AI", count: 24 },
  { emoji: "📈", name: "AI for Marketing", count: 19 },
  { emoji: "💻", name: "Gen AI for Devs", count: 38 },
  { emoji: "🏢", name: "AI for Business", count: 22 },
];

const CategoriesSection = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold text-foreground">Explore AI Categories</h2>
          <p className="text-muted-foreground">Find the perfect AI skill to level up your career</p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="group cursor-pointer rounded-xl border border-border bg-card p-6 text-center transition-all hover:border-primary/30 hover:bg-secondary"
            >
              <div className="mb-3 text-3xl">{cat.emoji}</div>
              <h3 className="mb-1 text-sm font-semibold text-foreground">{cat.name}</h3>
              <p className="text-xs text-muted-foreground">{cat.count} courses</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
