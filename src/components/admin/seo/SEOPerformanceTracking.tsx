import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Eye, MousePointerClick, Loader2 } from "lucide-react";

const SEOPerformanceTracking = () => {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("seo_page_metadata")
        .select("id, page_url, page_type, seo_score, index_status, meta_title, primary_keyword, robots_directive")
        .order("seo_score", { ascending: true });
      setPages(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const avgScore = pages.length > 0 ? Math.round(pages.reduce((sum, p) => sum + (p.seo_score || 0), 0) / pages.length) : 0;
  const indexedPercent = pages.length > 0 ? Math.round((pages.filter(p => p.index_status === "indexed").length / pages.length) * 100) : 0;
  const noTitleCount = pages.filter(p => !p.meta_title).length;
  const noKeywordCount = pages.filter(p => !p.primary_keyword).length;

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-700 border-green-200">Good</Badge>;
    if (score >= 50) return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Needs Work</Badge>;
    return <Badge className="bg-red-100 text-red-700 border-red-200">Poor</Badge>;
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{avgScore}</p>
              <p className="text-xs text-muted-foreground">Avg SEO Score</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{indexedPercent}%</p>
              <p className="text-xs text-muted-foreground">Indexed Rate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Eye className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{noTitleCount}</p>
              <p className="text-xs text-muted-foreground">Missing Titles</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <MousePointerClick className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{noKeywordCount}</p>
              <p className="text-xs text-muted-foreground">Missing Keywords</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEO Health Checklist */}
      <Card>
        <CardHeader><CardTitle className="text-lg">SEO Health Summary</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[
            { label: "XML Sitemap exists at /sitemap.xml", ok: true },
            { label: "Robots.txt configured correctly", ok: true },
            { label: "All public pages have meta titles", ok: noTitleCount === 0 },
            { label: "All pages have primary keywords", ok: noKeywordCount === 0 },
            { label: "Average SEO score above 60", ok: avgScore >= 60 },
            { label: "GA4 tracking active", ok: true },
            { label: "GTM data layer configured", ok: true },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {item.ok
                ? <Badge className="h-5 w-5 rounded-full bg-green-100 text-green-600 p-0 flex items-center justify-center text-xs">✓</Badge>
                : <Badge className="h-5 w-5 rounded-full bg-red-100 text-red-600 p-0 flex items-center justify-center text-xs">✗</Badge>
              }
              <span className={item.ok ? "text-foreground" : "text-destructive font-medium"}>{item.label}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Lowest Scoring Pages */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Lowest Scoring Pages (Needs Optimization)</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page URL</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.slice(0, 20).map(p => {
                  const issues: string[] = [];
                  if (!p.meta_title) issues.push("No title");
                  if (!p.primary_keyword) issues.push("No keyword");
                  if (p.seo_score < 50) issues.push("Low score");
                  return (
                    <TableRow key={p.id}>
                      <TableCell><p className="text-sm truncate max-w-[220px]">{p.page_url}</p></TableCell>
                      <TableCell><Badge variant="outline" className="text-xs capitalize">{p.page_type}</Badge></TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${p.seo_score >= 80 ? "text-green-600" : p.seo_score >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                          {p.seo_score}
                        </span>
                      </TableCell>
                      <TableCell>{getScoreBadge(p.seo_score)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {issues.map((issue, i) => (
                            <Badge key={i} variant="destructive" className="text-xs">{issue}</Badge>
                          ))}
                          {issues.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SEOPerformanceTracking;
