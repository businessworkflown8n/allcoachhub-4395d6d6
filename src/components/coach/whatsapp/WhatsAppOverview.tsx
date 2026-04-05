import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, CheckCheck, Eye, MousePointerClick, MessageCircle, XCircle } from "lucide-react";

const WhatsAppOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_sent: 0,
    total_delivered: 0,
    total_read: 0,
    total_clicked: 0,
    total_replied: 0,
    total_failed: 0,
    campaigns_count: 0,
    contacts_count: 0,
  });

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [campaignsRes, contactsRes] = await Promise.all([
        supabase.from("whatsapp_campaigns").select("*").eq("coach_id", user.id),
        supabase.from("whatsapp_contacts").select("id", { count: "exact", head: true }).eq("coach_id", user.id),
      ]);

      const campaigns = campaignsRes.data || [];
      const agg = campaigns.reduce(
        (acc, c) => ({
          total_sent: acc.total_sent + (c.total_sent || 0),
          total_delivered: acc.total_delivered + (c.total_delivered || 0),
          total_read: acc.total_read + (c.total_read || 0),
          total_clicked: acc.total_clicked + (c.total_clicked || 0),
          total_replied: acc.total_replied + (c.total_replied || 0),
          total_failed: acc.total_failed + (c.total_failed || 0),
        }),
        { total_sent: 0, total_delivered: 0, total_read: 0, total_clicked: 0, total_replied: 0, total_failed: 0 }
      );

      setStats({
        ...agg,
        campaigns_count: campaigns.length,
        contacts_count: contactsRes.count || 0,
      });
    };
    fetch();
  }, [user]);

  const cards = [
    { label: "Messages Sent", value: stats.total_sent, icon: Send, color: "text-primary" },
    { label: "Delivered", value: stats.total_delivered, icon: CheckCheck, color: "text-emerald-500" },
    { label: "Read", value: stats.total_read, icon: Eye, color: "text-blue-500" },
    { label: "Clicked", value: stats.total_clicked, icon: MousePointerClick, color: "text-amber-500" },
    { label: "Replies", value: stats.total_replied, icon: MessageCircle, color: "text-violet-500" },
    { label: "Failed", value: stats.total_failed, icon: XCircle, color: "text-destructive" },
  ];

  const deliveryRate = stats.total_sent > 0 ? ((stats.total_delivered / stats.total_sent) * 100).toFixed(1) : "0";
  const readRate = stats.total_delivered > 0 ? ((stats.total_read / stats.total_delivered) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-6 text-center">
              <c.icon className={`h-6 w-6 mx-auto mb-2 ${c.color}`} />
              <p className="text-2xl font-bold text-foreground">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Delivery Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{deliveryRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Read Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{readRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{stats.contacts_count}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Quick Start</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-border p-4 text-center">
              <p className="font-semibold text-foreground">1. Add Contacts</p>
              <p className="text-sm text-muted-foreground mt-1">Upload your audience via CSV or add manually</p>
            </div>
            <div className="rounded-lg border border-border p-4 text-center">
              <p className="font-semibold text-foreground">2. Pick a Template</p>
              <p className="text-sm text-muted-foreground mt-1">Choose from approved message templates</p>
            </div>
            <div className="rounded-lg border border-border p-4 text-center">
              <p className="font-semibold text-foreground">3. Launch Campaign</p>
              <p className="text-sm text-muted-foreground mt-1">Send instantly or schedule for later</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppOverview;
