import { useEffect } from "react";

type SchemaObject = Record<string, unknown>;

/**
 * Inject one or more JSON-LD schema scripts into <head>.
 * Each schema gets a stable id so re-renders replace, never duplicate.
 */
export const useJsonLd = (schemas: SchemaObject[], idPrefix = "ld") => {
  useEffect(() => {
    const ids: string[] = [];
    schemas.forEach((schema, i) => {
      if (!schema) return;
      const id = `jsonld-${idPrefix}-${i}`;
      ids.push(id);
      let el = document.getElementById(id) as HTMLScriptElement | null;
      if (!el) {
        el = document.createElement("script");
        el.type = "application/ld+json";
        el.id = id;
        document.head.appendChild(el);
      }
      el.textContent = JSON.stringify(schema);
    });
    return () => {
      ids.forEach((id) => document.getElementById(id)?.remove());
    };
  }, [JSON.stringify(schemas), idPrefix]);
};

const SITE = "https://www.aicoachportal.com";
const ORG_NAME = "AI Coach Portal";

export const buildOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: ORG_NAME,
  url: SITE,
  logo: `${SITE}/logo.png`,
  sameAs: [
    "https://www.linkedin.com/company/aicoachportal",
    "https://twitter.com/aicoachportal",
  ],
});

export const buildBreadcrumbSchema = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.name,
    item: item.url.startsWith("http") ? item.url : `${SITE}${item.url}`,
  })),
});

export const buildFaqSchema = (faqs: { question: string; answer: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.answer,
    },
  })),
});

export const buildArticleSchema = (args: {
  headline: string;
  description: string;
  url: string;
  image?: string;
  authorName: string;
  datePublished: string;
  dateModified: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: args.headline,
  description: args.description,
  mainEntityOfPage: { "@type": "WebPage", "@id": args.url.startsWith("http") ? args.url : `${SITE}${args.url}` },
  image: args.image ? [args.image] : undefined,
  author: { "@type": "Person", name: args.authorName },
  publisher: {
    "@type": "Organization",
    name: ORG_NAME,
    logo: { "@type": "ImageObject", url: `${SITE}/logo.png` },
  },
  datePublished: args.datePublished,
  dateModified: args.dateModified,
});
