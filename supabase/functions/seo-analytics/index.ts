import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GA4_PROPERTY_ID = "526404770";

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  const refreshToken = Deno.env.get("GOOGLE_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Google OAuth credentials not configured");
  }

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(`Token refresh failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function fetchGA4Data(accessToken: string, startDate: string, endDate: string, metrics: string[], dimensions: string[]) {
  const body: any = {
    dateRanges: [{ startDate, endDate }],
    metrics: metrics.map((m) => ({ name: m })),
  };
  if (dimensions.length > 0) {
    body.dimensions = dimensions.map((d) => ({ name: d }));
  }
  body.limit = 500;

  const resp = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(`GA4 API error: ${JSON.stringify(data)}`);
  }
  return data;
}

async function fetchGSCData(accessToken: string, startDate: string, endDate: string, dimensions: string[], rowLimit = 100) {
  const siteUrl = "sc-domain:aicoachportal.com";
  const resp = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions,
        rowLimit,
        type: "web",
      }),
    }
  );

  const data = await resp.json();
  if (!resp.ok) {
    // Try with URL prefix format
    const resp2 = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent("https://www.aicoachportal.com/")}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions,
          rowLimit,
          type: "web",
        }),
      }
    );
    const data2 = await resp2.json();
    if (!resp2.ok) {
      throw new Error(`GSC API error: ${JSON.stringify(data2)}`);
    }
    return data2;
  }
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, startDate, endDate } = await req.json();
    const start = startDate || "30daysAgo";
    const end = endDate || "today";
    const accessToken = await getAccessToken();

    let result: any = {};

    switch (action) {
      case "traffic_overview": {
        // Total sessions, users, new users, pageviews, engagement
        const overview = await fetchGA4Data(accessToken, start, end, [
          "sessions", "totalUsers", "newUsers", "screenPageViews",
          "engagedSessions", "averageSessionDuration", "bounceRate",
          "conversions"
        ], []);

        // Daily trend
        const trend = await fetchGA4Data(accessToken, start, end, [
          "sessions", "totalUsers", "screenPageViews"
        ], ["date"]);

        // Traffic source split
        const sources = await fetchGA4Data(accessToken, start, end, [
          "sessions", "totalUsers"
        ], ["sessionDefaultChannelGroup"]);

        result = { overview, trend, sources };
        break;
      }

      case "traffic_by_page": {
        const pages = await fetchGA4Data(accessToken, start, end, [
          "sessions", "totalUsers", "averageSessionDuration",
          "bounceRate", "conversions", "screenPageViews"
        ], ["pagePath"]);

        result = { pages };
        break;
      }

      case "keyword_performance": {
        const keywords = await fetchGSCData(accessToken, start, end, ["query"], 200);
        const keywordsByPage = await fetchGSCData(accessToken, start, end, ["query", "page"], 200);
        result = { keywords, keywordsByPage };
        break;
      }

      case "location_analytics": {
        const countries = await fetchGA4Data(accessToken, start, end, [
          "sessions", "totalUsers", "averageSessionDuration", "conversions"
        ], ["country"]);

        const cities = await fetchGA4Data(accessToken, start, end, [
          "sessions", "totalUsers"
        ], ["city"]);

        result = { countries, cities };
        break;
      }

      case "engagement_metrics": {
        const engagement = await fetchGA4Data(accessToken, start, end, [
          "averageSessionDuration", "bounceRate", "engagedSessions",
          "engagementRate", "screenPageViews", "sessionsPerUser"
        ], []);

        const byPage = await fetchGA4Data(accessToken, start, end, [
          "averageSessionDuration", "bounceRate", "screenPageViews"
        ], ["pagePath"]);

        result = { engagement, byPage };
        break;
      }

      case "seo_funnel": {
        // GSC: impressions + clicks
        const gscData = await fetchGSCData(accessToken, start, end, ["date"], 500);
        
        // GA4: sessions + engaged sessions + conversions
        const ga4Data = await fetchGA4Data(accessToken, start, end, [
          "sessions", "engagedSessions", "conversions"
        ], []);

        result = { gscData, ga4Data };
        break;
      }

      case "ai_insights": {
        // High impressions low CTR keywords
        const keywords = await fetchGSCData(accessToken, start, end, ["query"], 500);
        
        // Pages with high bounce rate
        const pages = await fetchGA4Data(accessToken, start, end, [
          "bounceRate", "sessions", "averageSessionDuration"
        ], ["pagePath"]);

        // Traffic trend for drop detection
        const trend = await fetchGA4Data(accessToken, start, end, [
          "sessions"
        ], ["date"]);

        result = { keywords, pages, trend };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("SEO Analytics error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
