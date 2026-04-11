import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, Eye, Download, Search, Loader2, Globe, Users, FileText, Filter } from "lucide-react";
import { getDefaults } from "@/lib/landingPageDefaults";

const CATEGORIES = ["Career", "Coding", "Wellness", "Business", "AI", "Marketing", "Finance", "Design", "Data Science", "Leadership"];

interface LandingPage {
  id: string;
  category: string;
  slug: string;
  status: string;
  headline: string;
  subheadline: string;
  benefits: any;
  how_it_works: any;
  trust_points: any;
  hero_image_url: string | null;
  theme_color: string;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  is_published: boolean;
}

interface Lead {
  id: string;
  landing_page_id: string;
  name: string;
  email: string;
  mobile: string;
  years_of_expertise: number | null;
  city: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

const AdminLandingPages = () => {
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPage, setEditingPage] = useState<LandingPage | null>(null);
  const [tab, setTab] = useState("pages");

  // Editor state
  const [form, setForm] = useState({
    category: "",
    headline: "",
    subheadline: "",
    benefits: [] as string[],
    how_it_works: [] as { step: string; description: string }[],
    trust_points: [] as string[],
    hero_image_url: "",
    theme_color: "#84cc16",
    meta_title: "",
    meta_description: "",
    status: "draft",
  });

  // Lead filters
  const [leadCategoryFilter, setLeadCategoryFilter] = useState("all");
  const [leadCityFilter, setLeadCityFilter] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState("all");
  const [leadSearch, setLeadSearch] = useState("");

  const fetchPages = async () => {
    const { data } = await supabase
      .from("landing_pages")
      .select("*")
      .not("category", "is", null)
      .order("created_at", { ascending: false });
    setPages((data as any[]) || []);
  };

