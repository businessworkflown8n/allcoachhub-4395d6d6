import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Check, X, MessageSquare, Eye, Search, Globe, Loader2 } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-yellow-500/20 text-yellow-400",
  approved: "bg-green-500/20 text-green-400",
  rejected: "bg-destructive/20 text-destructive",
};

const AdminCoachWebsites = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [websites, setWebsites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [previewSite, setPreviewSite] = useState<any>(null);
  const [rejectModal, setRejectModal] = useState<any>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [profiles, setProfiles] = useState<Record<string, any>>({});

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase.from("coach_websites").select("*").order("updated_at", { ascending: false });
    setWebsites(data || []);

    if (data && data.length > 0) {
      const coachIds = [...new Set(data.map((w) => w.coach_id))];
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", coachIds);
      const map: Record<string, any> = {};
      profs?.forEach((p) => (map[p.user_id] = p));
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleApprove = async (id: string) => {
    await supabase.from("coach_websites").update({ status: "approved", is_live: true, admin_note: null, updated_at: new Date().toISOString() }).eq("id", id);
    toast({ title: "Website approved and is now live" });
    fetchAll();
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    await supabase.from("coach_websites").update({ status: "rejected", is_live: false, admin_note: rejectNote || "Rejected by admin", updated_at: new Date().toISOString() }).eq("id", rejectModal.id);
    toast({ title: "Website rejected" });
    setRejectModal(null);
    setRejectNote("");
    fetchAll();
  };

  const handleToggleLive = async (site: any) => {
    await supabase.from("coach_websites").update({ is_live: !site.is_live, updated_at: new Date().toISOString() }).eq("id", site.id);
    toast({ title: site.is_live ? "Website hidden" : "Website is now live" });
    fetchAll();
  };

  const filtered = websites.filter((w) => {
    if (statusFilter !== "all" && w.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const coachName = profiles[w.coach_id]?.full_name?.toLowerCase() || "";
      return w.institute_name.toLowerCase().includes(q) || w.slug.toLowerCase().includes(q) || coachName.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" /> Coach Websites
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-9 w-[200px]" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No coach websites found.</CardContent></Card>
      ) : (
        <div className="rounded-lg border border-border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coach</TableHead>
                <TableHead>Institute</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((site) => {
                const coach = profiles[site.coach_id];
                return (
                  <TableRow key={site.id}>
                    <TableCell>
                      <div className="text-sm font-medium text-foreground">{coach?.full_name || "Unknown"}</div>
                      <div className="text-xs text-muted-foreground">{coach?.email}</div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{site.institute_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">/coach-website/{site.slug}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={STATUS_COLORS[site.status]}>{site.status}</Badge>
                        {site.status === "approved" && (
                          <Badge variant={site.is_live ? "default" : "outline"} className="text-xs">
                            {site.is_live ? "Live" : "Hidden"}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(site.updated_at), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" title="Preview" onClick={() => setPreviewSite(site)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {site.status === "pending" && (
                          <>
                            <Button variant="ghost" size="icon" title="Approve" onClick={() => handleApprove(site.id)}>
                              <Check className="h-4 w-4 text-green-400" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Reject" onClick={() => { setRejectModal(site); setRejectNote(""); }}>
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                        {site.status === "approved" && (
                          <Button variant="ghost" size="sm" onClick={() => handleToggleLive(site)}>
                            {site.is_live ? "Hide" : "Show"}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewSite} onOpenChange={() => setPreviewSite(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Website Preview: {previewSite?.institute_name}</DialogTitle></DialogHeader>
          {previewSite && (
            <div className="space-y-4">
              {previewSite.banner_url && <img src={previewSite.banner_url} alt="Banner" className="w-full h-40 object-cover rounded-lg" />}
              <div className="flex items-center gap-3">
                {previewSite.logo_url && <img src={previewSite.logo_url} alt="Logo" className="h-16 w-16 rounded-md object-cover" />}
                <div>
                  <h3 className="text-lg font-bold text-foreground">{previewSite.institute_name}</h3>
                  {previewSite.tagline && <p className="text-sm text-muted-foreground">{previewSite.tagline}</p>}
                </div>
              </div>
              {previewSite.description && <p className="text-sm text-muted-foreground">{previewSite.description}</p>}
              {previewSite.about_text && (
                <div>
                  <h4 className="font-medium text-foreground mb-1">About</h4>
                  <p className="text-sm text-muted-foreground">{previewSite.about_text}</p>
                </div>
              )}
              {previewSite.video_url && (
                <div>
                  <h4 className="font-medium text-foreground mb-1">Video</h4>
                  <p className="text-xs text-muted-foreground">{previewSite.video_url}</p>
                </div>
              )}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Theme: {previewSite.theme_color}</p>
                <p>Sections: {[previewSite.show_about && "About", previewSite.show_courses && "Courses", previewSite.show_testimonials && "Testimonials", previewSite.show_contact && "Contact", previewSite.show_video && "Video"].filter(Boolean).join(", ") || "None"}</p>
              </div>
              <a href={`/coach-website/${previewSite.slug}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-1" /> Open Full Page</Button>
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectModal} onOpenChange={() => setRejectModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Website: {rejectModal?.institute_name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Reason for rejection or changes needed..." rows={4} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectModal(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject}><X className="h-4 w-4 mr-1" /> Reject</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCoachWebsites;
