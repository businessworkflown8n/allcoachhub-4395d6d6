import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, CheckCircle, XCircle, RefreshCw, Edit, Eye, Loader2, Globe, Clock, TrendingUp, AlertTriangle, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import SEOEditorPanel from "./SEOEditorPanel";
import { analyzeSEO, getScoreColor, getScoreBg } from "@/lib/seoScorer";

interface SEOPageRow {
  id: string;
  page_url: string;
  page_type: string;
  meta_title: string | null;
  meta_description: string | null;
  h1_tag: string | null;
  primary_keyword: string | null;
  secondary_keywords: string[] | null;
  robots_directive: string;
  canonical_url: string | null;
  schema_markup: any;
  seo_score: number;
  index_status: string;
  last_crawled_at: string | null;
  crawl_errors: string | null;
  is_auto_generated: boolean;
  indexed_date?: string | null;
  sitemap_included?: boolean;
  content_length?: number;
  image_count?: number;
  images_with_alt?: number;
}

const SEOPageManager = () => {
  const [pages, setPages] = useState<SEOPageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterScore, setFilterScore] = useState("all");
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [editingPage, setEditingPage] = useState<SEOPageRow | null>(null);
  const [syncing, setSyncing] = useState(false);

  const loadPages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("seo_page_metadata")
      .select("*")
      .order("page_url");
    if (!error && data) setPages(data as SEOPageRow[]);
    setLoading(false);
  };

  const syncPages = async () => {
    setSyncing(true);
    const [coursesRes, blogsRes, coachesRes, websitesRes] = await Promise.all([
      supabase.from("courses").select("id, title, slug, description, category, coach_id, is_published, approval_status"),
      supabase.from("ai_blogs").select("id, title, slug, excerpt, category, is_published"),
      supabase.from("coach_profiles_public").select("user_id, full_name, bio, category"),
      supabase.from("coach_websites").select("id, slug, institute_name, description, tagline, meta_title, meta_description, coach_id, is_live, status"),
    ]);

    const existingUrls = new Set(pages.map(p => p.page_url));
    const newPages: any[] = [];

    const staticDefs = [
      { url: "/", type: "landing", title: "AI Coach Portal – Learn AI Tools & Skills", desc: "Learn AI tools, prompt engineering, and automation with expert coaches." },
      { url: "/courses", type: "landing", title: "All AI Courses | AI Coach Portal", desc: "Browse and enroll in top AI courses." },
      { url: "/webinars", type: "landing", title: "AI Webinars | AI Coach Portal", desc: "Join live AI webinars with industry experts." },
      { url: "/ai-blogs", type: "landing", title: "AI Blog | AI Coach Portal", desc: "Latest AI trends, tips and insights." },
      { url: "/materials", type: "landing", title: "AI Learning Materials | AI Coach Portal", desc: "Download free AI learning materials." },
      { url: "/daily-zip", type: "landing", title: "Daily Zip Game | AI Coach Portal", desc: "Play the daily AI puzzle challenge." },
      { url: "/browse-coaches", type: "landing", title: "Browse AI Coaches | AI Coach Portal", desc: "Find the perfect AI coach for your learning journey." },
    ];

    for (const s of staticDefs) {
      if (!existingUrls.has(s.url)) {
        newPages.push({
          page_url: s.url, page_type: s.type, meta_title: s.title, meta_description: s.desc,
          robots_directive: "index, follow", canonical_url: `https://www.aicoachportal.com${s.url}`,
          seo_score: 0, index_status: "not_indexed", is_auto_generated: true, sitemap_included: true,
        });
      }
    }

    for (const c of (coursesRes.data || [])) {
      const url = `/course/${c.slug || c.id}`;
      if (!existingUrls.has(url)) {
        newPages.push({
          page_url: url, page_type: "course", meta_title: `${c.title} | AI Coach Portal`,
          meta_description: c.description?.slice(0, 155) || `Learn ${c.title} with expert coaching.`,
          h1_tag: c.title, primary_keyword: c.category?.toLowerCase(),
          robots_directive: c.is_published && c.approval_status === "approved" ? "index, follow" : "noindex, follow",
          canonical_url: `https://www.aicoachportal.com${url}`, seo_score: 0, index_status: "not_indexed",
          is_auto_generated: true, coach_id: c.coach_id, page_title: c.title, sitemap_included: true,
        });
      }
    }

    for (const b of (blogsRes.data || [])) {
      const url = `/ai-blogs/${b.slug || b.id}`;
      if (!existingUrls.has(url)) {
        newPages.push({
          page_url: url, page_type: "blog", meta_title: `${b.title} | AI Coach Portal`,
          meta_description: b.excerpt?.slice(0, 155) || "", h1_tag: b.title, primary_keyword: b.category?.toLowerCase(),
          robots_directive: b.is_published ? "index, follow" : "noindex, follow",
          canonical_url: `https://www.aicoachportal.com${url}`, seo_score: 0, index_status: "not_indexed",
          is_auto_generated: true, page_title: b.title, sitemap_included: true,
        });
      }
    }

    for (const c of (coachesRes.data || []).filter((c: any) => c.full_name)) {
      const slug = c.full_name?.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
      const url = `/coach-profile/${slug}`;
      if (!existingUrls.has(url)) {
        newPages.push({
          page_url: url, page_type: "coach", meta_title: `${c.full_name} – AI Coach | AI Coach Portal`,
          meta_description: c.bio?.slice(0, 155) || `Learn from ${c.full_name}, expert AI coach.`,
          h1_tag: c.full_name, robots_directive: "index, follow",
          canonical_url: `https://www.aicoachportal.com${url}`, seo_score: 0, index_status: "not_indexed",
          is_auto_generated: true, page_title: c.full_name, sitemap_included: true,
        });
      }
    }

    for (const w of (websitesRes.data || [])) {
      const url = `/coach-website/${w.slug}`;
      if (!existingUrls.has(url) && w.is_live && w.status === "approved") {
        newPages.push({
          page_url: url, page_type: "coach", meta_title: w.meta_title || `${w.institute_name} | AI Coach Portal`,
          meta_description: w.meta_description || w.description?.slice(0, 155) || w.tagline || "",
          robots_directive: "index, follow", canonical_url: `https://www.aicoachportal.com${url}`,
          seo_score: 0, index_status: "not_indexed", is_auto_generated: true,
          coach_id: w.coach_id, page_title: w.institute_name, sitemap_included: true,
        });
      }
    }

    if (newPages.length > 0) {
      const { error } = await supabase.from("seo_page_metadata").insert(newPages);
      if (error) {
        toast({ title: "Sync Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Pages Synced", description: `${newPages.length} new pages added.` });
        await loadPages();
      }
    } else {
      toast({ title: "Up to Date", description: "No new pages to sync." });
    }
    setSyncing(false);
  };

  useEffect(() => { loadPages(); }, []);

  const calculateScore = (p: SEOPageRow): number => {
    return analyzeSEO({
      metaTitle: p.meta_title || "", metaDescription: p.meta_description || "", h1Tag: p.h1_tag || "",
      primaryKeyword: p.primary_keyword || "", canonicalUrl: p.canonical_url || "", schemaMarkup: p.schema_markup,
      pageUrl: p.page_url, contentLength: p.content_length || 0, imageCount: p.image_count || 0,
      imagesWithAlt: p.images_with_alt || 0,
    }).score;
  };

  const filtered = useMemo(() => pages.filter(p => {
    if (filterType !== "all" && p.page_type !== filterType) return false;
    if (filterStatus !== "all" && p.index_status !== filterStatus) return false;
    if (filterScore !== "all") {
      const s = calculateScore(p);
      if (filterScore === "high" && s < 80) return false;
      if (filterScore === "medium" && (s < 50 || s >= 80)) return false;
      if (filterScore === "low" && s >= 50) return false;
    }
    if (search && !p.page_url.toLowerCase().includes(search.toLowerCase()) && !p.meta_title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [pages, filterType, filterStatus, filterScore, search]);

  // KPI stats
  const totalPages = pages.length;
  const indexedCount = pages.filter(p => p.index_status === "indexed").length;
  const pendingCount = pages.filter(p => ["pending", "submitted", "not_indexed"].includes(p.index_status)).length;
  const avgScore = totalPages > 0 ? Math.round(pages.reduce((s, p) => s + calculateScore(p), 0) / totalPages) : 0;

  const toggleSelect = (id: string) => {
    const next = new Set(selectedPages);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedPages(next);
  };
  const toggleAll = () => {
    setSelectedPages(selectedPages.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id)));
  };

  const handleBulkIndex = async () => {
    if (selectedPages.size === 0) return;
    const { error } = await supabase.from("seo_page_metadata")
      .update({ index_status: "submitted", indexing_submitted_at: new Date().toISOString() })
      .in("id", Array.from(selectedPages));
    if (!error) {
      toast({ title: "Indexing Requested", description: `${selectedPages.size} pages marked as submitted. Submit via Google Search Console.` });
      setSelectedPages(new Set());
      await loadPages();
    }
  };

  const exportCSV = () => {
    const header = "URL,Type,Index Status,SEO Score,Meta Title,Keyword\n";
    const rows = filtered.map(p => `"${p.page_url}","${p.page_type}","${p.index_status}","${calculateScore(p)}","${p.meta_title || ""}","${p.primary_keyword || ""}"`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "seo-pages-export.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const getIndexIcon = (status: string) => {
    if (status === "indexed") return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === "pending" || status === "submitted") return <Clock className="h-4 w-4 text-yellow-500" />;
    if (status === "failed") return <AlertTriangle className="h-4 w-4 text-destructive" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  if (editingPage) {
    return <SEOEditorPanel page={editingPage} onClose={() => { setEditingPage(null); loadPages(); }} />;
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-5 pb-4">
            <Globe className="h-7 w-7 text-primary shrink-0" />
            <div>
              <p className="text-xl font-bold text-foreground">{totalPages}</p>
              <p className="text-xs text-muted-foreground">Total URLs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-5 pb-4">
            <CheckCircle className="h-7 w-7 text-green-500 shrink-0" />
            <div>
              <p className="text-xl font-bold text-foreground">{indexedCount}</p>
              <p className="text-xs text-muted-foreground">Indexed Pages</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-5 pb-4">
            <Clock className="h-7 w-7 text-yellow-500 shrink-0" />
            <div>
              <p className="text-xl font-bold text-foreground">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending Pages</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-5 pb-4">
            <TrendingUp className={`h-7 w-7 shrink-0 ${getScoreColor(avgScore)}`} />
            <div>
              <p className={`text-xl font-bold ${getScoreColor(avgScore)}`}>{avgScore}</p>
              <p className="text-xs text-muted-foreground">Avg SEO Score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={syncPages} disabled={syncing} variant="outline" size="sm">
          {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Sync Pages
        </Button>
        <Button onClick={exportCSV} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
        {selectedPages.size > 0 && (
          <>
            <Button onClick={handleBulkIndex} size="sm" variant="outline">
              <RefreshCw className="mr-2 h-3.5 w-3.5" /> Request Index ({selectedPages.size})
            </Button>
            <span className="text-sm text-muted-foreground">{selectedPages.size} selected</span>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search pages..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-56" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="landing">Landing</SelectItem>
            <SelectItem value="course">Course</SelectItem>
            <SelectItem value="blog">Blog</SelectItem>
            <SelectItem value="coach">Coach</SelectItem>
            <SelectItem value="webinar">Webinar</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="indexed">Indexed</SelectItem>
            <SelectItem value="not_indexed">Not Indexed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterScore} onValueChange={setFilterScore}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scores</SelectItem>
            <SelectItem value="high">High (80+)</SelectItem>
            <SelectItem value="medium">Medium (50-79)</SelectItem>
            <SelectItem value="low">Low (&lt;50)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Pages ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={selectedPages.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
                    </TableHead>
                    <TableHead>Page URL</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Index</TableHead>
                    <TableHead>Indexed Date</TableHead>
                    <TableHead>Meta Title</TableHead>
                    <TableHead>Keyword</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 100).map(page => {
                    const score = calculateScore(page);
                    return (
                      <TableRow key={page.id}>
                        <TableCell>
                          <Checkbox checked={selectedPages.has(page.id)} onCheckedChange={() => toggleSelect(page.id)} />
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{page.page_url}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs capitalize">{page.page_type}</Badge>
                        </TableCell>
                        <TableCell>{getIndexIcon(page.index_status)}</TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {page.indexed_date ? new Date(page.indexed_date).toLocaleDateString() : "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs text-muted-foreground truncate max-w-[160px]">{page.meta_title || "—"}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs text-muted-foreground truncate max-w-[100px]">{page.primary_keyword || "—"}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${getScoreBg(score)}`} />
                            <span className={`text-sm font-bold ${getScoreColor(score)}`}>{score}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setEditingPage(page)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => window.open(`https://www.aicoachportal.com${page.page_url}`, "_blank")}>
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {filtered.length > 100 && (
                <p className="mt-3 text-center text-xs text-muted-foreground">Showing 100 of {filtered.length} pages</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SEOPageManager;
