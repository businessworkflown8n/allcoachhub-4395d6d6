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
import { Mail, Send, Upload, Users, FileText, Plus, Pencil, Trash2, Eye, Clock, LayoutTemplate, MessageCircle, Phone, Code, Download, ShieldCheck, UserPlus } from "lucide-react";

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
  channel: string;
};

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  content: string;
  cta_text: string | null;
  cta_link: string | null;
  category: string;
  template_html: string | null;
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
  whatsapp_number: string | null;
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

const CHANNELS = [
  { value: "email", label: "Email", icon: Mail },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { value: "sms", label: "SMS", icon: Phone },
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
  channel: "email",
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
  const [channelFilter, setChannelFilter] = useState("all");
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({ name: "", subject: "", content: "", cta_text: "", cta_link: "", category: "general", template_html: "" });
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const htmlUploadRef = useRef<HTMLInputElement>(null);
  const templateHtmlRef = useRef<HTMLInputElement>(null);

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
    if (lines.length < 2) { toast.error("CSV file is empty"); setUploadingCsv(false); return; }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
    const emailIdx = headers.findIndex((h) => h.includes("email"));
    const nameIdx = headers.findIndex((h) => h.includes("name") && !h.includes("sender"));
    const phoneIdx = headers.findIndex((h) => h.includes("phone") || h.includes("mobile"));
    const countryIdx = headers.findIndex((h) => h.includes("country"));
    const typeIdx = headers.findIndex((h) => h.includes("type") || h.includes("role"));
    const whatsappIdx = headers.findIndex((h) => h.includes("whatsapp"));

    if (emailIdx === -1) { toast.error("CSV must have an 'email' column"); setUploadingCsv(false); return; }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let imported = 0, skipped = 0;

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
        whatsapp_number: whatsappIdx >= 0 ? cols[whatsappIdx] || (phoneIdx >= 0 ? cols[phoneIdx] || null : null) : (phoneIdx >= 0 ? cols[phoneIdx] || null : null),
        source: "upload",
      };

      const { error } = await supabase.from("email_contacts" as any).upsert(record as any, { onConflict: "email" });
      if (!error) imported++; else skipped++;
    }

    toast.success(`Imported ${imported} contacts, skipped ${skipped}`);
    setUploadingCsv(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    fetchAll();
  };

  // HTML file upload for email content
  const handleHtmlUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".html") && !file.name.endsWith(".htm")) {
      toast.error("Only HTML files are supported");
      return;
    }
    const html = await file.text();
    setForm({ ...form, content: html });
    toast.success("HTML template loaded into content");
    if (htmlUploadRef.current) htmlUploadRef.current.value = "";
  };

  // HTML file upload for template
  const handleTemplateHtmlUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".html") && !file.name.endsWith(".htm")) {
      toast.error("Only HTML files are supported");
      return;
    }
    const html = await file.text();
    setTemplateForm({ ...templateForm, template_html: html, content: html });
    toast.success("HTML template uploaded");
    if (templateHtmlRef.current) templateHtmlRef.current.value = "";
  };

  // Campaign CRUD
  const openCreate = (channel = "email") => {
    setEditing(null);
    setForm({ ...emptyForm, channel });
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
      channel: c.channel || "email",
    });
    setDialogOpen(true);
  };

  const loadTemplate = (t: EmailTemplate) => {
    setForm({
      ...form,
      subject: t.subject,
      content: t.template_html || t.content,
      cta_text: t.cta_text || "",
      cta_link: t.cta_link || "/courses",
    });
    toast.success(`Template "${t.name}" loaded`);
  };

  const saveCampaign = async (status: string) => {
    const isMsg = form.channel !== "email";
    if (isMsg && !form.content.trim()) { toast.error("Message content is required"); return; }
    if (!isMsg && (!form.subject.trim() || !form.content.trim())) { toast.error("Subject and content are required"); return; }

    const payload: any = {
      subject: form.subject.trim() || (isMsg ? `${form.channel.toUpperCase()} Campaign` : ""),
      sender_name: form.sender_name,
      sender_email: form.sender_email,
      content: form.content,
      cta_text: form.cta_text || null,
      cta_link: form.cta_link || null,
      audience_type: form.audience_type,
      status,
      channel: form.channel,
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

  // Get recipients
  const getRecipients = async (audienceType: string, channel: string): Promise<{ email: string; name?: string; phone?: string }[]> => {
    const recipients: { email: string; name?: string; phone?: string }[] = [];

    if (audienceType === "all" || audienceType === "learners" || audienceType === "coaches") {
      const roleFilter = audienceType === "learners" ? "learner" : audienceType === "coaches" ? "coach" : undefined;

      if (roleFilter) {
        const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", roleFilter);
        if (roles) {
          const userIds = roles.map((r: any) => r.user_id);
          const { data: profiles } = await supabase.from("profiles").select("email, full_name, whatsapp_number, contact_number").in("user_id", userIds);
          if (profiles) {
            profiles.forEach((p: any) => {
              if (p.email) recipients.push({ email: p.email, name: p.full_name || undefined, phone: p.whatsapp_number || p.contact_number || undefined });
            });
          }
        }
      } else {
        const { data: profiles } = await supabase.from("profiles").select("email, full_name, whatsapp_number, contact_number");
        if (profiles) {
          profiles.forEach((p: any) => {
            if (p.email) recipients.push({ email: p.email, name: p.full_name || undefined, phone: p.whatsapp_number || p.contact_number || undefined });
          });
        }
      }

      if (audienceType === "all") {
        const { data: uploaded } = await supabase.from("email_contacts" as any).select("email, name, whatsapp_number, phone").eq("is_unsubscribed", false);
        if (uploaded) {
          (uploaded as any[]).forEach((c) => {
            if (c.email && !recipients.find((r) => r.email === c.email)) {
              recipients.push({ email: c.email, name: c.name || undefined, phone: c.whatsapp_number || c.phone || undefined });
            }
          });
        }
      }
    } else if (audienceType === "uploaded") {
      const { data: uploaded } = await supabase.from("email_contacts" as any).select("email, name, whatsapp_number, phone").eq("is_unsubscribed", false);
      if (uploaded) {
        (uploaded as any[]).forEach((c) => {
          if (c.email) recipients.push({ email: c.email, name: c.name || undefined, phone: c.whatsapp_number || c.phone || undefined });
        });
      }
    }

    const seen = new Set<string>();
    return recipients.filter((r) => {
      const key = channel === "email" ? r.email : (r.phone || r.email);
      if (seen.has(key)) return false;
      seen.add(key);
      // For WhatsApp/SMS, filter out those without phone numbers
      if (channel !== "email" && !r.phone) return false;
      return true;
    });
  };

  // Send campaign
  const sendCampaign = async (campaign: Campaign) => {
    const ch = campaign.channel || "email";
    if (ch === "whatsapp") {
      toast.info("WhatsApp campaigns generate pre-filled links. Recipients will be shown for manual sending via WhatsApp Web/API.");
    }
    if (ch === "sms") {
      toast.info("SMS campaigns require an SMS gateway integration (e.g., Twilio). Currently generates message list for manual sending.");
    }

    if (!confirm(`Send "${campaign.subject}" via ${ch.toUpperCase()} to ${campaign.audience_type} audience?`)) return;

    setSending(true);
    try {
      const recipients = await getRecipients(campaign.audience_type, ch);
      if (recipients.length === 0) {
        toast.error(`No recipients with ${ch === "email" ? "emails" : "phone numbers"} found`);
        setSending(false);
        return;
      }

      if (ch === "email") {
        toast.info(`Sending to ${recipients.length} recipients...`);
        const { data, error } = await supabase.functions.invoke("send-campaign-emails", {
          body: { campaignId: campaign.id, recipients },
        });
        if (error) { toast.error("Failed: " + error.message); }
        else { toast.success(`Sent ${data.sent}/${data.total} emails`); }
      } else if (ch === "whatsapp") {
        // Generate WhatsApp links for each recipient
        const personalizedMsg = campaign.content.replace(/\{Name\}/g, "").trim();
        const encodedMsg = encodeURIComponent(personalizedMsg);
        const links = recipients.filter(r => r.phone).map(r => ({
          name: r.name || r.phone,
          phone: r.phone!.replace(/[^0-9+]/g, ""),
          link: `https://wa.me/${r.phone!.replace(/[^0-9]/g, "")}?text=${encodedMsg}`,
        }));

        // Update campaign status
        await supabase.from("email_campaigns").update({
          status: "sent",
          sent_at: new Date().toISOString(),
          total_recipients: links.length,
          total_sent: links.length,
          updated_at: new Date().toISOString(),
        }).eq("id", campaign.id);

        // Download links as CSV
        const csvContent = "Name,Phone,WhatsApp Link\n" + links.map(l => `"${l.name}","${l.phone}","${l.link}"`).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `whatsapp-campaign-${campaign.id.slice(0, 8)}.csv`; a.click();
        URL.revokeObjectURL(url);

        toast.success(`Generated ${links.length} WhatsApp links. CSV downloaded.`);
      } else if (ch === "sms") {
        const msgList = recipients.filter(r => r.phone).map(r => ({
          name: r.name || r.phone,
          phone: r.phone,
          message: campaign.content.replace(/\{Name\}/g, r.name || "").trim(),
        }));

        await supabase.from("email_campaigns").update({
          status: "sent",
          sent_at: new Date().toISOString(),
          total_recipients: msgList.length,
          total_sent: msgList.length,
          updated_at: new Date().toISOString(),
        }).eq("id", campaign.id);

        const csvContent = "Name,Phone,Message\n" + msgList.map(m => `"${m.name}","${m.phone}","${m.message?.replace(/"/g, '""')}"`).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `sms-campaign-${campaign.id.slice(0, 8)}.csv`; a.click();
        URL.revokeObjectURL(url);

        toast.success(`Generated ${msgList.length} SMS messages. CSV downloaded.`);
      }
    } catch (e: any) {
      toast.error("Error: " + e.message);
    }
    setSending(false);
    fetchAll();
  };

  // Preview
  const showPreview = (campaign: Campaign) => {
    const ch = campaign.channel || "email";
    if (ch !== "email") {
      const msg = campaign.content.replace(/\{Name\}/g, "John").replace(/\{Email\}/g, "john@example.com");
      const html = `<div style="max-width:400px;margin:0 auto;padding:24px;font-family:Arial,sans-serif"><div style="background:${ch === "whatsapp" ? "#dcf8c6" : "#e3f2fd"};border-radius:16px;padding:16px;margin-bottom:12px"><p style="font-size:14px;color:#333;margin:0;white-space:pre-wrap">${msg}</p></div>${campaign.cta_text ? `<div style="text-align:center;margin-top:16px"><span style="background:#6366f1;color:#fff;padding:8px 20px;border-radius:8px;font-size:14px;font-weight:600">${campaign.cta_text}</span></div>` : ""}<p style="text-align:center;font-size:11px;color:#999;margin-top:16px">${ch.toUpperCase()} Preview</p></div>`;
      setPreviewHtml(html);
    } else {
      const ctaHtml = campaign.cta_text
        ? `<div style="text-align:center;margin:24px 0"><a href="https://www.aicoachportal.com${campaign.cta_link || "/courses"}" style="background-color:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">${campaign.cta_text}</a></div>`
        : "";
      const html = `<div style="max-width:600px;margin:0 auto;padding:32px 24px;font-family:Arial,sans-serif"><div style="text-align:center;margin-bottom:24px"><h2 style="color:#1a1a2e">AI Coach Portal</h2></div><div style="color:#333;font-size:16px;line-height:1.6;white-space:pre-wrap">${campaign.content.replace(/\{Name\}/g, "John").replace(/\{Email\}/g, "john@example.com")}</div>${ctaHtml}<hr style="border:none;border-top:1px solid #eee;margin:32px 0"><div style="text-align:center;font-size:12px;color:#999"><p>© ${new Date().getFullYear()} AI Coach Portal</p><p><a href="#" style="color:#999">Unsubscribe</a></p></div></div>`;
      setPreviewHtml(html);
    }
    setPreviewOpen(true);
  };

  // Template CRUD
  const openTemplateCreate = () => {
    setEditingTemplate(null);
    setTemplateForm({ name: "", subject: "", content: "", cta_text: "", cta_link: "", category: "general", template_html: "" });
    setTemplateDialogOpen(true);
  };

  const openTemplateEdit = (t: EmailTemplate) => {
    setEditingTemplate(t.id);
    setTemplateForm({
      name: t.name,
      subject: t.subject,
      content: t.content,
      cta_text: t.cta_text || "",
      cta_link: t.cta_link || "",
      category: t.category,
      template_html: t.template_html || "",
    });
    setTemplateDialogOpen(true);
  };

  const saveTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.subject.trim()) {
      toast.error("Name and subject are required");
      return;
    }
    const payload: any = {
      name: templateForm.name.trim(),
      subject: templateForm.subject.trim(),
      content: templateForm.content || templateForm.template_html || "",
      cta_text: templateForm.cta_text || null,
      cta_link: templateForm.cta_link || null,
      category: templateForm.category,
      template_html: templateForm.template_html || null,
      updated_at: new Date().toISOString(),
    };

    if (editingTemplate) {
      const { error } = await supabase.from("email_templates").update(payload).eq("id", editingTemplate);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Template updated");
    } else {
      const { error } = await supabase.from("email_templates").insert(payload);
      if (error) { toast.error("Failed to create"); return; }
      toast.success("Template created");
    }
    setTemplateDialogOpen(false);
    fetchAll();
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    await supabase.from("email_templates").delete().eq("id", id);
    toast.success("Template deleted");
    fetchAll();
  };

  // Stats
  const emailCampaigns = campaigns.filter(c => (c.channel || "email") === "email");
  const whatsappCampaigns = campaigns.filter(c => c.channel === "whatsapp");
  const smsCampaigns = campaigns.filter(c => c.channel === "sms");
  const totalSent = campaigns.reduce((a, c) => a + (c.total_sent || 0), 0);
  const totalDrafts = campaigns.filter((c) => c.status === "draft").length;
  const totalContacts = contacts.length;
  const activeContacts = contacts.filter((c) => !c.is_unsubscribed).length;
  const contactsWithPhone = contacts.filter(c => c.phone || c.whatsapp_number).length;

  const filteredCampaigns = channelFilter === "all" ? campaigns : campaigns.filter(c => (c.channel || "email") === channelFilter);

  const getChannelIcon = (ch: string) => {
    if (ch === "whatsapp") return <MessageCircle className="h-3.5 w-3.5" />;
    if (ch === "sms") return <Phone className="h-3.5 w-3.5" />;
    return <Mail className="h-3.5 w-3.5" />;
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Mail className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{emailCampaigns.length}</p>
                <p className="text-sm text-muted-foreground">Email Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-foreground">{whatsappCampaigns.length}</p>
                <p className="text-sm text-muted-foreground">WhatsApp Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Phone className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{smsCampaigns.length}</p>
                <p className="text-sm text-muted-foreground">SMS Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Send className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{totalSent}</p>
                <p className="text-sm text-muted-foreground">Total Sent</p>
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
                <p className="text-sm text-muted-foreground">Active / {contactsWithPhone} w/ Phone</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({totalContacts})</TabsTrigger>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
          <TabsTrigger value="coach-access" className="gap-1"><ShieldCheck className="h-3 w-3" /> Coach Access</TabsTrigger>
        </TabsList>

        {/* CAMPAIGNS TAB */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => openCreate("whatsapp")}><MessageCircle className="h-4 w-4" /> WhatsApp</Button>
              <Button variant="outline" onClick={() => openCreate("sms")}><Phone className="h-4 w-4" /> SMS</Button>
              <Button onClick={() => openCreate("email")}><Plus className="h-4 w-4" /> Email Campaign</Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                    <TableHead>Subject / Message</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : filteredCampaigns.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No campaigns yet</TableCell></TableRow>
                  ) : (
                    filteredCampaigns.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            {getChannelIcon(c.channel || "email")}
                            {(c.channel || "email").toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-foreground line-clamp-1 max-w-[200px]">{c.subject}</p>
                        </TableCell>
                        <TableCell><Badge variant="secondary">{c.audience_type}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={c.status === "sent" ? "default" : c.status === "draft" ? "outline" : "secondary"}>
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.total_sent}/{c.total_recipients}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{format(new Date(c.created_at), "MMM dd, yyyy")}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => showPreview(c)} title="Preview"><Eye className="h-4 w-4" /></Button>
                            {c.status !== "sent" && (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => openEdit(c)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => sendCampaign(c)} disabled={sending} title="Send">
                                  <Send className="h-4 w-4 text-green-600" />
                                </Button>
                              </>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => deleteCampaign(c.id)} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
              {activeContacts} active, {contactsWithPhone} with phone, {contacts.filter((c) => c.is_unsubscribed).length} unsubscribed
            </p>
            <div className="flex gap-2">
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
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
                    <TableHead>Phone / WhatsApp</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Country</TableHead>
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
                        <TableCell className="text-muted-foreground text-sm">{c.email}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{c.whatsapp_number || c.phone || "—"}</TableCell>
                        <TableCell><Badge variant="secondary">{c.user_type || "—"}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{c.country || "—"}</TableCell>
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
            <p className="text-xs text-muted-foreground mt-1">Columns: Name, Email, Phone, WhatsApp, Country, User Type</p>
            <Button variant="outline" className="mt-3" onClick={() => fileInputRef.current?.click()} disabled={uploadingCsv}>Select CSV File</Button>
          </div>
        </TabsContent>

        {/* TEMPLATES TAB */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openTemplateCreate}><Plus className="h-4 w-4" /> Add Template</Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <Card key={t.id} className="hover:border-primary/30 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LayoutTemplate className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">{t.name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openTemplateEdit(t); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteTemplate(t.id); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-1">{t.subject}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">{t.content}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{t.category}</Badge>
                      {t.template_html && <Badge variant="outline" className="gap-1"><Code className="h-3 w-3" /> HTML</Badge>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { openCreate("email"); setTimeout(() => loadTemplate(t), 100); }}>Use</Button>
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
            <DialogTitle>
              {editing ? "Edit Campaign" : `Create ${form.channel === "whatsapp" ? "WhatsApp" : form.channel === "sms" ? "SMS" : "Email"} Campaign`}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            {/* Channel selector */}
            <div className="space-y-2">
              <Label>Channel</Label>
              <div className="flex gap-2">
                {CHANNELS.map((ch) => (
                  <Button
                    key={ch.value}
                    variant={form.channel === ch.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setForm({ ...form, channel: ch.value })}
                    className="gap-1.5"
                  >
                    <ch.icon className="h-4 w-4" /> {ch.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Template loader (email only) */}
            {form.channel === "email" && !editing && templates.length > 0 && (
              <div className="space-y-2">
                <Label>Load Template</Label>
                <Select onValueChange={(v) => { const t = templates.find((t) => t.id === v); if (t) loadTemplate(t); }}>
                  <SelectTrigger><SelectValue placeholder="Choose a template..." /></SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}{t.template_html ? " (HTML)" : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{form.channel === "email" ? "Email Subject *" : "Campaign Title *"}</Label>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder={form.channel === "email" ? "Your email subject line" : "Campaign title"} />
              </div>
              <div className="space-y-2">
                <Label>Audience</Label>
                <Select value={form.audience_type} onValueChange={(v) => setForm({ ...form, audience_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_TYPES.map((a) => (<SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Email-specific fields */}
            {form.channel === "email" && (
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
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  {form.channel === "email" ? "Email Content *" : "Message Content *"}
                  <span className="text-xs text-muted-foreground ml-2">(Use {"{Name}"} for personalization)</span>
                </Label>
                {form.channel === "email" && (
                  <div className="flex gap-2">
                    <input ref={htmlUploadRef} type="file" accept=".html,.htm" onChange={handleHtmlUpload} className="hidden" />
                    <Button variant="outline" size="sm" onClick={() => htmlUploadRef.current?.click()}>
                      <Code className="h-3.5 w-3.5" /> Upload HTML
                    </Button>
                  </div>
                )}
              </div>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder={form.channel === "email" ? "Hello {Name},\n\nYour email content here..." : "Hello {Name}, check out our latest AI course! Visit https://www.aicoachportal.com/courses"}
                rows={form.channel === "email" ? 10 : 5}
                className="font-mono text-sm"
              />
            </div>

            {/* CTA (email only) */}
            {form.channel === "email" && (
              <div className="rounded-lg border border-border p-4 space-y-3">
                <Label className="text-base font-semibold">CTA Button (Optional)</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm">Button Text</Label>
                    <Select value={form.cta_text || "none"} onValueChange={(v) => {
                      if (v === "none") setForm({ ...form, cta_text: "", cta_link: "" });
                      else { const opt = CTA_OPTIONS.find((o) => o.text === v); setForm({ ...form, cta_text: v, cta_link: opt?.link || form.cta_link }); }
                    }}>
                      <SelectTrigger><SelectValue placeholder="No CTA" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No CTA</SelectItem>
                        {CTA_OPTIONS.map((o) => (<SelectItem key={o.text} value={o.text}>{o.text}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Button Link</Label>
                    <Input value={form.cta_link} onChange={(e) => setForm({ ...form, cta_link: e.target.value })} placeholder="/courses" />
                  </div>
                </div>
              </div>
            )}

            {/* WhatsApp/SMS note */}
            {form.channel === "whatsapp" && (
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>WhatsApp:</strong> Generates pre-filled WhatsApp links for each recipient. A CSV with links will be downloaded for sending via WhatsApp Web or WhatsApp Business API.
                </p>
              </div>
            )}
            {form.channel === "sms" && (
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>SMS:</strong> Generates personalized messages for each recipient. A CSV will be downloaded for sending via your SMS gateway (Twilio, MSG91, etc.).
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Schedule (leave empty for immediate)</Label>
              <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button variant="secondary" onClick={() => saveCampaign("draft")}><FileText className="h-4 w-4" /> Save Draft</Button>
              <Button onClick={() => saveCampaign("ready")}>
                {form.scheduled_at ? <><Clock className="h-4 w-4" /> Schedule</> : <><Send className="h-4 w-4" /> Save & Ready</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Create/Edit Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Template Name *</Label>
                <Input value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} placeholder="My Template" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={templateForm.category} onValueChange={(v) => setTemplateForm({ ...templateForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="webinar">Webinar</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                    <SelectItem value="blog">Blog</SelectItem>
                    <SelectItem value="game">Game</SelectItem>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email Subject *</Label>
              <Input value={templateForm.subject} onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })} placeholder="Subject line" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>CTA Text</Label>
                <Input value={templateForm.cta_text} onChange={(e) => setTemplateForm({ ...templateForm, cta_text: e.target.value })} placeholder="Join Now" />
              </div>
              <div className="space-y-2">
                <Label>CTA Link</Label>
                <Input value={templateForm.cta_link} onChange={(e) => setTemplateForm({ ...templateForm, cta_link: e.target.value })} placeholder="/courses" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Content (Text / Markdown)</Label>
              </div>
              <Textarea value={templateForm.content} onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })} rows={6} className="font-mono text-sm" placeholder="Hello {Name},..." />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>HTML Template (Optional)</Label>
                <div>
                  <input ref={templateHtmlRef} type="file" accept=".html,.htm" onChange={handleTemplateHtmlUpload} className="hidden" />
                  <Button variant="outline" size="sm" onClick={() => templateHtmlRef.current?.click()}>
                    <Upload className="h-3.5 w-3.5" /> Upload HTML File
                  </Button>
                </div>
              </div>
              {templateForm.template_html ? (
                <div className="space-y-2">
                  <Badge variant="outline" className="gap-1"><Code className="h-3 w-3" /> HTML template loaded ({Math.round(templateForm.template_html.length / 1024)}KB)</Badge>
                  <Button variant="ghost" size="sm" onClick={() => setTemplateForm({ ...templateForm, template_html: "" })}>Remove HTML</Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Upload an HTML file to use as the email template. HTML templates override text content.</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveTemplate}>{editingTemplate ? "Update" : "Create"} Template</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Preview</DialogTitle></DialogHeader>
          <div className="border border-border rounded-lg overflow-hidden bg-white">
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEmailTools;
