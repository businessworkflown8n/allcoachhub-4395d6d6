import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SEOAnalyticsData {
  trafficOverview: any | null;
  trafficByPage: any | null;
  keywordPerformance: any | null;
  locationAnalytics: any | null;
  engagementMetrics: any | null;
  seoFunnel: any | null;
  aiInsights: any | null;
}

const parseGA4Rows = (report: any) => {
  if (!report?.rows) return [];
  const dimHeaders = report.dimensionHeaders?.map((h: any) => h.name) || [];
  const metricHeaders = report.metricHeaders?.map((h: any) => h.name) || [];

  return report.rows.map((row: any) => {
    const obj: Record<string, any> = {};
    row.dimensionValues?.forEach((v: any, i: number) => {
      obj[dimHeaders[i]] = v.value;
    });
    row.metricValues?.forEach((v: any, i: number) => {
      obj[metricHeaders[i]] = parseFloat(v.value) || 0;
    });
    return obj;
  });
};

const parseGA4Totals = (report: any) => {
  if (!report?.rows?.[0]) return {};
  const metricHeaders = report.metricHeaders?.map((h: any) => h.name) || [];
  const obj: Record<string, number> = {};
  report.rows[0].metricValues?.forEach((v: any, i: number) => {
    obj[metricHeaders[i]] = parseFloat(v.value) || 0;
  });
  return obj;
};

const parseGSCRows = (data: any) => {
  if (!data?.rows) return [];
  return data.rows.map((row: any) => ({
    keys: row.keys,
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
  }));
};

export const useSEOAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SEOAnalyticsData>({
    trafficOverview: null,
    trafficByPage: null,
    keywordPerformance: null,
    locationAnalytics: null,
    engagementMetrics: null,
    seoFunnel: null,
    aiInsights: null,
  });

  const fetchData = useCallback(async (action: string, startDate?: string, endDate?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("seo-analytics", {
        body: { action, startDate: startDate || "30daysAgo", endDate: endDate || "today" },
      });

      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);

      // Parse based on action
      switch (action) {
        case "traffic_overview":
          setData((prev) => ({
            ...prev,
            trafficOverview: {
              totals: parseGA4Totals(result.overview),
              trend: parseGA4Rows(result.trend),
              sources: parseGA4Rows(result.sources),
            },
          }));
          break;
        case "traffic_by_page":
          setData((prev) => ({
            ...prev,
            trafficByPage: parseGA4Rows(result.pages),
          }));
          break;
        case "keyword_performance":
          setData((prev) => ({
            ...prev,
            keywordPerformance: {
              keywords: parseGSCRows(result.keywords),
              keywordsByPage: parseGSCRows(result.keywordsByPage),
            },
          }));
          break;
        case "location_analytics":
          setData((prev) => ({
            ...prev,
            locationAnalytics: {
              countries: parseGA4Rows(result.countries),
              cities: parseGA4Rows(result.cities),
            },
          }));
          break;
        case "engagement_metrics":
          setData((prev) => ({
            ...prev,
            engagementMetrics: {
              totals: parseGA4Totals(result.engagement),
              byPage: parseGA4Rows(result.byPage),
            },
          }));
          break;
        case "seo_funnel":
          setData((prev) => ({
            ...prev,
            seoFunnel: {
              gsc: parseGSCRows(result.gscData),
              ga4: parseGA4Totals(result.ga4Data),
            },
          }));
          break;
        case "ai_insights": {
          const keywords = parseGSCRows(result.keywords);
          const pages = parseGA4Rows(result.pages);
          const trend = parseGA4Rows(result.trend);

          // Generate insights
          const insights: any[] = [];

          // High impressions, low CTR keywords
          keywords
            .filter((k: any) => k.impressions > 50 && k.ctr < 0.02)
            .slice(0, 5)
            .forEach((k: any) => {
              insights.push({
                type: "opportunity",
                severity: "warning",
                title: `Low CTR for "${k.keys[0]}"`,
                description: `${k.impressions} impressions but only ${(k.ctr * 100).toFixed(1)}% CTR. Improve title/meta description.`,
                metric: `Position: ${k.position.toFixed(1)}`,
              });
            });

          // Near-win keywords (position 4-20)
          keywords
            .filter((k: any) => k.position >= 4 && k.position <= 20 && k.impressions > 30)
            .sort((a: any, b: any) => a.position - b.position)
            .slice(0, 5)
            .forEach((k: any) => {
              insights.push({
                type: "push_zone",
                severity: "info",
                title: `Push "${k.keys[0]}" higher`,
                description: `Ranking at position ${k.position.toFixed(1)} with ${k.impressions} impressions. Add internal links and optimize content.`,
                metric: `CTR: ${(k.ctr * 100).toFixed(1)}%`,
              });
            });

          // High bounce rate pages
          pages
            .filter((p: any) => p.bounceRate > 0.7 && p.sessions > 10)
            .sort((a: any, b: any) => b.bounceRate - a.bounceRate)
            .slice(0, 5)
            .forEach((p: any) => {
              insights.push({
                type: "problem",
                severity: "error",
                title: `High bounce on ${p.pagePath}`,
                description: `${(p.bounceRate * 100).toFixed(0)}% bounce rate with ${p.sessions} sessions. Improve content relevance.`,
                metric: `Avg time: ${Math.round(p.averageSessionDuration)}s`,
              });
            });

          // Traffic drops
          if (trend.length >= 14) {
            const recent7 = trend.slice(-7).reduce((s: number, t: any) => s + t.sessions, 0);
            const prev7 = trend.slice(-14, -7).reduce((s: number, t: any) => s + t.sessions, 0);
            if (prev7 > 0) {
              const change = ((recent7 - prev7) / prev7) * 100;
              if (change < -20) {
                insights.push({
                  type: "alert",
                  severity: "error",
                  title: "Significant traffic drop detected",
                  description: `Traffic dropped ${Math.abs(change).toFixed(0)}% in the last 7 days compared to previous week.`,
                  metric: `${recent7} vs ${prev7} sessions`,
                });
              } else if (change > 20) {
                insights.push({
                  type: "success",
                  severity: "success",
                  title: "Traffic surge detected",
                  description: `Traffic increased ${change.toFixed(0)}% in the last 7 days.`,
                  metric: `${recent7} vs ${prev7} sessions`,
                });
              }
            }
          }

          setData((prev) => ({ ...prev, aiInsights: { insights, keywords, pages } }));
          break;
        }
      }
    } catch (err: any) {
      const msg = err?.message || "Failed to fetch analytics";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchData, parseGA4Rows, parseGA4Totals };
};
