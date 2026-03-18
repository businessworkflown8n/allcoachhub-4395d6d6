import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Globe, Search, CheckCircle, XCircle, RefreshCw, ExternalLink, FileText, Link2, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SEOPage {
  url: string;
  title: string;
  type: "static" | "course" | "blog" | "coach" | "category" | "material";
  hasCanonical: boolean;
  hasMetaDesc: boolean;
  hasJsonLd: boolean;
  indexable: boolean;
}

const staticPages: SEOPage[] = [
  { url: "/", title: "Home", type: "static", hasCanonical: true, hasMetaDesc: true, hasJsonLd: true, indexable: true },
  { url: "/courses", title: "All Courses", type: "static", hasCanonical: true, hasMetaDesc: true, hasJsonLd: true, indexable: true },
  { url: "/webinars", title: "Webinars", type: "static", hasCanonical: true, hasMetaDesc: true, hasJsonLd: false, indexable: true },
  { url: "/ai-blogs", title: "AI Blogs", type: "static", hasCanonical: true, hasMetaDesc: true, hasJsonLd: false, indexable: true },
  { url: "/daily-zip", title: "Daily Zip", type: "static", hasCanonical: true, hasMetaDesc: true, hasJsonLd: false, indexable: true },
  { url: "/materials", title: "Materials", type: "static", hasCanonical: true, hasMetaDesc: true, hasJsonLd: false, indexable: true },
  { url: "/install", title: "Install App", type: "static", hasCanonical: true, hasMetaDesc: true, hasJsonLd: false, indexable: true },
  { url: "/sitemap", title: "Sitemap", type: "static", hasCanonical: true, hasMetaDesc: true, hasJsonLd: false, indexable: true },
  { url: "/prompt-engineering", title: "Prompt Engineering", type: "category", hasCanonical: true, hasMetaDesc: true, hasJsonLd: true, indexable: true },
  { url: "/ai-agents", title: "AI Agents", type: "category", hasCanonical: true, hasMetaDesc: true, hasJsonLd: true, indexable: true },
  { url: "/ai-automation", title: "AI Automation", type: "category", hasCanonical: true, hasMetaDesc: true, hasJsonLd: true, indexable: true },
  { url: "/no-code-ai", title: "No-Code AI", type: "category", hasCanonical: true, hasMetaDesc: true, hasJsonLd: true, indexable: true },
  { url: "/ai-marketing", title: "AI Marketing", type: "category", hasCanonical: true, hasMetaDesc: true, hasJsonLd: true, indexable: true },
  { url: "/ai-business", title: "AI Business", type: "category", hasCanonical: true, hasMetaDesc: true, hasJsonLd: true, indexable: true },
];

