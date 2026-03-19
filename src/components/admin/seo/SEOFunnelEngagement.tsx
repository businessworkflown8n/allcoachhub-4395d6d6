import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useSEOAnalytics } from "@/hooks/useSEOAnalytics";

const SEOFunnelEngagement = () => {
  const { data, loading, fetchData } = useSEOAnalytics();

  useEffect(() => {
    fetchData("seo_funnel");
    fetchData("engagement_metrics");
  }, []);

  const funnel = data.seoFunnel;
  const engagement = data.engagementMetrics;

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  // Build funnel data
  const gscTotals = (funnel?.gsc || []).reduce(
    (acc: any, r: any) => ({ impressions: acc.impressions + r.impressions, clicks: acc.clicks + r.clicks }),
    { impressions: 0, clicks: 0 }
  );
  const ga4 = funnel?.ga4 || {};

  const funnelSteps = [
    { name: "Impressions", value: gscTotals.impressions, color: "hsl(220,15%,40%)" },
    { name: "Clicks", value: gscTotals.clicks, color: "hsl(200,80%,50%)" },
    { name: "Sessions", value: Math.round(ga4.sessions || 0), color: "hsl(72,100%,50%)" },
    { name: "Engaged", value: Math.round(ga4.engagedSessions || 0), color: "hsl(120,60%,40%)" },
    { name: "Conversions", value: Math.round(ga4.conversions || 0), color: "hsl(0,84%,60%)" },
  ];

  const engTotals = engagement?.totals || {};
  const engPages = (engagement?.byPage || [])
    .sort((a: any, b: any) => (b.bounceRate || 0) - (a.bounceRate || 0))
    .slice(0, 20);

  return (
    <div className="space-y-6">
      {/* SEO Funnel */}
      <Card>
        <CardHeader><CardTitle className="text-base">SEO Funnel</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
            {funnelSteps.map((step, i) => (
              <div key={step.name} className="flex items-center gap-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{step.value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{step.name}</p>
                  {i > 0 && funnelSteps[i - 1].value > 0 && (
                    <p className="text-[10px] text-primary mt-0.5">
                      {((step.value / funnelSteps[i - 1].value) * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
                {i < funnelSteps.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={funnelSteps}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,18%)" />
              <XAxis dataKey="name" tick={{ fill: "hsl(220,10%,60%)", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(220,10%,60%)", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(220,18%,10%)", border: "1px solid hsl(220,15%,18%)", borderRadius: 8, color: "#fff" }} />
              <Bar dataKey="value" fill="hsl(72,100%,50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Engagement KPIs */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Avg Duration", value: `${Math.round(engTotals.averageSessionDuration || 0)}s` },
          { label: "Bounce Rate", value: `${((engTotals.bounceRate || 0) * 100).toFixed(1)}%` },
          { label: "Engagement Rate", value: `${((engTotals.engagementRate || 0) * 100).toFixed(1)}%` },
          { label: "Pages/Session", value: (engTotals.sessionsPerUser || 0).toFixed(1) },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-5 pb-4 text-center">
              <p className="text-xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Engagement by Page */}
      <Card>
        <CardHeader><CardTitle className="text-base">Page Engagement (Sorted by Bounce Rate)</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Avg Duration</TableHead>
                  <TableHead className="text-right">Bounce Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {engPages.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No data</TableCell></TableRow>
                ) : engPages.map((p: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm max-w-[200px] truncate">{p.pagePath}</TableCell>
                    <TableCell className="text-right">{Math.round(p.screenPageViews || 0)}</TableCell>
                    <TableCell className="text-right">{Math.round(p.averageSessionDuration || 0)}s</TableCell>
                    <TableCell className="text-right">
                      <span className={`font-medium ${(p.bounceRate || 0) > 0.7 ? "text-destructive" : (p.bounceRate || 0) > 0.5 ? "text-yellow-400" : "text-green-400"}`}>
                        {((p.bounceRate || 0) * 100).toFixed(1)}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SEOFunnelEngagement;
