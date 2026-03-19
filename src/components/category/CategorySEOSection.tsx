interface Props {
  cat: { name: string; seoText: string };
}

const CategorySEOSection = ({ cat }: Props) => (
  <section className="border-t border-border bg-card/20 py-12">
    <div className="container mx-auto max-w-3xl px-4">
      <h2 className="mb-4 text-lg font-bold text-foreground">About {cat.name} Courses</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">{cat.seoText}</p>
    </div>
  </section>
);

export default CategorySEOSection;
