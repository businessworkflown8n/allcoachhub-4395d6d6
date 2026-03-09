import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format } from "date-fns";
import { Mail, Send, Upload, Users, FileText, Plus, Pencil, Trash2, Eye, Clock, LayoutTemplate, Search, Download } from "lucide-react";

type Campaign = {
  id: string;
  subject: string;
  sender_name: string;
  sender_email: string;
  content: string;
  cta_text: string | null;
  cta_link: string | null;
  audience_type: string;
  audience_filter: any;
  status: string;
  template_name: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  total_recipients: number;
  total_sent: number;
  created_at: string;
};

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  content: string;
  cta_text: string | null;
  cta_link: string | null;
  category: string;
};

type Contact = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  country: string | null;
  user_type: string | null;
  source: string;
  is_unsubscribed: boolean;
  created_at: string;
};

const AUDIENCE_TYPES = [
  { value: "all", label: "All Users (Platform + Uploaded)" },
  { value: "learners", label: "Learners Only" },
  { value: "coaches", label: "Coaches Only" },
  { value: "uploaded", label: "Uploaded Contacts Only" },
];

const CTA_OPTIONS = [
  { text: "Join AI Course", link: "/courses" },
  { text: "Watch Webinar", link: "/webinars" },
  { text: "Visit AI Coach Portal", link: "/" },
];

const emptyForm = {
  subject: "",
  sender_name: "AI Coach Portal",
  sender_email: "hello@aicoachportal.com",
  content: "",
  cta_text: "",
  cta_link: "/courses",
  audience_type: "all",
  scheduled_at: "",
};

