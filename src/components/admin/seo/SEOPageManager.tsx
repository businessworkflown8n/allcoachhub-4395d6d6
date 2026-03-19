import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, CheckCircle, XCircle, RefreshCw, Edit, Eye, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import SEOEditorPanel from "./SEOEditorPanel";

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
}

const SEOPageManager = () => {
  const [pages, setPages] = useState<SEOPageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
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
    // Fetch courses, blogs, coaches to auto-populate
    const [coursesRes, blogsRes, coachesRes] = await Promise.all([
      supabase.from("courses").select("id, title, slug, description, category, coach_id, is_published, approval_status"),
      supabase.from("ai_blogs").select("id, title, slug, excerpt, category, is_published"),
      supabase.from("coach_profiles_public").select("user_id, full_name, bio, category"),
    ]);

    const existingUrls = new Set(pages.map(p => p.page_url));
    const newPages: any[] = [];

    // Static pages
    const staticDefs = [
      { url: "/", type: "landing", title: "AI Coach Portal – Learn AI Tools & Skills", desc: "Learn AI tools, prompt engineering, and automation with expert coaches." },
      { url: "/courses", type: "landing", title: "All AI Courses | AI Coach Portal", desc: "Browse and enroll in top AI courses." },
      { url: "/webinars", type: "landing", title: "AI Webinars | AI Coach Portal", desc: "Join live AI webinars with industry experts." },
      { url: "/ai-blogs", type: "landing", title: "AI Blog | AI Coach Portal", desc: "Latest AI trends, tips and insights." },
      { url: "/materials", type: "landing", title: "AI Learning Materials | AI Coach Portal", desc: "Download free AI learning materials." },
      { url: "/daily-zip", type: "landing", title: "Daily Zip Game | AI Coach Portal", desc: "Play the daily AI puzzle challenge." },
    ];

    for (const s of staticDefs) {
      if (!existingUrls.has(s.url)) {
        newPages.push({
          page_url: s.url,
          page_type: s.type,
          meta_title: s.title,
          meta_description: s.desc,
          robots_directive: "index, follow",
          canonical_url: `https://www.aicoachportal.com${s.url}`,
          seo_score: 0,
          index_status: "not_indexed",
          is_auto_generated: true,
        });
      }
    }

    // Courses
    for (const c of (coursesRes.data || [])) {
      const url = `/course/${c.slug || c.id}`;
      if (!existingUrls.has(url)) {
        newPages.push({
          page_url: url,
          page_type: "course",
          meta_title: `${c.title} | AI Coach Portal`,
          meta_description: c.description?.slice(0, 155) || `Learn ${c.title} with expert coaching.`,
          h1_tag: c.title,
          primary_keyword: c.category?.toLowerCase(),
          robots_directive: c.is_published && c.approval_status === "approved" ? "index, follow" : "noindex, follow",
          canonical_url: `https://www.aicoachportal.com${url}`,
          seo_score: 0,
          index_status: "not_indexed",
          is_auto_generated: true,
        });
      }
    }

    // Blogs
    for (const b of (blogsRes.data || [])) {
      const url = `/ai-blogs/${b.slug || b.id}`;
      if (!existingUrls.has(url)) {
        newPages.push({
          page_url: url,
          page_type: "blog",
          meta_title: `${b.title} | AI Coach Portal`,
          meta_description: b.excerpt?.slice(0, 155) || "",
          h1_tag: b.title,
          primary_keyword: b.category?.toLowerCase(),
          robots_directive: b.is_published ? "index, follow" : "noindex, follow",
          canonical_url: `https://www.aicoachportal.com${url}`,
          seo_score: 0,
          index_status: "not_indexed",
          is_auto_generated: true,
        });
      }
    }

    // Coaches
    for (const c of (coachesRes.data || []).filter((c: any) => c.full_name)) {
      const slug = c.full_name?.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
      const url = `/coach-profile/${slug}`;
      if (!existingUrls.has(url)) {
        newPages.push({
          page_url: url,
          page_type: "coach",
          meta_title: `${c.full_name} – AI Coach | AI Coach Portal`,
          meta_description: c.bio?.slice(0, 155) || `Learn from ${c.full_name}, expert AI coach.`,
          h1_tag: c.full_name,
          robots_directive: "index, follow",
          canonical_url: `https://www.aicoachportal.com${url}`,
          seo_score: 0,
          index_status: "not_indexed",
          is_auto_generated: true,
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

  // Calculate SEO scores
  const calculateScore = (p: SEOPageRow): number => {
    let score = 0;
    if (p.meta_title && p.meta_title.length > 10 && p.meta_title.length <= 60) score += 20;
    else if (p.meta_title) score += 10;
    if (p.meta_description && p.meta_description.length > 50 && p.meta_description.length <= 160) score += 20;
    else if (p.meta_description) score += 10;
    if (p.h1_tag) score += 15;
    if (p.primary_keyword) {
      score += 10;
      if (p.meta_title?.toLowerCase().includes(p.primary_keyword.toLowerCase())) score += 5;
      if (p.h1_tag?.toLowerCase().includes(p.primary_keyword.toLowerCase())) score += 5;
    }
    if (p.canonical_url) score += 10;
    if (p.schema_markup) score += 15;
    return Math.min(score, 100);
  };

  const filtered = pages.filter(p => {
    if (filterType !== "all" && p.page_type !== filterType) return false;
    if (filterStatus !== "all" && p.index_status !== filterStatus) return false;
    if (search && !p.page_url.toLowerCase().includes(search.toLowerCase()) && !p.meta_title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selectedPages);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedPages(next);
  };

  const toggleAll = () => {
    if (selectedPages.size === filtered.length) {
      setSelectedPages(new Set());
    } else {
      setSelectedPages(new Set(filtered.map(p => p.id)));
    }
  };

  const handleRequestIndex = (url: string) => {
    toast({ title: "Indexing Requested", description: `Submit ${url} via Google Search Console for indexing.` });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  if (editingPage) {
    return (
      <SEOEditorPanel
        page={editingPage}
        onClose={() => { setEditingPage(null); loadPages(); }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={syncPages} disabled={syncing} variant="outline" size="sm">
          {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Sync Pages
        </Button>
        {selectedPages.size > 0 && (
          <span className="text-sm text-muted-foreground">{selectedPages.size} selected</span>
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
            <SelectItem value="static">Static</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="indexed">Indexed</SelectItem>
            <SelectItem value="not_indexed">Not Indexed</SelectItem>
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
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
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
                          <p className="text-sm font-medium text-foreground truncate max-w-[220px]">{page.page_url}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs capitalize">{page.page_type}</Badge>
                        </TableCell>
                        <TableCell>
                          {page.index_status === "indexed"
                            ? <CheckCircle className="h-4 w-4 text-green-500" />
                            : <XCircle className="h-4 w-4 text-red-500" />
                          }
                        </TableCell>
                        <TableCell>
                          <p className="text-xs text-muted-foreground truncate max-w-[180px]">{page.meta_title || "—"}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs text-muted-foreground truncate max-w-[120px]">{page.primary_keyword || "—"}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`text-sm font-bold ${getScoreColor(score)}`}>{score}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setEditingPage(page)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => window.open(`https://www.aicoachportal.com${page.page_url}`, "_blank")}>
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleRequestIndex(page.page_url)}>
                              <RefreshCw className="h-3 w-3" />
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
