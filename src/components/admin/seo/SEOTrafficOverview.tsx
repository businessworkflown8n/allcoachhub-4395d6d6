import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Eye, Clock, TrendingUp, BarChart3, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useSEOAnalytics } from "@/hooks/useSEOAnalytics";

const COLORS = ["hsl(72,100%,50%)", "hsl(220,15%,40%)", "hsl(0,84%,60%)", "hsl(200,80%,50%)", "hsl(120,60%,40%)"];

const SEOTrafficOverview = () => {
  const { data, loading, fetchData } = useSEOAnalytics();

  useEffect(() => { fetchData("traffic_overview"); }, []);

  const totals = data.trafficOverview?.totals || {};
  const trend = (data.trafficOverview?.trend || []).map((t: any) => ({
    ...t,
    date: t.date ? `${t.date.slice(4, 6)}/${t.date.slice(6, 8)}` : "",
  }));
  const sources = data.trafficOverview?.sources || [];

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const kpis = [
    { label: "Total Sessions", value: Math.round(totals.sessions || 0).toLocaleString(), icon: BarChart3, color: "text-primary" },
    { label: "Total Users", value: Math.round(totals.totalUsers || 0).toLocaleString(), icon: Users, color: "text-blue-400" },
    { label: "New Users", value: Math.round(totals.newUsers || 0).toLocaleString(), icon: ArrowUpRight, color: "text-green-400" },
    { label: "Page Views", value: Math.round(totals.screenPageViews || 0).toLocaleString(), icon: Eye, color: "text-yellow-400" },
    { label: "Avg Duration", value: `${Math.round(totals.averageSessionDuration || 0)}s`, icon: Clock, color: "text-purple-400" },
    { label: "Bounce Rate", value: `${((totals.bounceRate || 0) * 100).toFixed(1)}%`, icon: ArrowDownRight, color: "text-destructive" },
    { label: "Engaged Sessions", value: Math.round(totals.engagedSessions || 0).toLocaleString(), icon: TrendingUp, color: "text-primary" },
    { label: "Conversions", value: Math.round(totals.conversions || 0).toLocaleString(), icon: BarChart3, color: "text-green-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="flex items-center gap-3 pt-5 pb-4">
              <kpi.icon className={`h-7 w-7 ${kpi.color} shrink-0`} />
              <div>
                <p className="text-xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Traffic Trend (Last 30 Days)</CardTitle></CardHeader>
          <CardContent>
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,18%)" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(220,10%,60%)", fontSize: 11 }} />
                  <YAxis tick={{ fill: "hsl(220,10%,60%)", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "hsl(220,18%,10%)", border: "1px solid hsl(220,15%,18%)", borderRadius: 8, color: "#fff" }} />
                  <Line type="monotone" dataKey="sessions" stroke="hsl(72,100%,50%)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="totalUsers" stroke="hsl(200,80%,50%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground py-8 text-center">No data available</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Traffic Sources</CardTitle></CardHeader>
          <CardContent>
            {sources.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={sources} dataKey="sessions" nameKey="sessionDefaultChannelGroup" cx="50%" cy="50%" outerRadius={70} label={(e: any) => e.sessionDefaultChannelGroup}>
                      {sources.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(220,18%,10%)", border: "1px solid hsl(220,15%,18%)", borderRadius: 8, color: "#fff" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {sources.slice(0, 6).map((s: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        {s.sessionDefaultChannelGroup}
                      </span>
                      <span className="text-muted-foreground">{Math.round(s.sessions)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <p className="text-sm text-muted-foreground py-8 text-center">No data</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SEOTrafficOverview;
