import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  BarChart3, Send, CheckCircle, XCircle, Eye, MousePointerClick,
  MessageCircle, ArrowLeft, Download, Mail, Phone, Filter,
  Users, TrendingUp, AlertTriangle, Clock
} from "lucide-react";
import * as XLSX from "xlsx";

type Campaign = {
  id: string;
  subject: string;
  channel: string;
  status: string;
  total_recipients: number;
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  total_opened: number;
  total_clicked: number;
  total_replied: number;
  total_bounced: number;
  total_unsubscribed: number;
  open_rate: number;
  click_rate: number;
  delivery_rate: number;
  audience_source: string;
  total_imported: number;
  total_valid: number;
  total_invalid: number;
  total_duplicates_removed: number;
  sent_at: string | null;
  created_at: string;
};

type ActivityLog = {
  id: string;
  contact_email: string | null;
  contact_phone: string | null;
  contact_name: string | null;
  source: string;
  channel: string;
  status: string;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  replied_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  created_at: string;
};

type Props = {
  campaign: Campaign;
  onBack: () => void;
};

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "sent", label: "Sent" },
  { value: "delivered", label: "Delivered" },
  { value: "opened", label: "Opened" },
  { value: "clicked", label: "Clicked" },
  { value: "failed", label: "Failed" },
  { value: "replied", label: "Replied" },
  { value: "queued", label: "Queued" },
];

