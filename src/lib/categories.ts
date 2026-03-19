// Shared category definitions used across coach form, frontend cards, and category pages

export const PREDEFINED_CATEGORIES = [
  { name: "Prompt Engineering", slug: "prompt-engineering", emoji: "✨" },
  { name: "AI Agents", slug: "ai-agents", emoji: "🤖" },
  { name: "LLMs & Fine-tuning", slug: "llms-fine-tuning", emoji: "🧠" },
  { name: "AI Automation", slug: "ai-automation", emoji: "⚡" },
  { name: "No-Code AI", slug: "no-code-ai", emoji: "🔧" },
  { name: "AI for Marketing", slug: "ai-marketing", emoji: "📈" },
  { name: "Gen AI for Devs", slug: "generative-ai-for-developers", emoji: "💻" },
  { name: "AI for Business", slug: "ai-business", emoji: "🏢" },
  { name: "Others", slug: "others", emoji: "📦" },
];


export type CategoryName = (typeof PREDEFINED_CATEGORIES)[number]["name"];

export const getCategorySlug = (name: string): string => {
  const found = PREDEFINED_CATEGORIES.find((c) => c.name === name);
  return found?.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
};

export const getCategoryBySlug = (slug: string) => {
  return PREDEFINED_CATEGORIES.find((c) => c.slug === slug);
};

export const getCategoryByName = (name: string) => {
  return PREDEFINED_CATEGORIES.find((c) => c.name === name);
};
