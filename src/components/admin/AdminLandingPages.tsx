import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Plus, Pencil, Trash2, Eye, Download, Search, Loader2, Globe, Users,
  FileText, Filter, GripVertical, Phone, MessageCircle, BarChart3,
  MousePointerClick, ArrowUpDown, Mail
} from "lucide-react";
import { getDefaults } from "@/lib/landingPageDefaults";

const CATEGORIES = ["Career", "Coding", "Wellness", "Business", "AI", "Marketing", "Finance", "Design", "Data Science", "Leadership"];

const DEFAULT_FEATURES = [
  { icon: "DollarSign", title: "Pay After Admissions", description: "No upfront fees. Pay only when students enroll.", is_active: true, sort_order: 0 },
  { icon: "Users", title: "Get Students at Low Cost", description: "80% lower acquisition cost than traditional ads.", is_active: true, sort_order: 1 },
  { icon: "TrendingUp", title: "Zero Upfront Fees", description: "Start coaching with zero investment.", is_active: true, sort_order: 2 },
  { icon: "LayoutDashboard", title: "Customised Coach Dashboard", description: "Full analytics, CRM, and course management tools.", is_active: true, sort_order: 3 },
  { icon: "Megaphone", title: "Advertisement Support", description: "We run ads to bring students directly to you.", is_active: true, sort_order: 4 },
];

interface Feature {
  id?: string;
  landing_page_id?: string;
  icon: string;
  title: string;
  description: string;
  is_active: boolean;
  sort_order: number;
}