const CampaignReport = ({ campaign, onBack }: Props) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("campaign_activity_log")
        .select("*")
        .eq("campaign_id", campaign.id)
        .order("created_at", { ascending: false });
      if (data) setLogs(data as unknown as ActivityLog[]);
      setLoading(false);
    };
    fetchLogs();
  }, [campaign.id]);

  const filteredLogs = statusFilter === "all" ? logs : logs.filter(l => l.status === statusFilter);

  const sent = campaign.total_sent || 0;
  const delivered = campaign.total_delivered || 0;
  const opened = campaign.total_opened || 0;
  const clicked = campaign.total_clicked || 0;
  const failed = campaign.total_failed || 0;
  const replied = campaign.total_replied || 0;
  const bounced = campaign.total_bounced || 0;
  const unsub = campaign.total_unsubscribed || 0;

  const pct = (n: number, d: number) => d > 0 ? ((n / d) * 100).toFixed(1) : "0.0";

  const channelLabel = campaign.channel === "email" ? "Email" : campaign.channel === "whatsapp" ? "WhatsApp" : campaign.channel === "sms" ? "SMS" : campaign.channel;

  const exportReport = (type: "summary" | "full" | "failed") => {
    let data: any[];
    let filename: string;

    if (type === "summary") {
      data = [{
        Campaign: campaign.subject,
        Channel: channelLabel,
        Status: campaign.status,
        "Total Sent": sent,
        "Total Delivered": delivered,
        "Delivery Rate": pct(delivered, sent) + "%",
        "Total Opened": opened,
        "Open Rate": pct(opened, delivered) + "%",
        "Total Clicked": clicked,
        "Click Rate": pct(clicked, opened) + "%",
        "Total Failed": failed,
        "Total Bounced": bounced,
        "Total Replied": replied,
        "Total Unsubscribed": unsub,
      }];
      filename = `campaign-summary-${campaign.id.slice(0, 8)}`;
    } else if (type === "failed") {
      data = logs.filter(l => l.status === "failed").map(l => ({
        Name: l.contact_name || "",
        Email: l.contact_email || "",
        Phone: l.contact_phone || "",
        Source: l.source,
        "Failure Reason": l.failure_reason || "",
        "Failed At": l.failed_at ? format(new Date(l.failed_at), "dd MMM yyyy HH:mm") : "",
      }));
      filename = `campaign-failed-${campaign.id.slice(0, 8)}`;
    } else {
      data = logs.map(l => ({
        Name: l.contact_name || "",
        Email: l.contact_email || "",
        Phone: l.contact_phone || "",
        Source: l.source,
        Channel: l.channel,
        Status: l.status,
        "Sent At": l.sent_at ? format(new Date(l.sent_at), "dd MMM yyyy HH:mm") : "",
        "Delivered At": l.delivered_at ? format(new Date(l.delivered_at), "dd MMM yyyy HH:mm") : "",
        "Opened At": l.opened_at ? format(new Date(l.opened_at), "dd MMM yyyy HH:mm") : "",
        "Clicked At": l.clicked_at ? format(new Date(l.clicked_at), "dd MMM yyyy HH:mm") : "",
        "Replied At": l.replied_at ? format(new Date(l.replied_at), "dd MMM yyyy HH:mm") : "",
        "Failure Reason": l.failure_reason || "",
      }));
      filename = `campaign-full-report-${campaign.id.slice(0, 8)}`;
    }

    if (!data.length) { toast.error("No data to export"); return; }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${filename}.xlsx`);
    toast.success("Report exported");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Campaign Report
          </h3>
          <p className="text-sm text-muted-foreground">{campaign.subject} • {channelLabel}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportReport("summary")} className="gap-1">
            <Download className="h-3 w-3" /> Summary
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportReport("full")} className="gap-1">
            <Download className="h-3 w-3" /> Full Report
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportReport("failed")} className="gap-1">
            <Download className="h-3 w-3" /> Failed
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <MetricCard icon={Send} label="Sent" value={sent} color="text-blue-500" />
        <MetricCard icon={CheckCircle} label="Delivered" value={delivered} sub={pct(delivered, sent) + "%"} color="text-green-500" />
        {campaign.channel === "email" && <MetricCard icon={Eye} label="Opened" value={opened} sub={pct(opened, delivered) + "%"} color="text-purple-500" />}
        <MetricCard icon={MousePointerClick} label="Clicked" value={clicked} sub={pct(clicked, opened || delivered) + "%"} color="text-primary" />
        <MetricCard icon={XCircle} label="Failed" value={failed} sub={pct(failed, sent) + "%"} color="text-red-500" />
        <MetricCard icon={MessageCircle} label="Replied" value={replied} color="text-teal-500" />
      </div>

      {/* Delivery Funnel */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Delivery Funnel</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <FunnelRow label="Sent" value={sent} max={sent} color="bg-blue-500" />
          <FunnelRow label="Delivered" value={delivered} max={sent} color="bg-green-500" />
          {campaign.channel === "email" && <FunnelRow label="Opened" value={opened} max={sent} color="bg-purple-500" />}
          <FunnelRow label="Clicked" value={clicked} max={sent} color="bg-primary" />
          <FunnelRow label="Replied" value={replied} max={sent} color="bg-teal-500" />
        </CardContent>
      </Card>

      {/* Audience Source Split */}
      {(campaign.total_imported > 0 || campaign.audience_source !== "platform") && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Audience Source</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold">{campaign.total_imported || 0}</p>
                <p className="text-xs text-muted-foreground">Imported</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-green-500">{campaign.total_valid || 0}</p>
                <p className="text-xs text-muted-foreground">Valid</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-red-500">{campaign.total_invalid || 0}</p>
                <p className="text-xs text-muted-foreground">Invalid</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-yellow-500">{campaign.total_duplicates_removed || 0}</p>
                <p className="text-xs text-muted-foreground">Duplicates Removed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Channel-specific metrics */}
      {campaign.channel === "email" && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> Email Metrics</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-orange-500">{bounced}</p>
                <p className="text-xs text-muted-foreground">Bounced</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-red-400">{unsub}</p>
                <p className="text-xs text-muted-foreground">Unsubscribed</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-primary">{pct(clicked, opened)}%</p>
                <p className="text-xs text-muted-foreground">Click-to-Open</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-green-500">{pct(delivered, sent)}%</p>
                <p className="text-xs text-muted-foreground">Delivery Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {campaign.channel === "whatsapp" && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageCircle className="h-4 w-4 text-green-500" /> WhatsApp Metrics</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-blue-500">{opened}</p>
                <p className="text-xs text-muted-foreground">Read</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-primary">{pct(opened, delivered)}%</p>
                <p className="text-xs text-muted-foreground">Read Rate</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-teal-500">{replied}</p>
                <p className="text-xs text-muted-foreground">Replies</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-green-500">{pct(replied, delivered)}%</p>
                <p className="text-xs text-muted-foreground">Response Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {campaign.channel === "sms" && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Phone className="h-4 w-4 text-yellow-500" /> SMS Metrics</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-green-500">{pct(delivered, sent)}%</p>
                <p className="text-xs text-muted-foreground">Delivery Rate</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-yellow-500">{logs.filter(l => l.status === "queued").length}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-teal-500">{replied}</p>
                <p className="text-xs text-muted-foreground">Replies</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Contact Activity Log ({filteredLogs.length})</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><Filter className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS_FILTERS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
          ) : (
            <div className="overflow-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Delivered</TableHead>
                    {campaign.channel === "email" && <TableHead>Opened</TableHead>}
                    <TableHead>Clicked</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No activity logs yet</TableCell></TableRow>
                  )}
                  {filteredLogs.map(l => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{l.contact_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{l.contact_email || l.contact_phone || "—"}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{l.source}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={l.status === "delivered" ? "default" : l.status === "failed" ? "destructive" : "secondary"}>
                          {l.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{l.sent_at ? format(new Date(l.sent_at), "HH:mm") : "—"}</TableCell>
                      <TableCell className="text-xs">{l.delivered_at ? format(new Date(l.delivered_at), "HH:mm") : "—"}</TableCell>
                      {campaign.channel === "email" && <TableCell className="text-xs">{l.opened_at ? format(new Date(l.opened_at), "HH:mm") : "—"}</TableCell>}
                      <TableCell className="text-xs">{l.clicked_at ? format(new Date(l.clicked_at), "HH:mm") : "—"}</TableCell>
                      <TableCell className="text-xs text-destructive max-w-[150px] truncate">{l.failure_reason || "—"}</TableCell>
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

const MetricCard = ({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: number; sub?: string; color: string }) => (
  <Card>
    <CardContent className="p-3 text-center">
      <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sub && <p className="text-xs font-medium text-muted-foreground">{sub}</p>}
    </CardContent>
  </Card>
);

const FunnelRow = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => (
  <div className="flex items-center gap-3">
    <span className="text-sm w-20 text-muted-foreground">{label}</span>
    <div className="flex-1">
      <div className="h-6 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }} />
      </div>
    </div>
    <span className="text-sm font-medium w-12 text-right">{value}</span>
  </div>
);

export default CampaignReport;
