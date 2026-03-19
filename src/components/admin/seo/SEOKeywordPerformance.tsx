import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search, TrendingUp, Eye, MousePointerClick } from "lucide-react";
import { useSEOAnalytics } from "@/hooks/useSEOAnalytics";

const getRankBadge = (pos: number) => {
  if (pos <= 3) return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Top 3</Badge>;
  if (pos <= 10) return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Page 1</Badge>;
  if (pos <= 20) return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">Push Zone</Badge>;
  return <Badge variant="outline" className="text-xs">Deep</Badge>;
};

const getOpportunityScore = (impressions: number, ctr: number, position: number) => {
  if (impressions > 100 && ctr < 0.03 && position <= 20) return "🔥 High";
  if (impressions > 50 && ctr < 0.05) return "⚡ Medium";
  return "—";
};

const SEOKeywordPerformance = () => {
  const { data, loading, fetchData } = useSEOAnalytics();
  const [filter, setFilter] = useState("");

  useEffect(() => { fetchData("keyword_performance"); }, []);

  const keywords = data.keywordPerformance?.keywords || [];
  const filtered = keywords.filter((k: any) =>
    k.keys[0]?.toLowerCase().includes(filter.toLowerCase())
  );

  const totalClicks = keywords.reduce((s: number, k: any) => s + k.clicks, 0);
  const totalImpressions = keywords.reduce((s: number, k: any) => s + k.impressions, 0);
  const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const avgPos = keywords.length > 0 ? keywords.reduce((s: number, k: any) => s + k.position, 0) / keywords.length : 0;

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Clicks", value: totalClicks.toLocaleString(), icon: MousePointerClick, color: "text-primary" },
          { label: "Impressions", value: totalImpressions.toLocaleString(), icon: Eye, color: "text-blue-400" },
          { label: "Avg CTR", value: `${(avgCtr * 100).toFixed(2)}%`, icon: TrendingUp, color: "text-green-400" },
          { label: "Avg Position", value: avgPos.toFixed(1), icon: Search, color: "text-yellow-400" },
        ].map((kpi) => (
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Keyword Performance (Search Console)</CardTitle>
          <Input placeholder="Filter keywords..." value={filter} onChange={(e) => setFilter(e.target.value)} className="w-48 h-8 text-sm" />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keyword</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">Position</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>Opportunity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No keyword data available</TableCell></TableRow>
                ) : filtered.slice(0, 50).map((k: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-sm max-w-[200px] truncate">{k.keys[0]}</TableCell>
                    <TableCell className="text-right">{k.clicks}</TableCell>
                    <TableCell className="text-right">{k.impressions.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{(k.ctr * 100).toFixed(2)}%</TableCell>
                    <TableCell className="text-right">{k.position.toFixed(1)}</TableCell>
                    <TableCell>{getRankBadge(k.position)}</TableCell>
                    <TableCell className="text-xs">{getOpportunityScore(k.impressions, k.ctr, k.position)}</TableCell>
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

export default SEOKeywordPerformance;