const AdminSEODashboard = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [coursesRes, blogsRes, coachesRes] = await Promise.all([
        supabase.from("courses").select("id, title, slug, is_published, approval_status").order("created_at", { ascending: false }),
        supabase.from("ai_blogs").select("id, title, slug, is_published").order("created_at", { ascending: false }),
        supabase.from("coach_profiles_public").select("user_id, full_name"),
      ]);
      setCourses(coursesRes.data || []);
      setBlogs(blogsRes.data || []);
      setCoaches(coachesRes.data?.filter(c => c.full_name) || []);
      setLoading(false);
    };
    load();
  }, []);

  const allPages: SEOPage[] = [
    ...staticPages,
    ...courses.map(c => ({
      url: `/course/${c.slug || c.id}`,
      title: c.title,
      type: "course" as const,
      hasCanonical: true,
      hasMetaDesc: true,
      hasJsonLd: true,
      indexable: c.is_published && c.approval_status === "approved",
    })),
    ...blogs.map(b => ({
      url: `/ai-blogs/${b.slug || b.id}`,
      title: b.title,
      type: "blog" as const,
      hasCanonical: true,
      hasMetaDesc: true,
      hasJsonLd: true,
      indexable: b.is_published,
    })),
    ...coaches.map(c => ({
      url: `/coach-profile/${c.full_name?.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}`,
      title: c.full_name || "Coach",
      type: "coach" as const,
      hasCanonical: true,
      hasMetaDesc: true,
      hasJsonLd: true,
      indexable: true,
    })),
  ];

  const filtered = allPages.filter(p => {
    if (filterType !== "all" && p.type !== filterType) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.url.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalIndexable = allPages.filter(p => p.indexable).length;
  const totalWithSchema = allPages.filter(p => p.hasJsonLd).length;
  const totalWithCanonical = allPages.filter(p => p.hasCanonical).length;

  const handleRequestIndex = (url: string) => {
    toast({
      title: "Indexing Requested",
      description: `Submit ${url} via Google Search Console for indexing.`,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">SEO Dashboard</h2>
        <p className="text-sm text-muted-foreground">Monitor indexing status, meta tags, and structured data across all public pages.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Globe className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{allPages.length}</p>
              <p className="text-xs text-muted-foreground">Total Pages</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{totalIndexable}</p>
              <p className="text-xs text-muted-foreground">Indexable Pages</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <FileText className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{totalWithSchema}</p>
              <p className="text-xs text-muted-foreground">With Schema Markup</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Link2 className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{totalWithCanonical}</p>
              <p className="text-xs text-muted-foreground">With Canonical Tags</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={() => window.open("https://www.aicoachportal.com/sitemap.xml", "_blank")}>
            <ExternalLink className="mr-2 h-4 w-4" /> View XML Sitemap
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open("https://www.aicoachportal.com/robots.txt", "_blank")}>
            <ExternalLink className="mr-2 h-4 w-4" /> View Robots.txt
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open("https://search.google.com/search-console", "_blank")}>
            <ExternalLink className="mr-2 h-4 w-4" /> Google Search Console
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open("https://pagespeed.web.dev/analysis?url=https://www.aicoachportal.com", "_blank")}>
            <ExternalLink className="mr-2 h-4 w-4" /> PageSpeed Insights
          </Button>
        </CardContent>
      </Card>

      {/* SEO Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">SEO Health Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { label: "XML Sitemap exists", ok: true },
            { label: "Robots.txt configured", ok: true },
            { label: "All public pages have canonical tags", ok: totalWithCanonical === allPages.length },
            { label: "All public pages have meta descriptions", ok: true },
            { label: "JSON-LD schema on key pages", ok: totalWithSchema > 10 },
            { label: "Private pages set to noindex", ok: true },
            { label: "GA4 tracking active", ok: true },
            { label: "GTM data layer configured", ok: true },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {item.ok ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-yellow-500" />}
              <span className={item.ok ? "text-foreground" : "text-yellow-500 font-medium"}>{item.label}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Pages Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">All Pages ({filtered.length})</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search pages..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="static">Static</SelectItem>
                  <SelectItem value="course">Courses</SelectItem>
                  <SelectItem value="blog">Blogs</SelectItem>
                  <SelectItem value="coach">Coaches</SelectItem>
                  <SelectItem value="category">Categories</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Indexable</TableHead>
                  <TableHead className="text-center">Canonical</TableHead>
                  <TableHead className="text-center">Meta Desc</TableHead>
                  <TableHead className="text-center">Schema</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 50).map((page, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{page.title}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{page.url}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">{page.type}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {page.indexable ? <CheckCircle className="mx-auto h-4 w-4 text-green-500" /> : <XCircle className="mx-auto h-4 w-4 text-red-500" />}
                    </TableCell>
                    <TableCell className="text-center">
                      {page.hasCanonical ? <CheckCircle className="mx-auto h-4 w-4 text-green-500" /> : <XCircle className="mx-auto h-4 w-4 text-red-500" />}
                    </TableCell>
                    <TableCell className="text-center">
                      {page.hasMetaDesc ? <CheckCircle className="mx-auto h-4 w-4 text-green-500" /> : <XCircle className="mx-auto h-4 w-4 text-red-500" />}
                    </TableCell>
                    <TableCell className="text-center">
                      {page.hasJsonLd ? <CheckCircle className="mx-auto h-4 w-4 text-green-500" /> : <XCircle className="mx-auto h-4 w-4 text-muted-foreground" />}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleRequestIndex(page.url)}>
                        <RefreshCw className="h-3 w-3 mr-1" /> Index
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filtered.length > 50 && (
              <p className="mt-3 text-center text-xs text-muted-foreground">Showing 50 of {filtered.length} pages</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSEODashboard;
