// Auto-indexer: called by DB triggers when a page is created/updated.
// Records the page in seo_page_metadata, then calls submit-indexing to ping Google.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url, source, action = "URL_UPDATED" } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "url is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Mark page as queued for indexing
    await supabase
      .from("seo_page_metadata")
      .update({ index_status: "queued", indexing_submitted_at: new Date().toISOString() })
      .eq("page_url", url);

    // Call submit-indexing (already exists)
    const submitUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/submit-indexing`;
    const resp = await fetch(submitUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({ urls: [url], action }),
    });
    const data = await resp.json().catch(() => ({}));

    console.log(`[auto-indexer] ${source} ${url} -> status=${resp.status}`);

    return new Response(JSON.stringify({ ok: resp.ok, indexing: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("auto-indexer error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
