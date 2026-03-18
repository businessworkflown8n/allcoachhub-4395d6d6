import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Download, Users, FileText, TrendingUp, Copy, Link2, Eye, Calendar, Search, X } from "lucide-react";
import { format } from "date-fns";

type MaterialRow = {
  id: string;
  title: string;
  slug: string | null;
  category: string;
  download_count: number;
  copy_link_clicks: number;
  created_at: string;
};

type DownloadRecord = {
  id: string;
  material_id: string;
  user_id: string | null;
  email: string | null;
  source: string;
  created_at: string;
};

type MaterialLink = {
  id: string;
  material_id: string;
  token: string;
  is_active: boolean;
  expiry_date: string | null;
  click_count: number;
  download_count: number;
  created_at: string;
};

type ProfileInfo = {
  user_id: string;
  full_name: string | null;
  email: string | null;
};

type RoleInfo = {
  user_id: string;
  role: string;
};

const AdminMaterialInsights = () => {
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [links, setLinks] = useState<MaterialLink[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileInfo>>({});
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [detailMaterial, setDetailMaterial] = useState<MaterialRow | null>(null);
  const [linkModalMaterial, setLinkModalMaterial] = useState<MaterialRow | null>(null);
  const [newExpiry, setNewExpiry] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [matRes, dlRes, linkRes] = await Promise.all([
      supabase.from("materials").select("id, title, slug, category, download_count, copy_link_clicks, created_at").order("created_at", { ascending: false }),
      supabase.from("material_downloads").select("*").order("created_at", { ascending: false }),
      supabase.from("material_links").select("*").order("created_at", { ascending: false }),
    ]);
    if (matRes.data) setMaterials(matRes.data as MaterialRow[]);
    if (dlRes.data) {
      setDownloads(dlRes.data as DownloadRecord[]);
      // Fetch profiles for user_ids
      const userIds = [...new Set(dlRes.data.filter((d: any) => d.user_id).map((d: any) => d.user_id))];
      if (userIds.length > 0) {
        const [profRes, roleRes] = await Promise.all([
          supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds),
          supabase.from("user_roles").select("user_id, role").in("user_id", userIds),
        ]);
        if (profRes.data) {
          const map: Record<string, ProfileInfo> = {};
          profRes.data.forEach((p: any) => { map[p.user_id] = p; });
          setProfiles(map);
        }
        if (roleRes.data) {
          const map: Record<string, string> = {};
          roleRes.data.forEach((r: any) => { map[r.user_id] = r.role; });
          setRoles(map);
        }
      }
    }
    if (linkRes.data) setLinks(linkRes.data as MaterialLink[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Summary metrics
  const totalMaterials = materials.length;
  const totalDownloads = downloads.length;
  const uniqueUsers = new Set(downloads.filter(d => d.user_id).map(d => d.user_id)).size;
  const topDownloaded = materials.reduce((best, m) => (!best || m.download_count > best.download_count) ? m : best, null as MaterialRow | null);

  // Filtered materials table
  const filtered = materials.filter(m => {
    if (searchQuery && !m.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Downloads for a specific material, filtered by date
  const getDownloadsForMaterial = (materialId: string) => {
    return downloads.filter(d => {
      if (d.material_id !== materialId) return false;
      if (dateFrom && d.created_at < dateFrom) return false;
      if (dateTo && d.created_at < dateTo) return false;
      return true;
    });
  };

  const getUniqueDownloads = (materialId: string) => {
    const mDl = downloads.filter(d => d.material_id === materialId);
    return new Set(mDl.filter(d => d.user_id).map(d => d.user_id)).size;
  };

  const getLastActivity = (materialId: string) => {
    const mDl = downloads.filter(d => d.material_id === materialId);
    if (mDl.length === 0) return null;
    return mDl.reduce((latest, d) => d.created_at > latest ? d.created_at : latest, mDl[0].created_at);
  };

  const getLinksForMaterial = (materialId: string) => links.filter(l => l.material_id === materialId);

  // Generate share link
  const generateLink = async (materialId: string) => {
    const token = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    const { error } = await supabase.from("material_links").insert({
      material_id: materialId,
      token,
      is_active: true,
      expiry_date: newExpiry || null,
    });
    if (error) { toast.error("Failed to create link"); return; }
    toast.success("Share link created");
    setNewExpiry("");
    fetchAll();
  };

  const toggleLink = async (linkId: string, active: boolean) => {
    await supabase.from("material_links").update({ is_active: active }).eq("id", linkId);
    toast.success(active ? "Link enabled" : "Link disabled");
    fetchAll();
  };

  const copyShareLink = (token: string) => {
    const url = `${window.location.origin}/materials/shared/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Share link copied!");
  };

  // CSV Export
  const exportCSV = () => {
    const filteredDl = dateFrom || dateTo
      ? downloads.filter(d => {
          if (dateFrom && d.created_at < dateFrom) return false;
          if (dateTo && d.created_at > dateTo + "T23:59:59") return false;
          return true;
        })
      : downloads;

    const rows = filteredDl.map(d => {
      const mat = materials.find(m => m.id === d.material_id);
      const prof = d.user_id ? profiles[d.user_id] : null;
      const role = d.user_id ? roles[d.user_id] : null;
      return {
        "File Name": mat?.title || "",
        "User Name": prof?.full_name || "Guest",
        "Email": prof?.email || d.email || "",
        "Role": role || "Guest",
        "Download Date": format(new Date(d.created_at), "yyyy-MM-dd HH:mm"),
        "Source": d.source,
      };
    });

    const headers = Object.keys(rows[0] || {});
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => `"${(r as any)[h] || ""}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `material-downloads-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  // Detail modal downloads
  const detailDownloads = detailMaterial ? getDownloadsForMaterial(detailMaterial.id) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{totalMaterials}</p>
                <p className="text-sm text-muted-foreground">Total Materials</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Download className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{totalDownloads}</p>
                <p className="text-sm text-muted-foreground">Total Downloads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{uniqueUsers}</p>
                <p className="text-sm text-muted-foreground">Unique Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-foreground truncate max-w-[140px]" title={topDownloaded?.title}>
                  {topDownloaded?.title || "—"}
                </p>
                <p className="text-sm text-muted-foreground">Top Downloaded</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 flex-1 max-w-xs">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[150px]" placeholder="From" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[150px]" placeholder="To" />
        </div>
        <Button variant="outline" onClick={exportCSV} disabled={downloads.length === 0}>
          <Download className="h-4 w-4 mr-1.5" /> Export CSV
        </Button>
      </div>

      {/* Material Insights Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Total Downloads</TableHead>
                <TableHead>Unique Downloads</TableHead>
                <TableHead>Link Clicks</TableHead>
                <TableHead>Share Links</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No materials found</TableCell>
                </TableRow>
              ) : filtered.map((m) => {
                const mLinks = getLinksForMaterial(m.id);
                const lastAct = getLastActivity(m.id);
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <p className="font-medium text-foreground line-clamp-1 max-w-[200px]">{m.title}</p>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{m.category}</Badge></TableCell>
                    <TableCell className="text-foreground">{m.download_count}</TableCell>
                    <TableCell className="text-foreground">{getUniqueDownloads(m.id)}</TableCell>
                    <TableCell className="text-foreground">{m.copy_link_clicks}</TableCell>
                    <TableCell>
                      <Badge variant={mLinks.length > 0 ? "default" : "outline"}>
                        {mLinks.filter(l => l.is_active).length} active
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lastAct ? format(new Date(lastAct), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setDetailMaterial(m)}>
                          <Eye className="h-4 w-4 mr-1" /> Details
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setLinkModalMaterial(m); setNewExpiry(""); }}>
                          <Link2 className="h-4 w-4 mr-1" /> Links
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => {
                          if (m.slug) {
                            navigator.clipboard.writeText(`${window.location.origin}/materials/${m.slug}`);
                            toast.success("Link copied!");
                          }
                        }}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Download Details Modal */}
      <Dialog open={!!detailMaterial} onOpenChange={() => setDetailMaterial(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Download Details — {detailMaterial?.title}</DialogTitle>
          </DialogHeader>
          {detailDownloads.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No downloads recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Download Date</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailDownloads.map((d) => {
                  const prof = d.user_id ? profiles[d.user_id] : null;
                  const role = d.user_id ? roles[d.user_id] : null;
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="text-foreground">{prof?.full_name || "Guest"}</TableCell>
                      <TableCell className="text-muted-foreground">{prof?.email || d.email || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{role || "guest"}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(d.created_at), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{d.source.replace("_", " ")}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* Share Links Modal */}
      <Dialog open={!!linkModalMaterial} onOpenChange={() => setLinkModalMaterial(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Share Links — {linkModalMaterial?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Generate new link */}
            <div className="flex items-end gap-3 rounded-lg border border-border p-4">
              <div className="flex-1 space-y-1">
                <Label className="text-sm">Expiry Date (optional)</Label>
                <Input type="datetime-local" value={newExpiry} onChange={(e) => setNewExpiry(e.target.value)} />
              </div>
              <Button onClick={() => linkModalMaterial && generateLink(linkModalMaterial.id)}>
                <Link2 className="h-4 w-4 mr-1.5" /> Generate Link
              </Button>
            </div>

            {/* Existing links */}
            {linkModalMaterial && getLinksForMaterial(linkModalMaterial.id).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No share links yet.</p>
            ) : linkModalMaterial && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Downloads</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getLinksForMaterial(linkModalMaterial.id).map((link) => (
                    <TableRow key={link.id}>
                      <TableCell className="font-mono text-xs text-foreground">{link.token}</TableCell>
                      <TableCell>
                        <Badge variant={link.is_active ? "default" : "outline"}>
                          {link.is_active ? "Active" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground">{link.click_count}</TableCell>
                      <TableCell className="text-foreground">{link.download_count}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {link.expiry_date ? format(new Date(link.expiry_date), "MMM d, yyyy") : "Never"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => copyShareLink(link.token)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Switch
                            checked={link.is_active}
                            onCheckedChange={(v) => toggleLink(link.id, v)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMaterialInsights;

