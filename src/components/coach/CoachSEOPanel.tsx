import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Search, RefreshCw, AlertCircle, CheckCircle2, Clock, XCircle,
  TrendingUp, FileText, Globe, Link2, Send, Plug,
} from "lucide-react";

interface SeoPage {
  id: string;
  page_url: string;
  page_type: string;
  meta_title: string | null;
  meta_description: string | null;
  index_status: string;
  seo_score: number | null;
  indexing_submitted_at: string | null;
  last_crawled_at: string | null;
  updated_at: string;
}

interface SeoAlert {
  id: string;
  page_url: string;
  alert_type: string;
  severity: string;
  message: string;
  created_at: string;
  is_resolved: boolean;
}

const statusBadge = (status: string) => {
  const map: Record<string, { label: string; cls: string; Icon: typeof Clock }> = {
    indexed: { label: "Indexed", cls: "bg-green-500/10 text-green-500 border-green-500/30", Icon: CheckCircle2 },
    submitted: { label: "Submitted", cls: "bg-blue-500/10 text-blue-500 border-blue-500/30", Icon: Send },
    queued: { label: "Queued", cls: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30", Icon: Clock },
    pending: { label: "Pending", cls: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30", Icon: Clock },
    failed: { label: "Failed", cls: "bg-destructive/10 text-destructive border-destructive/30", Icon: XCircle },
    not_indexed: { label: "Not indexed", cls: "bg-muted text-muted-foreground border-border", Icon: AlertCircle },
  };
  const v = map[status] || map.not_indexed;
  return (
    <Badge variant="outline" className={`${v.cls} gap-1`}>
      <v.Icon className="h-3 w-3" />
      {v.label}
    </Badge>
  );
};

const CoachSEOPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pages, setPages] = useState<SeoPage[]>([]);
  const [alerts, setAlerts] = useState<SeoAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [reindexingUrl, setReindexingUrl] = useState<string | null>(null);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [filter, setFilter] = useState("");
  const [gscConnected, setGscConnected] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: pagesData }, { data: alertsData }, { data: gsc }] = await Promise.all([
      supabase.from("seo_page_metadata").select("*").eq("coach_id", user.id).order("updated_at", { ascending: false }),
      supabase.from("seo_alerts").select("*").eq("coach_id", user.id).eq("is_resolved", false).order("created_at", { ascending: false }).limit(20),
      supabase.from("gsc_connections").select("id").eq("user_id", user.id).maybeSingle(),
    ]);
    setPages((pagesData as SeoPage[]) || []);
    setAlerts((alertsData as SeoAlert[]) || []);
    setGscConnected(!!gsc);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const reindex = async (url: string) => {
    setReindexingUrl(url);
    const { data, error } = await supabase.functions.invoke("submit-indexing", {
      body: { urls: [url], action: "URL_UPDATED" },
    });
    setReindexingUrl(null);
    const submitted = Number((data as any)?.submitted ?? 0);
    const fallbackSubmitted = Number((data as any)?.fallback_submitted ?? 0);
    if (error || (!(data as any)?.ok && submitted === 0)) {
      toast({ title: "Reindex failed", description: error?.message || (data as any)?.error || "Could not queue this page for indexing.", variant: "destructive" });
    } else {
      toast({
        title: fallbackSubmitted > 0 ? "Queued for indexing" : "Submitted to Google",
        description: fallbackSubmitted > 0 ? "Direct Google API is unavailable, so this page was queued through sitemap submission." : url,
      });
      load();
    }
  };

  const reindexAll = async () => {
    if (pages.length === 0) return;
    setBulkRunning(true);
    const urls = pages.map((p) => p.page_url).slice(0, 100);
    const { data, error } = await supabase.functions.invoke("submit-indexing", {
      body: { urls, action: "URL_UPDATED" },
    });
    setBulkRunning(false);
    const submitted = Number((data as any)?.submitted ?? 0);
    const fallbackSubmitted = Number((data as any)?.fallback_submitted ?? 0);
    if (error || (!(data as any)?.ok && submitted === 0)) {
      toast({ title: "Bulk indexing failed", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: fallbackSubmitted > 0 ? `Queued ${submitted} URLs` : `Submitted ${submitted} URLs`,
        description: fallbackSubmitted > 0 ? "Pages were queued through sitemap submission while direct Google API access is unavailable." : "Google will crawl these soon.",
      });
      load();
    }
  };

  const connectGSC = async () => {
    const redirectUri = `${window.location.origin}/coach/seo?gsc_callback=1`;
    const { data, error } = await supabase.functions.invoke("gsc-oauth", {
      body: { action: "authorize_url", redirect_uri: redirectUri },
    });
    if (error || !(data as any)?.url) {
      toast({ title: "Could not start Google connect", description: error?.message, variant: "destructive" });
      return;
    }
    window.location.href = (data as any).url;
  };

  // Handle GSC OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code && params.get("gsc_callback")) {
      const redirect_uri = `${window.location.origin}/coach/seo?gsc_callback=1`;
      const site_url = `https://www.aicoachportal.com/`;
      supabase.functions.invoke("gsc-oauth", {
        body: { action: "exchange_code", code, redirect_uri, site_url },
      }).then(({ error }) => {
        if (error) toast({ title: "GSC connect failed", description: error.message, variant: "destructive" });
        else toast({ title: "Search Console connected" });
        window.history.replaceState({}, "", "/coach/seo");
        load();
      });
    }
  }, [toast, load]);

  const filtered = pages.filter((p) =>
    p.page_url.toLowerCase().includes(filter.toLowerCase()) ||
    p.meta_title?.toLowerCase().includes(filter.toLowerCase())
  );

  const stats = {
    total: pages.length,
    indexed: pages.filter((p) => p.index_status === "indexed").length,
    pending: pages.filter((p) => ["pending", "queued", "submitted"].includes(p.index_status)).length,
    failed: pages.filter((p) => p.index_status === "failed").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-foreground">SEO &amp; Indexing</h2>
          <p className="text-sm text-muted-foreground">Auto-indexing status for all your pages — courses, website, landing pages.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button onClick={reindexAll} disabled={bulkRunning || pages.length === 0}>
            <Send className="h-4 w-4 mr-2" /> {bulkRunning ? "Submitting..." : "Index All Pages"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><FileText className="h-4 w-4" /> Total Pages</div>
          <div className="text-2xl font-bold mt-1">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-green-500 text-xs"><CheckCircle2 className="h-4 w-4" /> Indexed</div>
          <div className="text-2xl font-bold mt-1">{stats.indexed}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-yellow-500 text-xs"><Clock className="h-4 w-4" /> Pending</div>
          <div className="text-2xl font-bold mt-1">{stats.pending}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-destructive text-xs"><XCircle className="h-4 w-4" /> Failed</div>
          <div className="text-2xl font-bold mt-1">{stats.failed}</div>
        </Card>
      </div>

      {/* Search Console connect */}
      <Card className="p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-foreground">Google Search Console</div>
            <div className="text-xs text-muted-foreground">
              {gscConnected ? "Connected — clicks &amp; impressions sync automatically." : "Connect to see clicks, impressions and indexing coverage."}
            </div>
          </div>
        </div>
        <Button variant={gscConnected ? "outline" : "default"} onClick={connectGSC}>
          <Plug className="h-4 w-4 mr-2" /> {gscConnected ? "Reconnect" : "Connect GSC"}
        </Button>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="p-4 border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <h3 className="font-semibold text-foreground">SEO Alerts ({alerts.length})</h3>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm border-b border-border/30 pb-2 last:border-0">
                <div>
                  <div className="font-medium text-foreground">{a.message}</div>
                  <div className="text-xs text-muted-foreground">{a.page_url}</div>
                </div>
                <Badge variant="outline" className="text-xs">{a.severity}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Page table */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by URL or title..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Loading SEO pages...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {pages.length === 0
              ? "No pages tracked yet. Publish a course or website and it will appear here automatically."
              : "No pages match your filter."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>SEO Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs max-w-[280px] truncate">
                      <a href={p.page_url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                        <Link2 className="h-3 w-3" />{p.page_url}
                      </a>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{p.page_type}</Badge></TableCell>
                    <TableCell>
                      <span className={`font-semibold ${(p.seo_score ?? 0) >= 80 ? "text-green-500" : (p.seo_score ?? 0) >= 50 ? "text-yellow-500" : "text-destructive"}`}>
                        {p.seo_score ?? 0}/100
                      </span>
                    </TableCell>
                    <TableCell>{statusBadge(p.index_status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(p.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm" variant="outline"
                        onClick={() => reindex(p.page_url)}
                        disabled={reindexingUrl === p.page_url}
                      >
                        <RefreshCw className={`h-3 w-3 mr-1 ${reindexingUrl === p.page_url ? "animate-spin" : ""}`} />
                        Reindex
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Card className="p-4 bg-secondary/30">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="h-4 w-4" />
          Sitemap auto-updates at <a href="/sitemap.xml" className="text-primary hover:underline mx-1">/sitemap.xml</a>
          and pings Google &amp; Bing on every publish.
        </div>
      </Card>
    </div>
  );
};

export default CoachSEOPanel;
