// Dynamic sitemap.xml builder. Pulls live content from DB and pings Google/Bing.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE = "https://www.aicoachportal.com";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function urlEntry(loc: string, lastmod: string, priority = "0.7", changefreq = "weekly") {
  return `  <url>
    <loc>${SITE}${loc}</loc>
    <lastmod>${lastmod.split("T")[0]}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const ping = url.searchParams.get("ping") === "1";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const today = new Date().toISOString();
    const entries: string[] = [];

    // Static high-priority pages
    const staticPages: Array<[string, string, string]> = [
      ["/", "1.0", "daily"],
      ["/courses", "0.9", "daily"],
      ["/coaches", "0.9", "daily"],
      ["/categories", "0.9", "weekly"],
      ["/webinars", "0.8", "weekly"],
      ["/ai-blogs", "0.8", "daily"],
      ["/materials", "0.7", "weekly"],
      ["/prompt-generator", "0.7", "monthly"],
    ];
    staticPages.forEach(([loc, p, c]) => entries.push(urlEntry(loc, today, p, c)));

    // Courses
    const { data: courses } = await supabase
      .from("courses")
      .select("slug, id, updated_at")
      .eq("is_published", true)
      .eq("approval_status", "approved");
    courses?.forEach((c: any) =>
      entries.push(urlEntry(`/course/${c.slug || c.id}`, c.updated_at || today, "0.9", "weekly"))
    );

    // Blogs
    const { data: blogs } = await supabase
      .from("ai_blogs")
      .select("slug, id, published_at")
      .eq("is_published", true);
    blogs?.forEach((b: any) =>
      entries.push(urlEntry(`/ai-blogs/${b.slug || b.id}`, b.published_at || today, "0.7", "weekly"))
    );

    // Coach websites
    const { data: sites } = await supabase
      .from("coach_websites")
      .select("slug, updated_at")
      .eq("is_live", true)
      .eq("status", "approved");
    sites?.forEach((s: any) =>
      entries.push(urlEntry(`/coach-website/${s.slug}`, s.updated_at || today, "0.8", "weekly"))
    );

    // Landing pages
    const { data: lps } = await supabase
      .from("landing_pages")
      .select("slug, updated_at, status, is_published")
      .or("status.eq.published,is_published.eq.true");
    lps?.forEach((lp: any) =>
      entries.push(urlEntry(`/lp/${lp.slug}`, lp.updated_at || today, "0.9", "weekly"))
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

    // Optional ping
    if (ping) {
      const sitemapUrl = `${SITE}/sitemap.xml`;
      const targets = [
        { engine: "google", url: `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}` },
        { engine: "bing", url: `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}` },
      ];
      for (const t of targets) {
        try {
          const r = await fetch(t.url);
          await supabase.from("seo_ping_log").insert({
            search_engine: t.engine, sitemap_url: sitemapUrl,
            status: r.ok ? "success" : "failed", http_status: r.status,
          });
        } catch (e) {
          await supabase.from("seo_ping_log").insert({
            search_engine: t.engine, sitemap_url: sitemapUrl, status: "failed",
            response_body: e instanceof Error ? e.message : "ping error",
          });
        }
      }
    }

    return new Response(xml, {
      headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
    });
  } catch (err) {
    console.error("dynamic-sitemap error:", err);
    return new Response(`<!-- error: ${err instanceof Error ? err.message : "unknown"} -->`, {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/xml" },
    });
  }
});
