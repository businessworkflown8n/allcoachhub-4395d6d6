import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Copy, Search, Download, Eye, Users, TrendingUp, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CoachTraffic {
  coach_user_id: string;
  full_name: string;
  slug: string;
  category: string | null;
  views: number;
  enrollments: number;
  webinar_registrations: number;
  conversion_rate: number;
}

const AdminTrafficAnalytics = () => {
  const [data, setData] = useState<CoachTraffic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    // Get all coach profiles with slugs
    const { data: coaches } = await supabase
      .from("profiles")
      .select("user_id, full_name, slug, category")
      .not("slug", "is", null);

    if (!coaches) {
      setLoading(false);
      return;
    }

    // Filter to only coaches
    const { data: coachRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "coach");

    const coachUserIds = new Set((coachRoles || []).map((r) => r.user_id));
    const coachProfiles = coaches.filter((c) => coachUserIds.has(c.user_id));

    // Get page views per coach
    const { data: views } = await supabase
      .from("coach_page_views")
      .select("coach_user_id, viewed_at");

    const viewCounts: Record<string, number> = {};
    (views || []).forEach((v) => {
      viewCounts[v.coach_user_id] = (viewCounts[v.coach_user_id] || 0) + 1;
    });

    // Get enrollments per coach
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("coach_id");

    const enrollCounts: Record<string, number> = {};
    (enrollments || []).forEach((e) => {
      enrollCounts[e.coach_id] = (enrollCounts[e.coach_id] || 0) + 1;
    });

    // Get webinar registrations per coach (via webinars)
    const { data: webinars } = await supabase
      .from("webinars")
      .select("id, coach_id");

    const webinarToCoach: Record<string, string> = {};
    (webinars || []).forEach((w) => {
      webinarToCoach[w.id] = w.coach_id;
    });

    const { data: registrations } = await supabase
      .from("webinar_registrations")
      .select("webinar_id");

    const regCounts: Record<string, number> = {};
    (registrations || []).forEach((r) => {
      const coachId = webinarToCoach[r.webinar_id];
      if (coachId) regCounts[coachId] = (regCounts[coachId] || 0) + 1;
    });

    // Combine
    const result: CoachTraffic[] = coachProfiles.map((c) => {
      const v = viewCounts[c.user_id] || 0;
      const e = enrollCounts[c.user_id] || 0;
      const wr = regCounts[c.user_id] || 0;
      return {
        coach_user_id: c.user_id,
        full_name: c.full_name || "Unknown",
        slug: c.slug || "",
        category: c.category,
        views: v,
        enrollments: e,
        webinar_registrations: wr,
        conversion_rate: v > 0 ? Math.round(((e + wr) / v) * 100 * 10) / 10 : 0,
      };
    });

    result.sort((a, b) => b.views - a.views);
    setData(result);
    setLoading(false);
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/coach-profile/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied!", description: url });
  };

  const exportCSV = () => {
    const headers = ["Coach,Category,Slug,Link,Views,Enrollments,Webinar Registrations,Conversion Rate"];
    const rows = filtered.map((d) =>
      `"${d.full_name}","${d.category || ""}","${d.slug}","${window.location.origin}/coach-profile/${d.slug}",${d.views},${d.enrollments},${d.webinar_registrations},${d.conversion_rate}%`
    );
    const csv = [...headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "coach-traffic-analytics.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported" });
  };

  const filtered = data.filter(
    (d) =>
      d.full_name.toLowerCase().includes(search.toLowerCase()) ||
      d.slug.toLowerCase().includes(search.toLowerCase()) ||
      (d.category || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalViews = data.reduce((s, d) => s + d.views, 0);
  const totalEnrollments = data.reduce((s, d) => s + d.enrollments, 0);
  const totalRegis = data.reduce((s, d) => s + d.webinar_registrations, 0);
  const avgConversion = totalViews > 0 ? Math.round(((totalEnrollments + totalRegis) / totalViews) * 100 * 10) / 10 : 0;

  if (loading) {
    return <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Coach Traffic Analytics</h2>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Eye className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Page Views</p>
              <p className="text-2xl font-bold text-foreground">{totalViews.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Enrollments</p>
              <p className="text-2xl font-bold text-foreground">{totalEnrollments.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Webinar Registrations</p>
              <p className="text-2xl font-bold text-foreground">{totalRegis.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Avg Conversion</p>
              <p className="text-2xl font-bold text-foreground">{avgConversion}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Export */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search coaches..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" onClick={exportCSV} className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Coach</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Landing Link</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Enrollments</TableHead>
                  <TableHead className="text-right">Webinar Reg.</TableHead>
                  <TableHead className="text-right">Conversion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No coach data found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((d) => (
                    <TableRow key={d.coach_user_id}>
                      <TableCell className="font-medium">{d.full_name}</TableCell>
                      <TableCell>{d.category ? <Badge variant="secondary">{d.category}</Badge> : "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="max-w-[200px] truncate rounded bg-muted px-2 py-0.5 text-xs">/coach-profile/{d.slug}</code>
                          <button onClick={() => copyLink(d.slug)} className="text-muted-foreground hover:text-foreground" title="Copy link">
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <a href={`/coach-profile/${d.slug}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" title="Open page">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">{d.views.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono">{d.enrollments.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono">{d.webinar_registrations.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={d.conversion_rate >= 5 ? "default" : "outline"}>
                          {d.conversion_rate}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTrafficAnalytics;
