import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Send, Clock } from "lucide-react";
import { format } from "date-fns";

interface Campaign {
  id: string;
  name: string;
  status: string;
  audience_type: string;
  total_recipients: number;
  total_sent: number;
  total_delivered: number;
  total_read: number;
  total_clicked: number;
  total_failed: number;
  created_at: string;
  scheduled_at: string | null;
  sent_at: string | null;
  template_id: string | null;
}

interface Template {
  id: string;
  name: string;
}

const statusColors: Record<string, string> = {
  draft: "secondary",
  scheduled: "outline",
  sending: "default",
  sent: "default",
  failed: "destructive",
};

const WhatsAppCampaigns = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", template_id: "", audience_type: "all" });

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [campRes, tplRes] = await Promise.all([
      supabase.from("whatsapp_campaigns").select("*").eq("coach_id", user.id).order("created_at", { ascending: false }),
      supabase.from("whatsapp_templates").select("id, name"),
    ]);
    setCampaigns((campRes.data as Campaign[]) || []);
    setTemplates((tplRes.data as Template[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const createCampaign = async () => {
    if (!user || !form.name.trim()) return;
    const { error } = await supabase.from("whatsapp_campaigns").insert({
      coach_id: user.id,
      name: form.name,
      template_id: form.template_id || null,
      audience_type: form.audience_type,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Campaign Created", description: "Your campaign has been saved as draft." });
      setOpen(false);
      setForm({ name: "", template_id: "", audience_type: "all" });
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Your Campaigns</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Campaign</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create WhatsApp Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Campaign Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Course Launch Promo" />
              </div>
              <div>
                <Label>Template</Label>
                <Select value={form.template_id} onValueChange={(v) => setForm({ ...form, template_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Audience</Label>
                <Select value={form.audience_type} onValueChange={(v) => setForm({ ...form, audience_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Contacts</SelectItem>
                    <SelectItem value="leads">Leads Only</SelectItem>
                    <SelectItem value="students">Students Only</SelectItem>
                    <SelectItem value="webinar">Webinar Attendees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={createCampaign} disabled={!form.name.trim()}>
                Save as Draft
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading campaigns...</p>
          ) : campaigns.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No campaigns yet. Create your first campaign!</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Delivered</TableHead>
                    <TableHead>Read</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                      <TableCell>
                        <Badge variant={(statusColors[c.status] as any) || "secondary"}>
                          {c.status === "scheduled" && <Clock className="h-3 w-3 mr-1" />}
                          {c.status === "sent" && <Send className="h-3 w-3 mr-1" />}
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">{c.audience_type}</TableCell>
                      <TableCell>{c.total_sent}</TableCell>
                      <TableCell>{c.total_delivered}</TableCell>
                      <TableCell>{c.total_read}</TableCell>
                      <TableCell className="text-muted-foreground">{format(new Date(c.created_at), "MMM d, yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppCampaigns;
