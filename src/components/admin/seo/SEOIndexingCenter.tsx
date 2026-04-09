import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, ExternalLink, RefreshCw, Globe, FileText, AlertTriangle, Loader2, Clock, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SEOIndexingCenter = () => {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("seo_page_metadata")
        .select("id, page_url, page_type, index_status, robots_directive, last_crawled_at, crawl_errors, canonical_url, indexed_date, indexing_submitted_at, sitemap_included")
        .order("page_url");
      setPages(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const indexedCount = pages.filter(p => p.index_status === "indexed").length;
  const pendingCount = pages.filter(p => ["pending", "submitted"].includes(p.index_status)).length;
  const notIndexedCount = pages.filter(p => p.index_status === "not_indexed").length;
  const failedCount = pages.filter(p => p.index_status === "failed").length;
  const noindexCount = pages.filter(p => p.robots_directive?.includes("noindex")).length;
  const withErrorsCount = pages.filter(p => p.crawl_errors).length;

  const filtered = pages.filter(p => {
    if (filterStatus === "all") return true;
    return p.index_status === filterStatus;
  });

  const handleMarkIndexed = async (pageId: string) => {
    const now = new Date().toISOString();
    await supabase.from("seo_page_metadata").update({ index_status: "indexed", indexed_date: now, last_crawled_at: now }).eq("id", pageId);
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, index_status: "indexed", indexed_date: now, last_crawled_at: now } : p));
    toast({ title: "Marked as Indexed" });
  };

  const handleSubmitIndex = async (pageId: string, url: string) => {
    const now = new Date().toISOString();
    await supabase.from("seo_page_metadata").update({ index_status: "submitted", indexing_submitted_at: now }).eq("id", pageId);
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, index_status: "submitted", indexing_submitted_at: now } : p));
    toast({ title: "Indexing Submitted", description: `${url} — submit via Google Search Console for faster indexing.` });
  };

  const handleBulkSubmit = async () => {
    if (selectedIds.size === 0) return;
    const now = new Date().toISOString();
    await supabase.from("seo_page_metadata")
      .update({ index_status: "submitted", indexing_submitted_at: now })
      .in("id", Array.from(selectedIds));
    setPages(prev => prev.map(p => selectedIds.has(p.id) ? { ...p, index_status: "submitted", indexing_submitted_at: now } : p));
    toast({ title: "Bulk Submit", description: `${selectedIds.size} pages submitted for indexing.` });
    setSelectedIds(new Set());
  };

  const handleBulkMarkIndexed = async () => {
    if (selectedIds.size === 0) return;
    const now = new Date().toISOString();
    await supabase.from("seo_page_metadata")
      .update({ index_status: "indexed", indexed_date: now, last_crawled_at: now })
      .in("id", Array.from(selectedIds));
    setPages(prev => prev.map(p => selectedIds.has(p.id) ? { ...p, index_status: "indexed", indexed_date: now, last_crawled_at: now } : p));
    toast({ title: "Bulk Indexed", description: `${selectedIds.size} pages marked as indexed.` });
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };
  const toggleAll = () => {
    setSelectedIds(selectedIds.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id)));
  };

  const getStatusIcon = (status: string) => {
    if (status === "indexed") return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === "submitted") return <Send className="h-4 w-4 text-blue-500" />;
    if (status === "pending") return <Clock className="h-4 w-4 text-yellow-500" />;
    if (status === "failed") return <AlertTriangle className="h-4 w-4 text-destructive" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      indexed: "bg-green-500/15 text-green-500 border-green-500/30",
      submitted: "bg-blue-500/15 text-blue-500 border-blue-500/30",
      pending: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
      failed: "bg-red-500/15 text-red-400 border-red-500/30",
      not_indexed: "bg-muted text-muted-foreground border-border",
    };
    return <Badge className={`text-xs capitalize ${variants[status] || variants.not_indexed}`}>{status.replace("_", " ")}</Badge>;
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total Pages", value: pages.length, icon: Globe, color: "text-primary" },
          { label: "Indexed", value: indexedCount, icon: CheckCircle, color: "text-green-500" },
          { label: "Pending", value: pendingCount, icon: Clock, color: "text-yellow-500" },
          { label: "Not Indexed", value: notIndexedCount, icon: XCircle, color: "text-red-500" },
          { label: "Failed", value: failedCount, icon: AlertTriangle, color: "text-destructive" },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="flex items-center gap-3 pt-6">
              <kpi.icon className={`h-7 w-7 ${kpi.color}`} />
              <div>
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={() => window.open("https://www.aicoachportal.com/sitemap.xml", "_blank")}>
            <ExternalLink className="mr-2 h-4 w-4" /> View Sitemap
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

      {/* Sitemap Info */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Sitemap Status</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Sitemap URL: /sitemap.xml</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-blue-500" />
            <span>Indexable pages included: {pages.filter(p => !p.robots_directive?.includes("noindex")).length}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <XCircle className="h-4 w-4 text-muted-foreground" />
            <span>Noindex pages excluded: {noindexCount}</span>
          </div>
        </CardContent>
      </Card>

      {/* Crawl Errors */}
      {withErrorsCount > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg text-destructive">Crawl Errors ({withErrorsCount})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page URL</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.filter(p => p.crawl_errors).map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm">{p.page_url}</TableCell>
                    <TableCell className="text-sm text-destructive">{p.crawl_errors}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Main Indexing Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg">Index Management</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="indexed">Indexed</SelectItem>
                  <SelectItem value="not_indexed">Not Indexed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              {selectedIds.size > 0 && (
                <>
                  <Button size="sm" variant="outline" onClick={handleBulkSubmit}>
                    <Send className="mr-1 h-3 w-3" /> Submit ({selectedIds.size})
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleBulkMarkIndexed}>
                    <CheckCircle className="mr-1 h-3 w-3" /> Mark Indexed ({selectedIds.size})
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={selectedIds.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead>Page URL</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Indexed</TableHead>
                  <TableHead>Robots</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 100).map(p => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} />
                    </TableCell>
                    <TableCell className="text-sm truncate max-w-[220px]">{p.page_url}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs capitalize">{p.page_type}</Badge></TableCell>
                    <TableCell>{getStatusBadge(p.index_status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.indexing_submitted_at ? new Date(p.indexing_submitted_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.indexed_date ? new Date(p.indexed_date).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-xs">{p.robots_directive}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {p.index_status !== "indexed" && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => handleSubmitIndex(p.id, p.page_url)}>
                              <Send className="h-3 w-3 mr-1" /> Submit
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleMarkIndexed(p.id)}>
                              <CheckCircle className="h-3 w-3 mr-1" /> Indexed
                            </Button>
                          </>
                        )}
                      </div>
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

export default SEOIndexingCenter;