  const fetchLeads = async () => {
    const { data } = await supabase
      .from("landing_page_leads")
      .select("*")
      .order("created_at", { ascending: false });
    setLeads((data as Lead[]) || []);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchPages(), fetchLeads()]);
      setLoading(false);
    };
    load();
  }, []);

  const handleCategorySelect = (cat: string) => {
    const defaults = getDefaults(cat);
    setForm((f) => ({
      ...f,
      category: cat,
      headline: f.headline || defaults.headline,
      subheadline: f.subheadline || defaults.subheadline,
      benefits: f.benefits.length ? f.benefits : defaults.benefits,
      how_it_works: f.how_it_works.length ? f.how_it_works : defaults.how_it_works,
      trust_points: f.trust_points.length ? f.trust_points : defaults.trust_points,
      meta_title: f.meta_title || `${cat} Coaching | AI Coach Portal`,
      meta_description: f.meta_description || defaults.subheadline,
    }));
  };

  const openCreate = () => {
    setEditingPage(null);
    setForm({
      category: "", headline: "", subheadline: "",
      benefits: [], how_it_works: [], trust_points: [],
      hero_image_url: "", theme_color: "#84cc16",
      meta_title: "", meta_description: "", status: "draft",
    });
    setShowEditor(true);
  };

  const openEdit = (page: LandingPage) => {
    setEditingPage(page);
    setForm({
      category: page.category || "",
      headline: page.headline || "",
      subheadline: page.subheadline || "",
      benefits: Array.isArray(page.benefits) ? page.benefits : [],
      how_it_works: Array.isArray(page.how_it_works) ? page.how_it_works : [],
      trust_points: Array.isArray(page.trust_points) ? page.trust_points : [],
      hero_image_url: page.hero_image_url || "",
      theme_color: page.theme_color || "#84cc16",
      meta_title: page.meta_title || "",
      meta_description: page.meta_description || "",
      status: page.status || (page.is_published ? "published" : "draft"),
    });
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!form.category || !form.headline) {
      toast({ title: "Category and headline are required", variant: "destructive" });
      return;
    }
    const payload = {
      category: form.category,
      headline: form.headline,
      subheadline: form.subheadline,
      benefits: form.benefits,
      how_it_works: form.how_it_works,
      trust_points: form.trust_points,
      hero_image_url: form.hero_image_url || null,
      theme_color: form.theme_color,
      meta_title: form.meta_title,
      meta_description: form.meta_description,
      status: form.status,
      is_published: form.status === "published",
      title: form.headline,
      content: { benefits: form.benefits, how_it_works: form.how_it_works, trust_points: form.trust_points },
    };

    if (editingPage) {
      const { error } = await supabase.from("landing_pages").update(payload).eq("id", editingPage.id);
      if (error) { toast({ title: "Update failed", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Landing page updated" });
    } else {
      const slug = form.category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
      const { error } = await supabase.from("landing_pages").insert({ ...payload, slug });
      if (error) { toast({ title: "Creation failed", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Landing page created" });
    }
    setShowEditor(false);
    fetchPages();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this landing page?")) return;
    await supabase.from("landing_pages").delete().eq("id", id);
    toast({ title: "Deleted" });
    fetchPages();
  };

  const handleLeadStatus = async (leadId: string, status: string) => {
    await supabase.from("landing_page_leads").update({ status }).eq("id", leadId);
    toast({ title: `Lead ${status}` });
    fetchLeads();
  };

  const exportLeads = () => {
    const filtered = getFilteredLeads();
    const csv = [
      ["Name", "Email", "Mobile", "Experience (yrs)", "City", "Status", "Date"].join(","),
      ...filtered.map((l) =>
        [l.name, l.email, l.mobile, l.years_of_expertise || "", l.city || "", l.status, format(new Date(l.created_at), "yyyy-MM-dd")].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `landing-page-leads-${Date.now()}.csv`;
    a.click();
  };

  const getFilteredLeads = () => {
    return leads.filter((l) => {
      const page = pages.find((p) => p.id === l.landing_page_id);
      if (leadCategoryFilter !== "all" && page?.category !== leadCategoryFilter) return false;
      if (leadStatusFilter !== "all" && l.status !== leadStatusFilter) return false;
      if (leadCityFilter && !l.city?.toLowerCase().includes(leadCityFilter.toLowerCase())) return false;
      if (leadSearch) {
        const q = leadSearch.toLowerCase();
        return l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.mobile.includes(q);
      }
      return true;
    });
  };

  const filteredLeads = getFilteredLeads();

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" /> Landing Page Builder
        </h2>
        <Button onClick={openCreate} size="sm"><Plus className="h-4 w-4 mr-1" /> Create Page</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pages" className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Pages ({pages.length})</TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Leads ({leads.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="space-y-4">
          {pages.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">No landing pages yet. Create your first one!</CardContent></Card>
          ) : (
            <div className="rounded-lg border border-border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Headline</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Leads</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((p) => {
                    const pageLeads = leads.filter((l) => l.landing_page_id === p.id).length;
                    return (
                      <TableRow key={p.id}>
                        <TableCell><Badge variant="secondary">{p.category}</Badge></TableCell>
                        <TableCell className="font-medium text-foreground max-w-[200px] truncate">{p.headline}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">/lp/{p.slug}</TableCell>
                        <TableCell>
                          <Badge variant={p.status === "published" || p.is_published ? "default" : "outline"}>
                            {p.status === "published" || p.is_published ? "Published" : p.status || "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{pageLeads}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{format(new Date(p.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => window.open(`/lp/${p.slug}`, "_blank")}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="leads" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={leadSearch} onChange={(e) => setLeadSearch(e.target.value)} placeholder="Search name, email..." className="pl-9 w-[220px]" />
            </div>
            <Select value={leadCategoryFilter} onValueChange={setLeadCategoryFilter}>
              <SelectTrigger className="w-[160px]"><Filter className="h-3.5 w-3.5 mr-1" /><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={leadStatusFilter} onValueChange={setLeadStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Input value={leadCityFilter} onChange={(e) => setLeadCityFilter(e.target.value)} placeholder="Filter by city" className="w-[150px]" />
            <Button variant="outline" size="sm" onClick={exportLeads}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
          </div>

          {filteredLeads.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">No leads found.</CardContent></Card>
          ) : (
            <div className="rounded-lg border border-border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((l) => {
                    const page = pages.find((p) => p.id === l.landing_page_id);
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium text-foreground">{l.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{l.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{l.mobile}</TableCell>
                        <TableCell>{l.years_of_expertise ? `${l.years_of_expertise} yrs` : "—"}</TableCell>
                        <TableCell>{l.city || "—"}</TableCell>
                        <TableCell><Badge variant="secondary">{page?.category || "—"}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={l.status === "approved" ? "default" : l.status === "rejected" ? "destructive" : "outline"}>
                            {l.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{format(new Date(l.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell className="text-right space-x-1">
                          {l.status === "new" && (
                            <>
                              <Button size="sm" variant="default" onClick={() => handleLeadStatus(l.id, "approved")}>Approve</Button>
                              <Button size="sm" variant="destructive" onClick={() => handleLeadStatus(l.id, "rejected")}>Reject</Button>
                            </>
                          )}
                          {l.status !== "new" && l.status !== "contacted" && (
                            <Button size="sm" variant="outline" onClick={() => handleLeadStatus(l.id, "contacted")}>Mark Contacted</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPage ? "Edit Landing Page" : "Create Landing Page"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Category</label>
              <Select value={form.category} onValueChange={(v) => { setForm((f) => ({ ...f, category: v })); handleCategorySelect(v); }}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Headline</label>
              <Input value={form.headline} onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Subheadline</label>
              <Textarea value={form.subheadline} onChange={(e) => setForm((f) => ({ ...f, subheadline: e.target.value }))} rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Benefits (one per line)</label>
              <Textarea
                value={form.benefits.join("\n")}
                onChange={(e) => setForm((f) => ({ ...f, benefits: e.target.value.split("\n").filter(Boolean) }))}
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">How It Works (step::description, one per line)</label>
              <Textarea
                value={form.how_it_works.map((h) => `${h.step}::${h.description}`).join("\n")}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    how_it_works: e.target.value.split("\n").filter(Boolean).map((l) => {
                      const [step, ...desc] = l.split("::");
                      return { step: step.trim(), description: (desc.join("::") || "").trim() };
                    }),
                  }))
                }
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Trust Points (one per line)</label>
              <Textarea
                value={(form.trust_points || []).join("\n")}
                onChange={(e) => setForm((f) => ({ ...f, trust_points: e.target.value.split("\n").filter(Boolean) }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Theme Color</label>
                <Input type="color" value={form.theme_color} onChange={(e) => setForm((f) => ({ ...f, theme_color: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Status</label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Meta Title</label>
              <Input value={form.meta_title} onChange={(e) => setForm((f) => ({ ...f, meta_title: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Meta Description</label>
              <Textarea value={form.meta_description} onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))} rows={2} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowEditor(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editingPage ? "Update" : "Create"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLandingPages;
