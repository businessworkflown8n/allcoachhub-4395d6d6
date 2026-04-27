import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Platform-specific OAuth configurations
const PLATFORM_CONFIGS: Record<string, {
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientIdEnv: string;
  clientSecretEnv: string;
}> = {
  google_ads: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: ["https://www.googleapis.com/auth/adwords.readonly"],
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
  },
  meta_ads: {
    authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
    scopes: ["ads_read", "ads_management", "read_insights"],
    clientIdEnv: "META_APP_ID",
    clientSecretEnv: "META_APP_SECRET",
  },
  tiktok_ads: {
    authUrl: "https://business-api.tiktok.com/portal/auth",
    tokenUrl: "https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/",
    scopes: ["ad.read", "campaign.read"],
    clientIdEnv: "TIKTOK_APP_ID",
    clientSecretEnv: "TIKTOK_APP_SECRET",
  },
  linkedin_ads: {
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    scopes: ["r_ads_reporting", "r_ads", "r_organization_social"],
    clientIdEnv: "LINKEDIN_CLIENT_ID",
    clientSecretEnv: "LINKEDIN_CLIENT_SECRET",
  },
  bing_ads: {
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scopes: ["https://ads.microsoft.com/msads.manage", "offline_access"],
    clientIdEnv: "BING_CLIENT_ID",
    clientSecretEnv: "BING_CLIENT_SECRET",
  },
  ga4: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
  },
  gtm: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: ["https://www.googleapis.com/auth/tagmanager.readonly"],
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, platform, code, redirectUri, coachId } = body;

    if (!platform || !PLATFORM_CONFIGS[platform]) {
      return new Response(
        JSON.stringify({ error: `Unsupported platform: ${platform}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authenticate caller for any action that touches a coach's stored data
    const SENSITIVE_ACTIONS = new Set(["exchange_code", "select_account", "refresh_token"]);
    let authedUserId: string | null = null;
    if (SENSITIVE_ACTIONS.has(action)) {
      const authHeader = req.headers.get("Authorization") || "";
      const token = authHeader.replace("Bearer ", "").trim();
      if (!token) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const supaAuth = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
      const { data: userData, error: userErr } = await supaAuth.auth.getUser(token);
      if (userErr || !userData?.user) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      authedUserId = userData.user.id;
      if (!coachId || coachId !== authedUserId) {
        // Allow admins to act on behalf of a coach
        const admin = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        const { data: roleRow } = await admin
          .from("user_roles")
          .select("role")
          .eq("user_id", authedUserId)
          .eq("role", "admin")
          .maybeSingle();
        if (!roleRow) {
          return new Response(
            JSON.stringify({ error: "Forbidden: coachId does not match authenticated user" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    const config = PLATFORM_CONFIGS[platform];
    const clientId = Deno.env.get(config.clientIdEnv);
    const clientSecret = Deno.env.get(config.clientSecretEnv);

    // Action: Check if platform credentials are configured
    if (action === "check_credentials") {
      const configured = !!(clientId && clientSecret);
      return new Response(
        JSON.stringify({
          configured,
          platform,
          message: configured
            ? "Platform credentials are configured"
            : `Missing ${config.clientIdEnv} and/or ${config.clientSecretEnv} secrets`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({
          error: `OAuth credentials not configured for ${platform}. Required: ${config.clientIdEnv}, ${config.clientSecretEnv}`,
          credentials_missing: true,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: Generate OAuth authorization URL
    if (action === "get_auth_url") {
      let authUrl: string;

      if (platform === "tiktok_ads") {
        authUrl = `${config.authUrl}?app_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${platform}`;
      } else {
        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: "code",
          scope: config.scopes.join(" "),
          access_type: "offline",
          prompt: "consent",
          state: platform,
        });
        authUrl = `${config.authUrl}?${params.toString()}`;
      }

      return new Response(
        JSON.stringify({ authUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: Exchange authorization code for tokens
    if (action === "exchange_code") {
      if (!code || !redirectUri) {
        return new Response(
          JSON.stringify({ error: "Missing code or redirectUri" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let tokenData: Record<string, unknown>;

      if (platform === "tiktok_ads") {
        const resp = await fetch(config.tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            app_id: clientId,
            secret: clientSecret,
            auth_code: code,
          }),
        });
        const data = await resp.json();
        if (data.code !== 0) {
          throw new Error(`TikTok token exchange failed: ${JSON.stringify(data)}`);
        }
        tokenData = data.data;
      } else {
        const body = new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        });

        const resp = await fetch(config.tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });

        tokenData = await resp.json();
        if (!resp.ok) {
          throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`);
        }
      }

      // Store connection in database
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const accessToken = (tokenData as Record<string, string>).access_token;
      const refreshToken = (tokenData as Record<string, string>).refresh_token;
      const expiresIn = (tokenData as Record<string, number>).expires_in || 3600;

      // Fetch ad accounts based on platform
      let accounts: Array<{ id: string; name: string }> = [];

      try {
        if (platform === "google_ads") {
          const resp = await fetch(
            "https://googleads.googleapis.com/v16/customers:listAccessibleCustomers",
            { headers: { Authorization: `Bearer ${accessToken}`, "developer-token": Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN") || "" } }
          );
          if (resp.ok) {
            const data = await resp.json();
            accounts = (data.resourceNames || []).map((r: string) => ({
              id: r.replace("customers/", ""),
              name: r.replace("customers/", "Account "),
            }));
          }
        } else if (platform === "meta_ads") {
          const resp = await fetch(
            `https://graph.facebook.com/v19.0/me/adaccounts?fields=name,account_id&access_token=${accessToken}`
          );
          if (resp.ok) {
            const data = await resp.json();
            accounts = (data.data || []).map((a: Record<string, string>) => ({
              id: a.account_id || a.id,
              name: a.name || a.id,
            }));
          }
        } else if (platform === "ga4") {
          const resp = await fetch(
            "https://analyticsadmin.googleapis.com/v1beta/accountSummaries",
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (resp.ok) {
            const data = await resp.json();
            accounts = (data.accountSummaries || []).flatMap((a: Record<string, unknown>) =>
              ((a.propertySummaries as Array<Record<string, string>>) || []).map((p) => ({
                id: p.property?.replace("properties/", "") || "",
                name: `${p.displayName} (${a.displayName})`,
              }))
            );
          }
        }
      } catch (e) {
        console.error("Account fetch error:", e);
      }

      // Store encrypted tokens
      if (coachId) {
        const tokenExpiry = new Date(Date.now() + expiresIn * 1000).toISOString();

        await supabase.from("ad_platform_connections").upsert({
          coach_id: coachId,
          platform,
          status: accounts.length > 0 ? "select_account" : "connected",
          credentials_encrypted: {
            access_token: accessToken,
            refresh_token: refreshToken,
            token_type: (tokenData as Record<string, string>).token_type || "Bearer",
          },
          token_expires_at: tokenExpiry,
          needs_reconnect: false,
        }, { onConflict: "coach_id,platform" });
      }

      return new Response(
        JSON.stringify({
          success: true,
          accounts,
          has_accounts: accounts.length > 0,
          token_expires_in: expiresIn,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: Select account after OAuth
    if (action === "select_account") {
      const { accountId: selAccountId, accountName: selAccountName } = await req.json().catch(() => ({}));

      if (!coachId || !selAccountId) {
        return new Response(
          JSON.stringify({ error: "Missing coachId or accountId" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase.from("ad_platform_connections")
        .update({
          status: "connected",
          account_id: selAccountId,
          account_name: selAccountName || selAccountId,
        })
        .eq("coach_id", coachId)
        .eq("platform", platform);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: Refresh token
    if (action === "refresh_token") {
      if (!coachId) {
        return new Response(
          JSON.stringify({ error: "Missing coachId" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: conn } = await supabase.from("ad_platform_connections")
        .select("credentials_encrypted")
        .eq("coach_id", coachId)
        .eq("platform", platform)
        .single();

      if (!conn?.credentials_encrypted) {
        return new Response(
          JSON.stringify({ error: "No connection found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const creds = conn.credentials_encrypted as Record<string, string>;

      if (platform === "tiktok_ads") {
        return new Response(
          JSON.stringify({ error: "TikTok uses long-lived tokens, no refresh needed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: creds.refresh_token,
        grant_type: "refresh_token",
      });

      const resp = await fetch(config.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      const tokenData = await resp.json();
      if (!resp.ok) {
        await supabase.from("ad_platform_connections")
          .update({ needs_reconnect: true, error_log: "Token refresh failed" })
          .eq("coach_id", coachId)
          .eq("platform", platform);

        return new Response(
          JSON.stringify({ error: "Token refresh failed", needs_reconnect: true }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const expiresIn = tokenData.expires_in || 3600;
      await supabase.from("ad_platform_connections")
        .update({
          credentials_encrypted: {
            ...creds,
            access_token: tokenData.access_token,
          },
          token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
          needs_reconnect: false,
          error_log: null,
        })
        .eq("coach_id", coachId)
        .eq("platform", platform);

      return new Response(
        JSON.stringify({ success: true, expires_in: expiresIn }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: Test connection
    if (action === "test_connection") {
      return new Response(
        JSON.stringify({ connected: true, platform }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Platform OAuth error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