const AdminLandingPages = () => {
  const [pages, setPages] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [ctaClicks, setCtaClicks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [tab, setTab] = useState("pages");
  const [editorTab, setEditorTab] = useState("basic");
  const [features, setFeatures] = useState<Feature[]>([]);
  const [showFeatureEditor, setShowFeatureEditor] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [editingFeatureIdx, setEditingFeatureIdx] = useState<number>(-1);

  const [form, setForm] = useState({
    category: "", headline: "", subheadline: "",
    benefits: [] as string[], how_it_works: [] as { step: string; description: string }[],
    trust_points: [] as string[], badge_text: "🔥 Limited Slots Available",
    cta_text: "Start Getting Students", cta_type: "form", cta_link: "",
    phone_number: "", whatsapp_number: "", whatsapp_message: "Hi, I am interested in coaching on your platform.",
    email_address: "",
    floating_cta_enabled: true, floating_cta_position: "bottom-right",
    floating_cta_type: "whatsapp", floating_cta_animation: "pulse",
    meta_title: "", meta_description: "", status: "draft",
    hero_image_url: "", theme_color: "#84cc16",
  });

  const [leadCategoryFilter, setLeadCategoryFilter] = useState("all");
  const [leadCityFilter, setLeadCityFilter] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState("all");
  const [leadSearch, setLeadSearch] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [pRes, lRes, cRes] = await Promise.all([
      supabase.from("landing_pages").select("*").not("category", "is", null).order("created_at", { ascending: false }),
      supabase.from("landing_page_leads").select("*").order("created_at", { ascending: false }),
      supabase.from("landing_page_cta_clicks").select("*"),
    ]);
    setPages((pRes.data as any[]) || []);
    setLeads((lRes.data as any[]) || []);
    setCtaClicks((cRes.data as any[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCategorySelect = (cat: string) => {
    const defaults = getDefaults(cat);
    setForm((f) => ({
      ...f, category: cat,
      headline: f.headline || defaults.headline,
      subheadline: f.subheadline || defaults.subheadline,
      benefits: f.benefits.length ? f.benefits : defaults.benefits,
      how_it_works: f.how_it_works.length ? f.how_it_works : defaults.how_it_works,
      trust_points: f.trust_points.length ? f.trust_points : defaults.trust_points,
      meta_title: f.meta_title || `${cat} Coaching | AI Coach Portal`,
      meta_description: f.meta_description || defaults.subheadline,
      badge_text: `🔥 ${cat} Coaching — Limited Slots`,
    }));
    if (features.length === 0) setFeatures(DEFAULT_FEATURES.map((f, i) => ({ ...f, sort_order: i })));
  };

  const openCreate = () => {
    setEditingPage(null);
    setForm({
      category: "", headline: "", subheadline: "", benefits: [], how_it_works: [],
      trust_points: [], badge_text: "🔥 Limited Slots Available",
      cta_text: "Start Getting Students", cta_type: "form", cta_link: "",
      phone_number: "", whatsapp_number: "", whatsapp_message: "Hi, I am interested in coaching on your platform.",
      email_address: "",
      floating_cta_enabled: true, floating_cta_position: "bottom-right",
      floating_cta_type: "whatsapp", floating_cta_animation: "pulse",
      meta_title: "", meta_description: "", status: "draft",
      hero_image_url: "", theme_color: "#84cc16",
    });
    setFeatures([]);
    setEditorTab("basic");
    setShowEditor(true);
  };

  const openEdit = async (page: any) => {
    setEditingPage(page);
    setForm({
      category: page.category || "", headline: page.headline || "", subheadline: page.subheadline || "",
      benefits: Array.isArray(page.benefits) ? page.benefits : [],
      how_it_works: Array.isArray(page.how_it_works) ? page.how_it_works : [],
      trust_points: Array.isArray(page.trust_points) ? page.trust_points : [],
      badge_text: page.badge_text || "🔥 Limited Slots Available",
      cta_text: page.cta_text || "Start Getting Students",
      cta_type: page.cta_type || "form", cta_link: page.cta_link || "",
      phone_number: page.phone_number || "", whatsapp_number: page.whatsapp_number || "",
      whatsapp_message: page.whatsapp_message || "", email_address: page.email_address || "",
      floating_cta_enabled: page.floating_cta_enabled ?? true,
      floating_cta_position: page.floating_cta_position || "bottom-right",
      floating_cta_type: page.floating_cta_type || "whatsapp",
      floating_cta_animation: page.floating_cta_animation || "pulse",
      meta_title: page.meta_title || "", meta_description: page.meta_description || "",
      status: page.status || "draft", hero_image_url: page.hero_image_url || "",
      theme_color: page.theme_color || "#84cc16",
    });
    // Fetch features
    const { data } = await supabase.from("landing_page_features").select("*").eq("landing_page_id", page.id).order("sort_order");
    setFeatures((data as Feature[]) || []);
    setEditorTab("basic");
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!form.category || !form.headline) {
      toast({ title: "Category and headline are required", variant: "destructive" });
      return;
    }
    const payload: any = {
      category: form.category, headline: form.headline, subheadline: form.subheadline,
      benefits: form.benefits, how_it_works: form.how_it_works, trust_points: form.trust_points,
      badge_text: form.badge_text, cta_text: form.cta_text || "Start Getting Students",
      cta_type: form.cta_type, cta_link: form.cta_link || null,
      phone_number: form.phone_number || null, whatsapp_number: form.whatsapp_number || null,
      whatsapp_message: form.whatsapp_message || null, email_address: form.email_address || null,
      floating_cta_enabled: form.floating_cta_enabled,
      floating_cta_position: form.floating_cta_position,
      floating_cta_type: form.floating_cta_type,
      floating_cta_animation: form.floating_cta_animation,
      hero_image_url: form.hero_image_url || null, theme_color: form.theme_color,
      meta_title: form.meta_title, meta_description: form.meta_description,
      status: form.status, is_published: form.status === "published",
      title: form.headline,
      content: { benefits: form.benefits, how_it_works: form.how_it_works, trust_points: form.trust_points },
    };

    let pageId = editingPage?.id;
    if (editingPage) {
      const { error } = await supabase.from("landing_pages").update(payload).eq("id", editingPage.id);
      if (error) { toast({ title: "Update failed", description: error.message, variant: "destructive" }); return; }
    } else {
      const slug = form.category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
      const { data, error } = await supabase.from("landing_pages").insert({ ...payload, slug }).select("id").single();
      if (error) { toast({ title: "Creation failed", description: error.message, variant: "destructive" }); return; }
      pageId = data.id;
    }

    // Save features
    if (pageId) {
      await supabase.from("landing_page_features").delete().eq("landing_page_id", pageId);
      if (features.length > 0) {
        await supabase.from("landing_page_features").insert(
          features.map((f, i) => ({ landing_page_id: pageId, icon: f.icon, title: f.title, description: f.description || "", is_active: f.is_active, sort_order: i }))
        );
      }
    }

    toast({ title: editingPage ? "Landing page updated" : "Landing page created" });
    setShowEditor(false);
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this landing page and all its features?")) return;
    await supabase.from("landing_pages").delete().eq("id", id);
    toast({ title: "Deleted" });
    fetchAll();
  };

  const handleLeadStatus = async (leadId: string, status: string) => {
    await supabase.from("landing_page_leads").update({ status }).eq("id", leadId);
    toast({ title: `Lead ${status}` });
    fetchAll();
  };

  const exportLeads = () => {
    const filtered = getFilteredLeads();
    const csv = [
      ["Name", "Email", "Mobile", "Experience", "City", "Status", "Source", "Date"].join(","),
      ...filtered.map((l: any) =>
        [l.name, l.email, l.mobile, l.years_of_expertise || "", l.city || "", l.status, l.source || "", format(new Date(l.created_at), "yyyy-MM-dd")].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `leads-${Date.now()}.csv`;
    a.click();
  };

  const getFilteredLeads = () => {
    return leads.filter((l: any) => {
      const page = pages.find((p: any) => p.id === l.landing_page_id);
      if (leadCategoryFilter !== "all" && page?.category !== leadCategoryFilter) return false;
      if (leadStatusFilter !== "all" && l.status !== leadStatusFilter) return false;
      if (leadCityFilter && !l.city?.toLowerCase().includes(leadCityFilter.toLowerCase())) return false;
      if (leadSearch) {
        const q = leadSearch.toLowerCase();
        return l.name?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q) || l.mobile?.includes(q);
      }
      return true;
    });
  };

  const addFeature = () => {
    setEditingFeature({ icon: "Star", title: "", description: "", is_active: true, sort_order: features.length });
    setEditingFeatureIdx(-1);
    setShowFeatureEditor(true);
  };

  const editFeature = (idx: number) => {
    setEditingFeature({ ...features[idx] });
    setEditingFeatureIdx(idx);
    setShowFeatureEditor(true);
  };

  const saveFeature = () => {
    if (!editingFeature?.title) { toast({ title: "Title required", variant: "destructive" }); return; }
    if (editingFeatureIdx >= 0) {
      setFeatures((f) => f.map((item, i) => i === editingFeatureIdx ? editingFeature! : item));
    } else {
      setFeatures((f) => [...f, editingFeature!]);
    }
    setShowFeatureEditor(false);
  };

  const deleteFeature = (idx: number) => {
    setFeatures((f) => f.filter((_, i) => i !== idx));
  };

  const moveFeature = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= features.length) return;
    setFeatures((f) => { const arr = [...f]; [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]; return arr; });
  };

  const filteredLeads = getFilteredLeads();

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  // Analytics
  const getPageAnalytics = (pageId: string) => {
    const pageLeads = leads.filter((l: any) => l.landing_page_id === pageId);
    const pageCta = ctaClicks.filter((c: any) => c.landing_page_id === pageId);
    return {
      leads: pageLeads.length,
      ctaClicks: pageCta.length,
      whatsappClicks: pageCta.filter((c: any) => c.cta_type === "whatsapp").length,
      callClicks: pageCta.filter((c: any) => c.cta_type === "call").length,
      formClicks: pageCta.filter((c: any) => c.cta_type === "form").length,
    };
  };

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
          <TabsTrigger value="analytics" className="flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5" /> Analytics</TabsTrigger>
        </TabsList>

        {/* PAGES TAB */}
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
                    <TableHead>CTA Clicks</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((p: any) => {
                    const analytics = getPageAnalytics(p.id);
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
                        <TableCell className="font-medium">{analytics.leads}</TableCell>
                        <TableCell className="font-medium">{analytics.ctaClicks}</TableCell>
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

        {/* LEADS TAB */}
        <TabsContent value="leads" className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={leadSearch} onChange={(e) => setLeadSearch(e.target.value)} placeholder="Search..." className="pl-9 w-[200px]" />
            </div>
            <Select value={leadCategoryFilter} onValueChange={setLeadCategoryFilter}>
              <SelectTrigger className="w-[150px]"><Filter className="h-3.5 w-3.5 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={leadStatusFilter} onValueChange={setLeadStatusFilter}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Input value={leadCityFilter} onChange={(e) => setLeadCityFilter(e.target.value)} placeholder="City" className="w-[120px]" />
            <Button variant="outline" size="sm" onClick={exportLeads}><Download className="h-4 w-4 mr-1" /> Export</Button>
          </div>
          {filteredLeads.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">No leads found.</CardContent></Card>
          ) : (
            <div className="rounded-lg border border-border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Mobile</TableHead>
                    <TableHead>Exp</TableHead><TableHead>City</TableHead><TableHead>Category</TableHead>
                    <TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((l: any) => {
                    const page = pages.find((p: any) => p.id === l.landing_page_id);
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium text-foreground">{l.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{l.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{l.mobile}</TableCell>
                        <TableCell>{l.years_of_expertise ? `${l.years_of_expertise}y` : "—"}</TableCell>
                        <TableCell>{l.city || "—"}</TableCell>
                        <TableCell><Badge variant="secondary">{page?.category || "—"}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={l.status === "approved" ? "default" : l.status === "rejected" ? "destructive" : "outline"}>{l.status}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{format(new Date(l.created_at), "MMM d")}</TableCell>
                        <TableCell className="text-right space-x-1">
                          {l.status === "new" && (
                            <>
                              <Button size="sm" variant="default" onClick={() => handleLeadStatus(l.id, "approved")}>Approve</Button>
                              <Button size="sm" variant="destructive" onClick={() => handleLeadStatus(l.id, "rejected")}>Reject</Button>
                            </>
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

        {/* ANALYTICS TAB */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pages.map((p: any) => {
              const a = getPageAnalytics(p.id);
              return (
                <Card key={p.id} className="border-border/40">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{p.category}</Badge>
                      <Badge variant={p.status === "published" ? "default" : "outline"}>{p.status}</Badge>
                    </div>
                    <h3 className="font-semibold text-foreground text-sm truncate">{p.headline}</h3>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-2 rounded-lg bg-muted/30 text-center">
                        <p className="text-lg font-bold text-foreground">{a.leads}</p>
                        <p className="text-xs text-muted-foreground">Leads</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/30 text-center">
                        <p className="text-lg font-bold text-foreground">{a.ctaClicks}</p>
                        <p className="text-xs text-muted-foreground">CTA Clicks</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/30 text-center">
                        <p className="text-lg font-bold text-foreground">{a.whatsappClicks}</p>
                        <p className="text-xs text-muted-foreground">WhatsApp</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/30 text-center">
                        <p className="text-lg font-bold text-foreground">{a.callClicks}</p>
                        <p className="text-xs text-muted-foreground">Calls</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {pages.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">No analytics data yet.</CardContent></Card>}
        </TabsContent>
      </Tabs>

      {/* MAIN EDITOR DIALOG */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPage ? "Edit Landing Page" : "Create Landing Page"}</DialogTitle>
          </DialogHeader>

          <Tabs value={editorTab} onValueChange={setEditorTab}>
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="hero">Hero & CTA</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="comms">Communication</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>

            {/* BASIC TAB */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Category *</label>
                  <Select value={form.category} onValueChange={(v) => { setForm((f) => ({ ...f, category: v })); handleCategorySelect(v); }}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Status</label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Headline *</label>
                <Input value={form.headline} onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Subheadline</label>
                <Textarea value={form.subheadline} onChange={(e) => setForm((f) => ({ ...f, subheadline: e.target.value }))} rows={2} />
              </div>
            </TabsContent>

            {/* HERO & CTA TAB */}
            <TabsContent value="hero" className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Badge Text</label>
                <Input value={form.badge_text} onChange={(e) => setForm((f) => ({ ...f, badge_text: e.target.value }))} placeholder="🔥 AI Coaching — Limited Slots" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">CTA Button Text</label>
                  <Input value={form.cta_text} onChange={(e) => setForm((f) => ({ ...f, cta_text: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">CTA Action</label>
                  <Select value={form.cta_type} onValueChange={(v) => setForm((f) => ({ ...f, cta_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="form">Open Form</SelectItem>
                      <SelectItem value="url">Redirect URL</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="call">Call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {form.cta_type === "url" && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">CTA Link URL</label>
                  <Input value={form.cta_link} onChange={(e) => setForm((f) => ({ ...f, cta_link: e.target.value }))} placeholder="https://..." />
                </div>
              )}
              <hr className="border-border/30" />
              <h4 className="text-sm font-semibold text-foreground">Floating CTA Button</h4>
              <div className="flex items-center gap-3">
                <Switch checked={form.floating_cta_enabled} onCheckedChange={(v) => setForm((f) => ({ ...f, floating_cta_enabled: v }))} />
                <span className="text-sm text-muted-foreground">Enable floating CTA</span>
              </div>
              {form.floating_cta_enabled && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Position</label>
                    <Select value={form.floating_cta_position} onValueChange={(v) => setForm((f) => ({ ...f, floating_cta_position: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
                    <Select value={form.floating_cta_type} onValueChange={(v) => setForm((f) => ({ ...f, floating_cta_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="call">Call Now</SelectItem>
                        <SelectItem value="form">Enroll Now</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Animation</label>
                    <Select value={form.floating_cta_animation} onValueChange={(v) => setForm((f) => ({ ...f, floating_cta_animation: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pulse">Pulse</SelectItem>
                        <SelectItem value="glow">Glow</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* FEATURES TAB */}
            <TabsContent value="features" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{features.length} feature cards</p>
                <Button size="sm" onClick={addFeature}><Plus className="h-4 w-4 mr-1" /> Add Feature</Button>
              </div>
              {features.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No features yet. Add some or select a category to load defaults.</p>
              ) : (
                <div className="space-y-2">
                  {features.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                      <div className="flex flex-col gap-0.5">
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveFeature(i, -1)} disabled={i === 0}><ArrowUpDown className="h-3 w-3" /></Button>
                      </div>
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{f.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{f.description}</p>
                      </div>
                      <Badge variant={f.is_active ? "default" : "outline"}>{f.is_active ? "Active" : "Inactive"}</Badge>
                      <Button variant="ghost" size="icon" onClick={() => editFeature(i)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteFeature(i)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* COMMUNICATION TAB */}
            <TabsContent value="comms" className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-2"><Phone className="h-4 w-4" /> Phone Number</label>
                <Input value={form.phone_number} onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))} placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-2"><MessageCircle className="h-4 w-4" /> WhatsApp Number</label>
                <Input value={form.whatsapp_number} onChange={(e) => setForm((f) => ({ ...f, whatsapp_number: e.target.value }))} placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">WhatsApp Pre-filled Message</label>
                <Textarea value={form.whatsapp_message} onChange={(e) => setForm((f) => ({ ...f, whatsapp_message: e.target.value }))} rows={2} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-2"><Mail className="h-4 w-4" /> Email Address</label>
                <Input value={form.email_address} onChange={(e) => setForm((f) => ({ ...f, email_address: e.target.value }))} placeholder="info@example.com" />
              </div>
            </TabsContent>

            {/* SEO TAB */}
            <TabsContent value="seo" className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Meta Title</label>
                <Input value={form.meta_title} onChange={(e) => setForm((f) => ({ ...f, meta_title: e.target.value }))} />
                <p className="text-xs text-muted-foreground mt-1">{form.meta_title.length}/70 chars</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Meta Description</label>
                <Textarea value={form.meta_description} onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))} rows={2} />
                <p className="text-xs text-muted-foreground mt-1">{form.meta_description.length}/160 chars</p>
              </div>
              <p className="text-xs text-muted-foreground">Slug, canonical URL, sitemap entry, and Google indexing are handled automatically on publish.</p>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/30">
            <Button variant="outline" onClick={() => setShowEditor(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingPage ? "Update" : "Create"} Landing Page</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* FEATURE EDITOR DIALOG */}
      <Dialog open={showFeatureEditor} onOpenChange={setShowFeatureEditor}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingFeatureIdx >= 0 ? "Edit Feature" : "Add Feature"}</DialogTitle></DialogHeader>
          {editingFeature && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Icon Name</label>
                <Input value={editingFeature.icon} onChange={(e) => setEditingFeature({ ...editingFeature, icon: e.target.value })} placeholder="e.g. DollarSign, Users, Star" />
                <p className="text-xs text-muted-foreground mt-1">Use Lucide icon names</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Title *</label>
                <Input value={editingFeature.title} onChange={(e) => setEditingFeature({ ...editingFeature, title: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
                <Textarea value={editingFeature.description} onChange={(e) => setEditingFeature({ ...editingFeature, description: e.target.value })} rows={2} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={editingFeature.is_active} onCheckedChange={(v) => setEditingFeature({ ...editingFeature, is_active: v })} />
                <span className="text-sm text-muted-foreground">Active</span>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowFeatureEditor(false)}>Cancel</Button>
                <Button onClick={saveFeature}>Save Feature</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLandingPages;
