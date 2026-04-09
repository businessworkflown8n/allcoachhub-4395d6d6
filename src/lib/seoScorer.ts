// Yoast-like SEO scoring engine

export interface SEOAnalysis {
  score: number;
  checks: SEOCheck[];
  suggestions: string[];
}

export interface SEOCheck {
  id: string;
  label: string;
  status: "good" | "warning" | "poor";
  message: string;
  weight: number;
}

interface SEOInput {
  metaTitle: string;
  metaDescription: string;
  h1Tag: string;
  primaryKeyword: string;
  canonicalUrl: string;
  schemaMarkup: any;
  pageUrl: string;
  contentLength?: number;
  internalLinksCount?: number;
  imageCount?: number;
  imagesWithAlt?: number;
  headingStructure?: Record<string, number>;
}

export function analyzeSEO(input: SEOInput): SEOAnalysis {
  const checks: SEOCheck[] = [];
  const kw = input.primaryKeyword?.toLowerCase() || "";

  // 1. Title length (weight: 15)
  const titleLen = input.metaTitle?.length || 0;
  if (titleLen >= 30 && titleLen <= 60) {
    checks.push({ id: "title_length", label: "Title Length", status: "good", message: `Title is ${titleLen} chars — optimal range.`, weight: 15 });
  } else if (titleLen > 0 && titleLen < 30) {
    checks.push({ id: "title_length", label: "Title Length", status: "warning", message: `Title is too short (${titleLen}/60). Aim for 30-60 characters.`, weight: 8 });
  } else if (titleLen > 60) {
    checks.push({ id: "title_length", label: "Title Length", status: "warning", message: `Title is too long (${titleLen}/60). May be truncated in search results.`, weight: 8 });
  } else {
    checks.push({ id: "title_length", label: "Title Length", status: "poor", message: "No title set. Add an SEO title.", weight: 0 });
  }

  // 2. Keyword in title (weight: 10)
  if (kw && input.metaTitle?.toLowerCase().includes(kw)) {
    checks.push({ id: "kw_title", label: "Keyword in Title", status: "good", message: "Focus keyword appears in the title.", weight: 10 });
  } else if (kw) {
    checks.push({ id: "kw_title", label: "Keyword in Title", status: "poor", message: "Add your focus keyword to the title.", weight: 0 });
  }

  // 3. Meta description (weight: 15)
  const descLen = input.metaDescription?.length || 0;
  if (descLen >= 120 && descLen <= 160) {
    checks.push({ id: "desc_length", label: "Meta Description", status: "good", message: `Description is ${descLen} chars — optimal.`, weight: 15 });
  } else if (descLen > 50) {
    checks.push({ id: "desc_length", label: "Meta Description", status: "warning", message: `Description is ${descLen} chars. Aim for 120-160.`, weight: 8 });
  } else {
    checks.push({ id: "desc_length", label: "Meta Description", status: "poor", message: "Meta description is too short or missing.", weight: 0 });
  }

  // 4. Keyword in description (weight: 5)
  if (kw && input.metaDescription?.toLowerCase().includes(kw)) {
    checks.push({ id: "kw_desc", label: "Keyword in Description", status: "good", message: "Focus keyword appears in description.", weight: 5 });
  } else if (kw) {
    checks.push({ id: "kw_desc", label: "Keyword in Description", status: "warning", message: "Include your keyword in the meta description.", weight: 0 });
  }

  // 5. H1 tag (weight: 10)
  if (input.h1Tag) {
    checks.push({ id: "h1", label: "H1 Tag", status: "good", message: "Page has an H1 heading.", weight: 10 });
  } else {
    checks.push({ id: "h1", label: "H1 Tag", status: "poor", message: "No H1 tag set. Add a primary heading.", weight: 0 });
  }

  // 6. Keyword in H1 (weight: 5)
  if (kw && input.h1Tag?.toLowerCase().includes(kw)) {
    checks.push({ id: "kw_h1", label: "Keyword in H1", status: "good", message: "Focus keyword appears in H1.", weight: 5 });
  } else if (kw && input.h1Tag) {
    checks.push({ id: "kw_h1", label: "Keyword in H1", status: "warning", message: "Include your keyword in the H1 heading.", weight: 2 });
  }

  // 7. Keyword in URL (weight: 5)
  if (kw && input.pageUrl?.toLowerCase().includes(kw.replace(/\s+/g, "-"))) {
    checks.push({ id: "kw_url", label: "Keyword in URL", status: "good", message: "Focus keyword appears in the URL slug.", weight: 5 });
  } else if (kw) {
    checks.push({ id: "kw_url", label: "Keyword in URL", status: "warning", message: "Consider including your keyword in the URL.", weight: 2 });
  }

  // 8. Canonical URL (weight: 5)
  if (input.canonicalUrl) {
    checks.push({ id: "canonical", label: "Canonical URL", status: "good", message: "Canonical URL is set.", weight: 5 });
  } else {
    checks.push({ id: "canonical", label: "Canonical URL", status: "warning", message: "Set a canonical URL to avoid duplicate content.", weight: 0 });
  }

  // 9. Schema markup (weight: 10)
  if (input.schemaMarkup) {
    checks.push({ id: "schema", label: "Schema Markup", status: "good", message: "Structured data (JSON-LD) is set.", weight: 10 });
  } else {
    checks.push({ id: "schema", label: "Schema Markup", status: "warning", message: "Add schema markup for rich snippets.", weight: 0 });
  }

  // 10. Focus keyword set (weight: 5)
  if (kw) {
    checks.push({ id: "kw_set", label: "Focus Keyword", status: "good", message: "Focus keyword is defined.", weight: 5 });
  } else {
    checks.push({ id: "kw_set", label: "Focus Keyword", status: "poor", message: "Set a focus keyword for SEO optimization.", weight: 0 });
  }

  // 11. Content length (weight: 10)
  const contentLen = input.contentLength || 0;
  if (contentLen >= 300) {
    checks.push({ id: "content_len", label: "Content Length", status: "good", message: `Content is ${contentLen} words — good length.`, weight: 10 });
  } else if (contentLen >= 100) {
    checks.push({ id: "content_len", label: "Content Length", status: "warning", message: `Content is ${contentLen} words. Aim for 300+.`, weight: 5 });
  } else {
    checks.push({ id: "content_len", label: "Content Length", status: "poor", message: "Content is too short. Add more substance.", weight: 0 });
  }

  // 12. Image alt text (weight: 5)
  const imgCount = input.imageCount || 0;
  const altCount = input.imagesWithAlt || 0;
  if (imgCount > 0 && altCount === imgCount) {
    checks.push({ id: "img_alt", label: "Image Alt Text", status: "good", message: `All ${imgCount} images have alt text.`, weight: 5 });
  } else if (imgCount > 0 && altCount > 0) {
    checks.push({ id: "img_alt", label: "Image Alt Text", status: "warning", message: `${altCount}/${imgCount} images have alt text.`, weight: 2 });
  } else if (imgCount > 0) {
    checks.push({ id: "img_alt", label: "Image Alt Text", status: "poor", message: "No images have alt text.", weight: 0 });
  }

  // Calculate total score
  const maxWeight = checks.reduce((s, c) => s + (c.status === "good" ? c.weight : c.weight > 0 ? c.weight : getMaxWeight(c.id)), 0);
  const earnedWeight = checks.reduce((s, c) => s + c.weight, 0);
  const totalMax = 100;
  const score = Math.min(Math.round((earnedWeight / totalMax) * 100), 100);

  // Generate suggestions
  const suggestions = checks
    .filter(c => c.status !== "good")
    .map(c => c.message);

  return { score, checks, suggestions };
}

function getMaxWeight(id: string): number {
  const weights: Record<string, number> = {
    title_length: 15, kw_title: 10, desc_length: 15, kw_desc: 5,
    h1: 10, kw_h1: 5, kw_url: 5, canonical: 5, schema: 10,
    kw_set: 5, content_len: 10, img_alt: 5,
  };
  return weights[id] || 5;
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 50) return "text-yellow-500";
  return "text-red-500";
}

export function getScoreBg(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return "Good";
  if (score >= 50) return "Needs Improvement";
  return "Poor";
}