const AdminEmailTools = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [campRes, tempRes, contRes] = await Promise.all([
      supabase.from("email_campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("email_templates").select("*").order("name"),
      supabase.from("email_contacts").select("*").order("created_at", { ascending: false }).limit(500),
    ]);
    if (campRes.data) setCampaigns(campRes.data as unknown as Campaign[]);
    if (tempRes.data) setTemplates(tempRes.data as unknown as EmailTemplate[]);
    if (contRes.data) setContacts(contRes.data as unknown as Contact[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // CSV Upload
  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      toast.error("Only CSV files are supported");
      return;
    }

    setUploadingCsv(true);
    const text = await file.text();
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      toast.error("CSV file is empty");
      setUploadingCsv(false);
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
    const emailIdx = headers.findIndex((h) => h.includes("email"));
    const nameIdx = headers.findIndex((h) => h.includes("name") && !h.includes("sender"));
    const phoneIdx = headers.findIndex((h) => h.includes("phone") || h.includes("mobile"));
    const countryIdx = headers.findIndex((h) => h.includes("country"));
    const typeIdx = headers.findIndex((h) => h.includes("type") || h.includes("role"));

    if (emailIdx === -1) {
      toast.error("CSV must have an 'email' column");
      setUploadingCsv(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let imported = 0;
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
      const email = cols[emailIdx]?.toLowerCase();
      if (!email || !emailRegex.test(email)) { skipped++; continue; }

      const record: any = {
        email,
        name: nameIdx >= 0 ? cols[nameIdx] || null : null,
        phone: phoneIdx >= 0 ? cols[phoneIdx] || null : null,
        country: countryIdx >= 0 ? cols[countryIdx] || null : null,
        user_type: typeIdx >= 0 ? cols[typeIdx] || null : null,
        source: "upload",
      };

      const { error } = await supabase.from("email_contacts" as any).upsert(record as any, { onConflict: "email" });
      if (!error) imported++;
      else skipped++;
    }

    toast.success(`Imported ${imported} contacts, skipped ${skipped}`);
    setUploadingCsv(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    fetchAll();
  };

  // Campaign CRUD
  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: Campaign) => {
    setEditing(c.id);
    setForm({
      subject: c.subject,
      sender_name: c.sender_name,
      sender_email: c.sender_email,
      content: c.content,
      cta_text: c.cta_text || "",
      cta_link: c.cta_link || "/courses",
      audience_type: c.audience_type,
      scheduled_at: c.scheduled_at?.slice(0, 16) || "",
    });
    setDialogOpen(true);
  };

  const loadTemplate = (t: EmailTemplate) => {
    setForm({
      ...form,
      subject: t.subject,
      content: t.content,
      cta_text: t.cta_text || "",
      cta_link: t.cta_link || "/courses",
    });
    toast.success(`Template "${t.name}" loaded`);
  };

  const saveCampaign = async (status: string) => {
    if (!form.subject.trim() || !form.content.trim()) {
      toast.error("Subject and content are required");
      return;
    }

    const payload: any = {
      subject: form.subject.trim(),
      sender_name: form.sender_name,
      sender_email: form.sender_email,
      content: form.content,
      cta_text: form.cta_text || null,
      cta_link: form.cta_link || null,
      audience_type: form.audience_type,
      status,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    if (editing) {
      const { error } = await supabase.from("email_campaigns").update(payload).eq("id", editing);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Campaign updated");
    } else {
      const { error } = await supabase.from("email_campaigns").insert(payload);
      if (error) { toast.error("Failed to create"); return; }
      toast.success(status === "draft" ? "Draft saved" : "Campaign created");
    }
    setDialogOpen(false);
    fetchAll();
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm("Delete this campaign?")) return;
    await supabase.from("email_campaigns").delete().eq("id", id);
    toast.success("Campaign deleted");
    fetchAll();
  };

  // Get recipients based on audience type
  const getRecipients = async (audienceType: string): Promise<{ email: string; name?: string }[]> => {
    const recipients: { email: string; name?: string }[] = [];

    if (audienceType === "all" || audienceType === "learners" || audienceType === "coaches") {
      // Get platform users
      const roleFilter = audienceType === "learners" ? "learner" : audienceType === "coaches" ? "coach" : undefined;

      if (roleFilter) {
        const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", roleFilter);
        if (roles) {
          const userIds = roles.map((r: any) => r.user_id);
          const { data: profiles } = await supabase.from("profiles").select("email, full_name").in("user_id", userIds);
          if (profiles) {
            profiles.forEach((p: any) => {
              if (p.email) recipients.push({ email: p.email, name: p.full_name || undefined });
            });
          }
        }
      } else {
        const { data: profiles } = await supabase.from("profiles").select("email, full_name");
        if (profiles) {
          profiles.forEach((p: any) => {
            if (p.email) recipients.push({ email: p.email, name: p.full_name || undefined });
          });
        }
      }

      // Also include uploaded contacts for "all"
      if (audienceType === "all") {
        const { data: uploaded } = await supabase.from("email_contacts" as any).select("email, name").eq("is_unsubscribed", false);
        if (uploaded) {
          (uploaded as any[]).forEach((c) => {
            if (c.email && !recipients.find((r) => r.email === c.email)) {
              recipients.push({ email: c.email, name: c.name || undefined });
            }
          });
        }
      }
    } else if (audienceType === "uploaded") {
      const { data: uploaded } = await supabase.from("email_contacts" as any).select("email, name").eq("is_unsubscribed", false);
      if (uploaded) {
        (uploaded as any[]).forEach((c) => {
          if (c.email) recipients.push({ email: c.email, name: c.name || undefined });
        });
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    return recipients.filter((r) => {
      if (seen.has(r.email)) return false;
      seen.add(r.email);
      return true;
    });
  };

  // Send campaign
  const sendCampaign = async (campaign: Campaign) => {
    if (!confirm(`Send "${campaign.subject}" to ${campaign.audience_type} audience? This cannot be undone.`)) return;

    setSending(true);
    try {
      const recipients = await getRecipients(campaign.audience_type);
      if (recipients.length === 0) {
        toast.error("No recipients found for this audience");
        setSending(false);
        return;
      }

      toast.info(`Sending to ${recipients.length} recipients...`);

      const { data, error } = await supabase.functions.invoke("send-campaign-emails", {
        body: { campaignId: campaign.id, recipients },
      });

      if (error) {
        toast.error("Failed to send: " + error.message);
      } else {
        toast.success(`Sent ${data.sent}/${data.total} emails successfully`);
        if (data.errors?.length > 0) {
          console.warn("Email send errors:", data.errors);
        }
      }
    } catch (e: any) {
      toast.error("Error: " + e.message);
    }
    setSending(false);
    fetchAll();
  };

  // Preview
  const showPreview = (campaign: Campaign) => {
    const ctaHtml = campaign.cta_text
      ? `<div style="text-align:center;margin:24px 0"><a href="https://www.aicoachportal.com${campaign.cta_link || "/courses"}" style="background-color:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">${campaign.cta_text}</a></div>`
      : "";
    const html = `<div style="max-width:600px;margin:0 auto;padding:32px 24px;font-family:Arial,sans-serif"><div style="text-align:center;margin-bottom:24px"><h2 style="color:#1a1a2e">AI Coach Portal</h2></div><div style="color:#333;font-size:16px;line-height:1.6;white-space:pre-wrap">${campaign.content.replace(/\{Name\}/g, "John").replace(/\{Email\}/g, "john@example.com")}</div>${ctaHtml}<hr style="border:none;border-top:1px solid #eee;margin:32px 0"><div style="text-align:center;font-size:12px;color:#999"><p>© ${new Date().getFullYear()} AI Coach Portal. All rights reserved.</p><p><a href="#" style="color:#999">Unsubscribe</a></p></div></div>`;
    setPreviewHtml(html);
    setPreviewOpen(true);
  };

  const totalSent = campaigns.reduce((a, c) => a + (c.total_sent || 0), 0);
  const totalDrafts = campaigns.filter((c) => c.status === "draft").length;
  const totalContacts = contacts.length;
  const activeContacts = contacts.filter((c) => !c.is_unsubscribed).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Mail className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{campaigns.length}</p>
                <p className="text-sm text-muted-foreground">Total Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Send className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{totalSent}</p>
                <p className="text-sm text-muted-foreground">Emails Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{activeContacts}</p>
                <p className="text-sm text-muted-foreground">Active Contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{totalDrafts}</p>
                <p className="text-sm text-muted-foreground">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({totalContacts})</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* CAMPAIGNS TAB */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreate}><Plus className="h-4 w-4" /> Create Campaign</Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : campaigns.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No campaigns yet</TableCell></TableRow>
                  ) : (
                    campaigns.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <p className="font-medium text-foreground line-clamp-1 max-w-[250px]">{c.subject}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{c.audience_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={c.status === "sent" ? "default" : c.status === "draft" ? "outline" : "secondary"}>
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.total_sent}/{c.total_recipients}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(c.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => showPreview(c)} title="Preview">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {c.status !== "sent" && (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => openEdit(c)} title="Edit">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => sendCampaign(c)} disabled={sending} title="Send Now">
                                  <Send className="h-4 w-4 text-green-500" />
                                </Button>
                              </>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => deleteCampaign(c.id)} title="Delete">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONTACTS TAB */}
        <TabsContent value="contacts" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {activeContacts} active contacts, {contacts.filter((c) => c.is_unsubscribed).length} unsubscribed
            </p>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="hidden"
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingCsv}>
                <Upload className="h-4 w-4" /> {uploadingCsv ? "Uploading..." : "Upload CSV"}
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No contacts uploaded yet</TableCell></TableRow>
                  ) : (
                    contacts.slice(0, 100).map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="text-foreground">{c.name || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{c.email}</TableCell>
                        <TableCell><Badge variant="secondary">{c.user_type || "—"}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{c.country || "—"}</TableCell>
                        <TableCell><Badge variant="outline">{c.source}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={c.is_unsubscribed ? "destructive" : "default"}>
                            {c.is_unsubscribed ? "Unsubscribed" : "Active"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Upload CSV Database</p>
            <p className="text-xs text-muted-foreground mt-1">CSV should include columns: Name, Email, Phone, Country, User Type</p>
            <Button variant="outline" className="mt-3" onClick={() => fileInputRef.current?.click()} disabled={uploadingCsv}>
              Select CSV File
            </Button>
          </div>
        </TabsContent>

        {/* TEMPLATES TAB */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <Card key={t.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => { openCreate(); loadTemplate(t); }}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <LayoutTemplate className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">{t.name}</CardTitle>
                  </div>
                  <CardDescription className="line-clamp-1">{t.subject}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">{t.content}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant="secondary">{t.category}</Badge>
                    <Button variant="ghost" size="sm">Use Template</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Campaign Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Campaign" : "Create Email Campaign"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            {/* Quick template loader */}
            {!editing && templates.length > 0 && (
              <div className="space-y-2">
                <Label>Load Template</Label>
                <Select onValueChange={(v) => {
                  const t = templates.find((t) => t.id === v);
                  if (t) loadTemplate(t);
                }}>
                  <SelectTrigger><SelectValue placeholder="Choose a template..." /></SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Email Subject *</Label>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Your email subject line" />
              </div>
              <div className="space-y-2">
                <Label>Audience</Label>
                <Select value={form.audience_type} onValueChange={(v) => setForm({ ...form, audience_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_TYPES.map((a) => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Sender Name</Label>
                <Input value={form.sender_name} onChange={(e) => setForm({ ...form, sender_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Sender Email</Label>
                <Input value={form.sender_email} onChange={(e) => setForm({ ...form, sender_email: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email Content * <span className="text-xs text-muted-foreground">(Use {"{Name}"} and {"{Email}"} for personalization)</span></Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder={"Hello {Name},\n\nYour email content here..."}
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            {/* CTA */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <Label className="text-base font-semibold">CTA Button (Optional)</Label>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm">Button Text</Label>
                  <Select value={form.cta_text || "none"} onValueChange={(v) => {
                    if (v === "none") {
                      setForm({ ...form, cta_text: "", cta_link: "" });
                    } else {
                      const opt = CTA_OPTIONS.find((o) => o.text === v);
                      setForm({ ...form, cta_text: v, cta_link: opt?.link || form.cta_link });
                    }
                  }}>
                    <SelectTrigger><SelectValue placeholder="No CTA" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No CTA</SelectItem>
                      {CTA_OPTIONS.map((o) => (
                        <SelectItem key={o.text} value={o.text}>{o.text}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Button Link</Label>
                  <Input value={form.cta_link} onChange={(e) => setForm({ ...form, cta_link: e.target.value })} placeholder="/courses" />
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-2">
              <Label>Schedule (leave empty to send immediately)</Label>
              <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button variant="secondary" onClick={() => saveCampaign("draft")}>
                <FileText className="h-4 w-4" /> Save Draft
              </Button>
              <Button onClick={() => saveCampaign("ready")}>
                {form.scheduled_at ? <><Clock className="h-4 w-4" /> Schedule</> : <><Send className="h-4 w-4" /> Save & Ready to Send</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          <div className="border border-border rounded-lg overflow-hidden bg-white">
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEmailTools;
