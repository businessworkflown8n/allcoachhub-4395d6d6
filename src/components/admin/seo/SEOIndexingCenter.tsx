import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, ExternalLink, RefreshCw, Globe, FileText, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SEOIndexingCenter = () => {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("seo_page_metadata")
        .select("id, page_url, page_type, index_status, robots_directive, last_crawled_at, crawl_errors, canonical_url")
        .order("page_url");
      setPages(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const indexedCount = pages.filter(p => p.index_status === "indexed").length;
  const notIndexedCount = pages.filter(p => p.index_status === "not_indexed").length;
  const noindexCount = pages.filter(p => p.robots_directive?.includes("noindex")).length;
  const withErrorsCount = pages.filter(p => p.crawl_errors).length;

  const handleRequestIndex = async (pageId: string, url: string) => {
    await supabase.from("seo_page_metadata").update({ index_status: "not_indexed" }).eq("id", pageId);
    toast({ title: "Indexing Requested", description: `Submit ${url} via Google Search Console.` });
  };

  const handleMarkIndexed = async (pageId: string) => {
    await supabase.from("seo_page_metadata").update({ index_status: "indexed", last_crawled_at: new Date().toISOString() }).eq("id", pageId);
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, index_status: "indexed", last_crawled_at: new Date().toISOString() } : p));
    toast({ title: "Marked as Indexed" });
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Globe className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{pages.length}</p>
              <p className="text-xs text-muted-foreground">Total Pages</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{indexedCount}</p>
              <p className="text-xs text-muted-foreground">Indexed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <XCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{notIndexedCount}</p>
              <p className="text-xs text-muted-foreground">Not Indexed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{noindexCount}</p>
              <p className="text-xs text-muted-foreground">Noindex Pages</p>
            </div>
          </CardContent>
        </Card>
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

      {/* Pages with crawl issues */}
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

      {/* Not indexed pages */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Not Indexed Pages</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page URL</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Robots</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.filter(p => p.index_status === "not_indexed" && !p.robots_directive?.includes("noindex")).slice(0, 50).map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm truncate max-w-[250px]">{p.page_url}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs capitalize">{p.page_type}</Badge></TableCell>
                    <TableCell className="text-xs">{p.robots_directive}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleRequestIndex(p.id, p.page_url)}>
                          <RefreshCw className="h-3 w-3 mr-1" /> Request
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleMarkIndexed(p.id)}>
                          <CheckCircle className="h-3 w-3 mr-1" /> Mark Indexed
                        </Button>
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
