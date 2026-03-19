import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle, XCircle, Loader2 } from "lucide-react";

const SEOKeywordManager = () => {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("seo_page_metadata")
        .select("id, page_url, page_type, meta_title, h1_tag, primary_keyword, secondary_keywords")
        .order("page_url");
      setPages(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = pages.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    return p.primary_keyword?.toLowerCase().includes(s) ||
      p.page_url.toLowerCase().includes(s) ||
      p.secondary_keywords?.some((k: string) => k.toLowerCase().includes(s));
  });

  // Aggregate keyword stats
  const keywordMap = new Map<string, { count: number; pages: string[] }>();
  for (const p of pages) {
    if (p.primary_keyword) {
      const kw = p.primary_keyword.toLowerCase();
      const entry = keywordMap.get(kw) || { count: 0, pages: [] };
      entry.count++;
      entry.pages.push(p.page_url);
      keywordMap.set(kw, entry);
    }
    for (const sk of (p.secondary_keywords || [])) {
      const kw = sk.toLowerCase();
      const entry = keywordMap.get(kw) || { count: 0, pages: [] };
      entry.count++;
      entry.pages.push(p.page_url);
      keywordMap.set(kw, entry);
    }
  }

  const topKeywords = Array.from(keywordMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Keywords */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Top Keywords</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {topKeywords.map(([kw, data]) => (
              <Badge key={kw} variant="secondary" className="text-xs">
                {kw} <span className="ml-1 opacity-60">({data.count})</span>
              </Badge>
            ))}
            {topKeywords.length === 0 && <p className="text-sm text-muted-foreground">No keywords found. Add keywords via the Pages tab.</p>}
          </div>
        </CardContent>
      </Card>

      {/* Keyword Placement Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Keyword Placement Analysis</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search keywords..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-48" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page URL</TableHead>
                  <TableHead>Primary Keyword</TableHead>
                  <TableHead className="text-center">In Title</TableHead>
                  <TableHead className="text-center">In H1</TableHead>
                  <TableHead className="text-center">In URL</TableHead>
                  <TableHead>Secondary Keywords</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 50).map(p => {
                  const kw = p.primary_keyword?.toLowerCase() || "";
                  const inTitle = kw && p.meta_title?.toLowerCase().includes(kw);
                  const inH1 = kw && p.h1_tag?.toLowerCase().includes(kw);
                  const inUrl = kw && p.page_url.toLowerCase().includes(kw.replace(/\s+/g, "-"));
                  return (
                    <TableRow key={p.id}>
                      <TableCell><p className="text-sm truncate max-w-[200px]">{p.page_url}</p></TableCell>
                      <TableCell><span className="text-sm">{p.primary_keyword || "—"}</span></TableCell>
                      <TableCell className="text-center">
                        {kw ? (inTitle ? <CheckCircle className="mx-auto h-4 w-4 text-green-500" /> : <XCircle className="mx-auto h-4 w-4 text-red-500" />) : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {kw ? (inH1 ? <CheckCircle className="mx-auto h-4 w-4 text-green-500" /> : <XCircle className="mx-auto h-4 w-4 text-red-500" />) : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {kw ? (inUrl ? <CheckCircle className="mx-auto h-4 w-4 text-green-500" /> : <XCircle className="mx-auto h-4 w-4 text-red-500" />) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(p.secondary_keywords || []).slice(0, 3).map((k: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">{k}</Badge>
                          ))}
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

export default SEOKeywordManager;
