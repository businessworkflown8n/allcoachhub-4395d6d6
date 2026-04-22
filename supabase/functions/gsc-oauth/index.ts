// Google Search Console OAuth: handles authorize URL build + callback exchange + data fetch.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "authorize_url";
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ============ Build authorize URL ============
    if (action === "authorize_url") {
      const redirectUri = body.redirect_uri;
      if (!redirectUri) throw new Error("redirect_uri required");
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: SCOPE,
        access_type: "offline",
        prompt: "consent",
        state: user.id,
      });
      return new Response(JSON.stringify({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============ Exchange code ============
    if (action === "exchange_code") {
      const { code, redirect_uri, site_url } = body;
      if (!code || !redirect_uri || !site_url) throw new Error("code, redirect_uri, site_url required");

      const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code, client_id: clientId, client_secret: clientSecret,
          redirect_uri, grant_type: "authorization_code",
        }),
      });
      const tokens = await tokenResp.json();
      if (!tokenResp.ok) throw new Error(`Token exchange failed: ${JSON.stringify(tokens)}`);

      const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();

      await adminClient.from("gsc_connections").upsert({
        user_id: user.id, site_url,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt,
        scope: tokens.scope, status: "active",
      }, { onConflict: "user_id" });

      return new Response(JSON.stringify({ ok: true, site_url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============ Fetch search analytics ============
    if (action === "fetch_data") {
      const { data: conn } = await adminClient.from("gsc_connections")
        .select("*").eq("user_id", user.id).maybeSingle();
      if (!conn) throw new Error("No GSC connection. Connect first.");

      // Refresh token if expired
      let accessToken = conn.access_token;
      if (new Date(conn.token_expires_at) <= new Date() && conn.refresh_token) {
        const r = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId, client_secret: clientSecret,
            refresh_token: conn.refresh_token, grant_type: "refresh_token",
          }),
        });
        const refreshed = await r.json();
        if (r.ok) {
          accessToken = refreshed.access_token;
          await adminClient.from("gsc_connections").update({
            access_token: refreshed.access_token,
            token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
          }).eq("user_id", user.id);
        }
      }

      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const apiUrl = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(conn.site_url)}/searchAnalytics/query`;
      const r = await fetch(apiUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, dimensions: ["page"], rowLimit: 100 }),
      });
      const data = await r.json();
      if (r.ok) {
        await adminClient.from("gsc_connections").update({ last_synced_at: new Date().toISOString() }).eq("user_id", user.id);
      }
      return new Response(JSON.stringify({ ok: r.ok, data, site_url: conn.site_url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("gsc-oauth error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
