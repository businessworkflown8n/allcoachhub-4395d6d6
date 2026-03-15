import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Mail, Send, Users, Plus, Pencil, Trash2, Eye, Clock, MessageCircle, Phone,
  Megaphone, Instagram, Facebook, Linkedin, Twitter, Youtube, Globe,
  Filter, UserPlus, UserCheck, BarChart3, Upload, Database, AlertTriangle, CheckCircle
} from "lucide-react";
import { CampaignContactImport, type ImportedContact, type ImportSummary } from "./CampaignContactImport";
import CampaignReport from "./CampaignReport";

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
  audience_source: string;
  status: string;
  template_name: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  total_recipients: number;
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  total_opened: number;
  total_clicked: number;
  total_replied: number;
  total_bounced: number;
  total_unsubscribed: number;
  total_imported: number;
  total_valid: number;
  total_invalid: number;
  total_duplicates_removed: number;
  open_rate: number;
  click_rate: number;
  delivery_rate: number;
  attached_file_name: string | null;
  created_at: string;
  channel: string;
  coach_id: string | null;
};

type CoachInfo = { user_id: string; full_name: string; email: string };

const AUDIENCE_TYPES = [
  { value: "all", label: "All Users (Platform + Uploaded)" },
  { value: "learners", label: "Learners Only" },
  { value: "coaches", label: "Coaches Only" },
  { value: "uploaded", label: "Uploaded Contacts Only" },
];

const AUDIENCE_SOURCES = [
  { value: "platform", label: "Platform Audience Only" },
  { value: "imported", label: "Imported Database Only" },
  { value: "both", label: "Platform + Imported Database" },
];

const CAMPAIGN_PLATFORMS = [
  { value: "email", label: "Email", icon: Mail, color: "text-blue-500" },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "text-green-500" },
  { value: "sms", label: "SMS", icon: Phone, color: "text-yellow-500" },
  { value: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-500" },
  { value: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-600" },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-700" },
  { value: "twitter", label: "Twitter / X", icon: Twitter, color: "text-foreground" },
  { value: "youtube", label: "YouTube", icon: Youtube, color: "text-red-500" },
  { value: "push", label: "Push Notification", icon: Megaphone, color: "text-purple-500" },
  { value: "web", label: "Website Banner", icon: Globe, color: "text-teal-500" },
];

const emptyForm = {
  subject: "",
  sender_name: "AI Coach Portal",
  sender_email: "hello@aicoachportal.com",
  content: "",
  cta_text: "",
  cta_link: "/courses",
  audience_type: "all",
  audience_source: "platform",
  scheduled_at: "",
  channel: "email",
};

const AdminCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [coaches, setCoaches] = useState<CoachInfo[]>([]);
  const [coachProfiles, setCoachProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [channelFilter, setChannelFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [assignCampaign, setAssignCampaign] = useState<Campaign | null>(null);
  const [selectedCoaches, setSelectedCoaches] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  // Import state
  const [showImport, setShowImport] = useState(false);
  const [importedContacts, setImportedContacts] = useState<ImportedContact[]>([]);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  // Report state
  const [reportCampaign, setReportCampaign] = useState<Campaign | null>(null);
  // Confirmation dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmCampaign, setConfirmCampaign] = useState<Campaign | null>(null);
  const [platformAudienceCount, setPlatformAudienceCount] = useState(0);

  const fetchAll = async () => {
    setLoading(true);
    const [campRes, rolesRes] = await Promise.all([
      supabase.from("email_campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id").eq("role", "coach"),
    ]);

    if (campRes.data) {
      setCampaigns(campRes.data as unknown as Campaign[]);
      const coachIds = [...new Set(campRes.data.filter((c: any) => c.coach_id).map((c: any) => c.coach_id))];
      if (coachIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", coachIds);
        if (profiles) {
          const map: Record<string, string> = {};
          profiles.forEach((p: any) => { map[p.user_id] = p.full_name || p.email || "Coach"; });
          setCoachProfiles(map);
        }
      }
    }

    if (rolesRes.data) {
      const coachUserIds = rolesRes.data.map((r: any) => r.user_id);
      if (coachUserIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", coachUserIds);
        if (profiles) {
          setCoaches(profiles as CoachInfo[]);
          const map = { ...coachProfiles };
          profiles.forEach((p: any) => { map[p.user_id] = p.full_name || p.email || "Coach"; });
          setCoachProfiles(map);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = (channel = "email") => {
    setEditing(null);
    setForm({ ...emptyForm, channel });
    setImportedContacts([]);
    setImportSummary(null);
    setShowImport(false);
    setDialogOpen(true);
  };

  const openEdit = (c: Campaign) => {
    setEditing(c.id);
    setForm({
      subject: c.subject,
      sender_name: c.sender_name || "",
      sender_email: c.sender_email || "",
      content: c.content,
      cta_text: c.cta_text || "",
      cta_link: c.cta_link || "/courses",
      audience_type: c.audience_type,
      audience_source: c.audience_source || "platform",
      scheduled_at: c.scheduled_at?.slice(0, 16) || "",
      channel: c.channel || "email",
    });
    setImportedContacts([]);
    setImportSummary(null);
    setShowImport(false);
    setDialogOpen(true);
  };

  const saveCampaign = async (status: string) => {
    if (!form.content.trim()) { toast.error("Content is required"); return; }
    const payload: any = {
      subject: form.subject.trim() || `${form.channel.toUpperCase()} Campaign`,
      sender_name: form.sender_name,
      sender_email: form.sender_email,
      content: form.content,
      cta_text: form.cta_text || null,
      cta_link: form.cta_link || null,
      audience_type: form.audience_type,
      audience_source: form.audience_source,
      status,
      channel: form.channel,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      updated_at: new Date().toISOString(),
      coach_id: null,
    };

    if (importSummary) {
      payload.total_imported = importSummary.totalRows;
      payload.total_valid = importSummary.validContacts;
      payload.total_invalid = importSummary.invalidContacts;
      payload.total_duplicates_removed = importSummary.duplicateContacts;
      payload.attached_file_name = "imported_contacts";
    }

    let campaignId = editing;
    if (editing) {
      const { error } = await supabase.from("email_campaigns").update(payload).eq("id", editing);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Campaign updated");
    } else {
      const { data, error } = await supabase.from("email_campaigns").insert(payload).select("id").single();
      if (error) { toast.error("Failed to create"); return; }
      campaignId = data.id;
      toast.success(status === "draft" ? "Draft saved" : "Campaign created");
    }

    // Save imported contacts if any
    if (campaignId && importedContacts.length > 0) {
      const validContacts = importedContacts.filter(c => c.is_valid && !c.is_duplicate);
      if (validContacts.length > 0) {
        const inserts = validContacts.map(c => ({
          campaign_id: campaignId!,
          first_name: c.first_name || null,
          last_name: c.last_name || null,
          full_name: c.full_name || null,
          email: c.email || null,
          phone: c.phone || null,
          country_code: c.country_code || null,
          whatsapp_number: c.whatsapp_number || null,
          company: c.company || null,
          role: c.role || null,
          tags: c.tags || [],
          source: "csv_upload",
          is_valid: true,
          is_duplicate: false,
          validation_errors: [],
        }));
        // Batch insert in chunks
        for (let i = 0; i < inserts.length; i += 500) {
          await supabase.from("campaign_contacts").insert(inserts.slice(i, i + 500));
        }
      }
    }

    setDialogOpen(false);
    setImportedContacts([]);
    setImportSummary(null);
    fetchAll();
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm("Delete this campaign?")) return;
    await supabase.from("email_campaigns").delete().eq("id", id);
    toast.success("Campaign deleted");
    fetchAll();
  };

  const getRecipients = async (audienceType: string, channel: string, campaignId?: string, audienceSource?: string) => {
    const recipients: { email: string; name?: string; phone?: string; source: string }[] = [];
    const src = audienceSource || "platform";

    // Platform audience
    if (src === "platform" || src === "both") {
      if (audienceType === "all" || audienceType === "learners" || audienceType === "coaches") {
        const roleFilter = audienceType === "learners" ? "learner" : audienceType === "coaches" ? "coach" : undefined;
        if (roleFilter) {
          const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", roleFilter);
          if (roles) {
            const { data: profiles } = await supabase.from("profiles").select("email, full_name, whatsapp_number, contact_number").in("user_id", roles.map((r: any) => r.user_id));
            profiles?.forEach((p: any) => { if (p.email) recipients.push({ email: p.email, name: p.full_name, phone: p.whatsapp_number || p.contact_number, source: "platform" }); });
          }
        } else {
          const { data: profiles } = await supabase.from("profiles").select("email, full_name, whatsapp_number, contact_number");
          profiles?.forEach((p: any) => { if (p.email) recipients.push({ email: p.email, name: p.full_name, phone: p.whatsapp_number || p.contact_number, source: "platform" }); });
        }
        if (audienceType === "all") {
          const { data: uploaded } = await supabase.from("email_contacts").select("email, name, whatsapp_number, phone").eq("is_unsubscribed", false);
          (uploaded as any[])?.forEach((c) => {
            if (c.email && !recipients.find(r => r.email === c.email)) recipients.push({ email: c.email, name: c.name, phone: c.whatsapp_number || c.phone, source: "uploaded" });
          });
        }
      } else if (audienceType === "uploaded") {
        const { data: uploaded } = await supabase.from("email_contacts").select("email, name, whatsapp_number, phone").eq("is_unsubscribed", false);
        (uploaded as any[])?.forEach((c) => { if (c.email) recipients.push({ email: c.email, name: c.name, phone: c.whatsapp_number || c.phone, source: "uploaded" }); });
      }
    }

    // Imported contacts from campaign_contacts
    if ((src === "imported" || src === "both") && campaignId) {
      const { data: imported } = await supabase.from("campaign_contacts").select("*").eq("campaign_id", campaignId).eq("is_valid", true).eq("is_duplicate", false);
      (imported as any[])?.forEach((c) => {
        const email = c.email || "";
        const phone = c.whatsapp_number || c.phone || "";
        const name = c.full_name || [c.first_name, c.last_name].filter(Boolean).join(" ") || "";
        if ((channel === "email" && email) || (channel !== "email" && phone)) {
          if (!recipients.find(r => (channel === "email" ? r.email === email : (r.phone === phone)))) {
            recipients.push({ email, name, phone, source: "imported" });
          }
        }
      });
    }

    const seen = new Set<string>();
    return recipients.filter(r => {
      const key = channel === "email" ? r.email : (r.phone || r.email);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      if (channel !== "email" && !r.phone) return false;
      return true;
    });
  };

  const openSendConfirmation = async (campaign: Campaign) => {
    setSending(true);
    try {
      const recipients = await getRecipients(campaign.audience_type, campaign.channel, campaign.id, campaign.audience_source);
      setPlatformAudienceCount(recipients.length);
      setConfirmCampaign(campaign);
      setConfirmOpen(true);
    } catch { toast.error("Failed to calculate audience"); }
    setSending(false);
  };

  const sendCampaign = async () => {
    if (!confirmCampaign) return;
    const campaign = confirmCampaign;
    const ch = campaign.channel || "email";
    setConfirmOpen(false);
    setSending(true);
    try {
      if (ch === "email") {
        const recipients = await getRecipients(campaign.audience_type, ch, campaign.id, campaign.audience_source);
        if (!recipients.length) { toast.error("No recipients found"); setSending(false); return; }

        // Log activity
        const activityInserts = recipients.map(r => ({
          campaign_id: campaign.id,
          contact_email: r.email,
          contact_name: r.name || null,
          source: r.source,
          channel: ch,
          status: "queued",
        }));
        for (let i = 0; i < activityInserts.length; i += 500) {
          await supabase.from("campaign_activity_log").insert(activityInserts.slice(i, i + 500));
        }

        // Apply personalization
        const personalizedRecipients = recipients.map(r => ({
          email: r.email,
          name: r.name || "",
        }));

        toast.info(`Sending to ${personalizedRecipients.length} recipients...`);
        const { data, error } = await supabase.functions.invoke("send-campaign-emails", {
          body: { campaignId: campaign.id, recipients: personalizedRecipients },
        });
        if (error) toast.error("Failed: " + error.message);
        else {
          toast.success(`Sent ${data.sent}/${data.total} emails`);
          // Update campaign stats
          await supabase.from("email_campaigns").update({
            total_sent: data.sent || 0,
            total_recipients: data.total || 0,
            total_delivered: data.sent || 0,
            delivery_rate: data.total > 0 ? ((data.sent / data.total) * 100) : 0,
          }).eq("id", campaign.id);
          // Update activity logs
          await supabase.from("campaign_activity_log")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("campaign_id", campaign.id)
            .eq("status", "queued");
        }
      } else {
        await supabase.from("email_campaigns").update({ status: "sent", sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", campaign.id);
        toast.success(`${ch} campaign marked as sent. Use the platform's native tools to publish.`);
      }
    } catch (e: any) { toast.error(e.message); }
    setSending(false);
    setConfirmCampaign(null);
    fetchAll();
  };

  const openAssignDialog = (campaign: Campaign) => {
    setAssignCampaign(campaign);
    setSelectedCoaches([]);
    setAssignOpen(true);
  };

  const toggleCoach = (coachId: string) => {
    setSelectedCoaches(prev => prev.includes(coachId) ? prev.filter(id => id !== coachId) : [...prev, coachId]);
  };

  const assignToCoaches = async () => {
    if (!assignCampaign || selectedCoaches.length === 0) { toast.error("Select at least one coach"); return; }
    setAssigning(true);
    const inserts = selectedCoaches.map(coachId => ({
      subject: assignCampaign.subject, sender_name: assignCampaign.sender_name, sender_email: assignCampaign.sender_email,
      content: assignCampaign.content, cta_text: assignCampaign.cta_text, cta_link: assignCampaign.cta_link,
      audience_type: "my_learners", status: "draft", channel: assignCampaign.channel,
      scheduled_at: assignCampaign.scheduled_at, coach_id: coachId,
    }));
    const { error } = await supabase.from("email_campaigns").insert(inserts);
    if (error) toast.error("Failed to assign: " + error.message);
    else toast.success(`Campaign assigned to ${selectedCoaches.length} coach(es)`);
    setAssigning(false);
    setAssignOpen(false);
    fetchAll();
  };

  const filteredCampaigns = campaigns.filter(c => {
    if (channelFilter !== "all" && c.channel !== channelFilter) return false;
    if (ownerFilter === "admin" && c.coach_id) return false;
    if (ownerFilter === "coach" && !c.coach_id) return false;
    return true;
  });

  const stats = {
    total: campaigns.length,
    sent: campaigns.filter(c => c.status === "sent").length,
    draft: campaigns.filter(c => c.status === "draft").length,
    coachCampaigns: campaigns.filter(c => c.coach_id).length,
  };

  const getPlatformInfo = (channel: string) => CAMPAIGN_PLATFORMS.find(p => p.value === channel) || CAMPAIGN_PLATFORMS[0];

  const handleImportComplete = (contacts: ImportedContact[], summary: ImportSummary) => {
    setImportedContacts(contacts);
    setImportSummary(summary);
    setShowImport(false);
    if (form.audience_source === "platform") {
      setForm(prev => ({ ...prev, audience_source: "both" }));
    }
    toast.success(`${summary.validContacts} valid contacts imported`);
  };

  // Show report view
  if (reportCampaign) {
    return <CampaignReport campaign={reportCampaign as any} onBack={() => setReportCampaign(null)} />;
  }

  if (loading) return <div className="flex justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  const showImportable = ["email", "whatsapp", "sms"].includes(form.channel);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><Megaphone className="h-6 w-6 text-primary" /> Campaign Dashboard</h2>
          <p className="text-muted-foreground text-sm mt-1">Create, assign to coaches, and track campaigns across all platforms</p>
        </div>
        <Button onClick={() => openCreate()} className="gap-2"><Plus className="h-4 w-4" /> Create Campaign</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{stats.total}</p><p className="text-xs text-muted-foreground">Total Campaigns</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-500">{stats.sent}</p><p className="text-xs text-muted-foreground">Sent</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-yellow-500">{stats.draft}</p><p className="text-xs text-muted-foreground">Drafts</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-purple-500">{stats.coachCampaigns}</p><p className="text-xs text-muted-foreground">Assigned to Coaches</p></CardContent></Card>
      </div>

      {/* Platform Quick Actions */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Quick Create by Platform</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {CAMPAIGN_PLATFORMS.map(p => {
              const Icon = p.icon;
              return (
                <Button key={p.value} variant="outline" size="sm" onClick={() => openCreate(p.value)} className="gap-2">
                  <Icon className={`h-4 w-4 ${p.color}`} /> {p.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="All Platforms" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            {CAMPAIGN_PLATFORMS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
          <SelectTrigger className="w-[180px]"><Users className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campaigns</SelectItem>
            <SelectItem value="admin">Admin Only</SelectItem>
            <SelectItem value="coach">Coach Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No campaigns found</TableCell></TableRow>
              )}
              {filteredCampaigns.map(c => {
                const platform = getPlatformInfo(c.channel);
                const PIcon = platform.icon;
                return (
                  <TableRow key={c.id}>
                    <TableCell><Badge variant="outline" className="gap-1"><PIcon className={`h-3 w-3 ${platform.color}`} />{platform.label}</Badge></TableCell>
                    <TableCell className="font-medium max-w-[180px] truncate">{c.subject}</TableCell>
                    <TableCell>
                      {c.coach_id ? (
                        <Badge variant="secondary" className="text-xs">{coachProfiles[c.coach_id] || "Coach"}</Badge>
                      ) : (
                        <Badge className="text-xs bg-primary/10 text-primary">Admin</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {c.audience_source === "both" ? (
                        <Badge variant="outline" className="text-xs gap-1"><Database className="h-2.5 w-2.5" />Both</Badge>
                      ) : c.audience_source === "imported" ? (
                        <Badge variant="outline" className="text-xs gap-1"><Upload className="h-2.5 w-2.5" />Imported</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Platform</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.status === "sent" ? "default" : c.status === "draft" ? "secondary" : "outline"}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{c.total_sent || 0}/{c.total_recipients || 0}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(c.created_at), "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setPreviewContent(c.content); setPreviewOpen(true); }}><Eye className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setReportCampaign(c)} title="View Report"><BarChart3 className="h-4 w-4 text-primary" /></Button>
                        {!c.coach_id && (
                          <Button size="icon" variant="ghost" onClick={() => openAssignDialog(c)} title="Assign to Coaches">
                            <UserPlus className="h-4 w-4 text-blue-500" />
                          </Button>
                        )}
                        {c.status !== "sent" && (
                          <Button size="icon" variant="ghost" onClick={() => openSendConfirmation(c)} disabled={sending}><Send className="h-4 w-4" /></Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => deleteCampaign(c.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {(() => { const p = getPlatformInfo(form.channel); const I = p.icon; return <I className={`h-5 w-5 ${p.color}`} />; })()}
              {editing ? "Edit" : "Create"} {getPlatformInfo(form.channel).label} Campaign
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Platform</Label>
              <Select value={form.channel} onValueChange={v => setForm({ ...form, channel: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CAMPAIGN_PLATFORMS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Campaign Title / Subject</Label><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Campaign title..." /></div>
            {form.channel === "email" && (
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Sender Name</Label><Input value={form.sender_name} onChange={e => setForm({ ...form, sender_name: e.target.value })} /></div>
                <div><Label>Sender Email</Label><Input value={form.sender_email} onChange={e => setForm({ ...form, sender_email: e.target.value })} /></div>
              </div>
            )}
            <div>
              <Label>Content / Message</Label>
              <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={6} placeholder="Use {Name}, {FirstName}, {Company}, {Role} for personalization. Fallback: {Name|there}" />
              <p className="text-xs text-muted-foreground mt-1">Personalization tags: {"{Name}"}, {"{FirstName}"}, {"{LastName}"}, {"{Email}"}, {"{Company}"}, {"{Role}"} — Fallback: {"{Name|Friend}"}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>CTA Text</Label><Input value={form.cta_text} onChange={e => setForm({ ...form, cta_text: e.target.value })} placeholder="e.g., Join Now" /></div>
              <div><Label>CTA Link</Label><Input value={form.cta_link} onChange={e => setForm({ ...form, cta_link: e.target.value })} placeholder="/courses" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Audience</Label>
                <Select value={form.audience_type} onValueChange={v => setForm({ ...form, audience_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{AUDIENCE_TYPES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Schedule (optional)</Label><Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} /></div>
            </div>

            {/* Audience Source */}
            {showImportable && (
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold flex items-center gap-2"><Database className="h-4 w-4 text-primary" /> Audience Source</Label>
                </div>
                <Select value={form.audience_source} onValueChange={v => setForm({ ...form, audience_source: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{AUDIENCE_SOURCES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
                </Select>

                {(form.audience_source === "imported" || form.audience_source === "both") && (
                  <>
                    {!showImport && !importSummary && (
                      <Button variant="outline" className="w-full gap-2" onClick={() => setShowImport(true)}>
                        <Upload className="h-4 w-4" /> Attach Database / Import Contacts
                      </Button>
                    )}
                    {showImport && (
                      <CampaignContactImport
                        channel={form.channel}
                        onImportComplete={handleImportComplete}
                        onCancel={() => setShowImport(false)}
                      />
                    )}
                    {importSummary && !showImport && (
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" /> Contacts Imported
                          </p>
                          <Button variant="ghost" size="sm" onClick={() => { setShowImport(true); setImportSummary(null); setImportedContacts([]); }}>
                            Re-import
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div><p className="text-lg font-bold text-green-500">{importSummary.validContacts}</p><p className="text-xs text-muted-foreground">Valid</p></div>
                          <div><p className="text-lg font-bold text-red-500">{importSummary.invalidContacts}</p><p className="text-xs text-muted-foreground">Invalid</p></div>
                          <div><p className="text-lg font-bold text-yellow-500">{importSummary.duplicateContacts}</p><p className="text-xs text-muted-foreground">Duplicates</p></div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => saveCampaign("draft")}><Clock className="h-4 w-4 mr-2" /> Save Draft</Button>
              <Button onClick={() => saveCampaign("ready")}><Send className="h-4 w-4 mr-2" /> Save & Ready</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-yellow-500" /> Confirm Send</DialogTitle></DialogHeader>
          {confirmCampaign && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <p className="text-sm"><strong>Campaign:</strong> {confirmCampaign.subject}</p>
                <p className="text-sm"><strong>Channel:</strong> {getPlatformInfo(confirmCampaign.channel).label}</p>
                <p className="text-sm"><strong>Audience Source:</strong> {confirmCampaign.audience_source || "platform"}</p>
                <p className="text-sm"><strong>Total Valid Recipients:</strong> <span className="text-primary font-bold">{platformAudienceCount}</span></p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
                <Button onClick={sendCampaign} disabled={sending} className="gap-2">
                  <Send className="h-4 w-4" /> {sending ? "Sending..." : "Confirm & Send"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign to Coaches Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-primary" /> Assign Campaign to Coaches</DialogTitle>
          </DialogHeader>
          {assignCampaign && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm font-medium">{assignCampaign.subject}</p>
                <p className="text-xs text-muted-foreground mt-1">Platform: {getPlatformInfo(assignCampaign.channel).label}</p>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Select Coaches ({selectedCoaches.length} selected)</Label>
                <div className="flex gap-2 mb-3">
                  <Button variant="outline" size="sm" onClick={() => setSelectedCoaches(coaches.map(c => c.user_id))}>Select All</Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedCoaches([])}>Clear All</Button>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-lg p-3">
                  {coaches.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No coaches found</p>}
                  {coaches.map(coach => (
                    <label key={coach.user_id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer transition-colors">
                      <Checkbox checked={selectedCoaches.includes(coach.user_id)} onCheckedChange={() => toggleCoach(coach.user_id)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{coach.full_name || "Unnamed Coach"}</p>
                        <p className="text-xs text-muted-foreground truncate">{coach.email}</p>
                      </div>
                      {selectedCoaches.includes(coach.user_id) && <UserCheck className="h-4 w-4 text-green-500 shrink-0" />}
                    </label>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">A copy of this campaign will be created for each selected coach.</p>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
                <Button onClick={assignToCoaches} disabled={assigning || selectedCoaches.length === 0} className="gap-2">
                  <UserPlus className="h-4 w-4" /> {assigning ? "Assigning..." : `Assign to ${selectedCoaches.length} Coach(es)`}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Campaign Preview</DialogTitle></DialogHeader>
          <div className="bg-muted rounded-lg p-4 whitespace-pre-wrap text-sm max-h-[60vh] overflow-y-auto">{previewContent}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCampaigns;
