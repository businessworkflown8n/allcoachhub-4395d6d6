import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Plug, CheckCircle2, XCircle, AlertTriangle, RefreshCw,
  Globe, ShoppingCart, CreditCard, BarChart3
} from "lucide-react";
import AdminIntegrationWizard from "./AdminIntegrationWizard";
import AdminIntegrationGuide from "./AdminIntegrationGuide";

type Connection = {
  id: string;
  coach_id: string;
  platform: string;
  status: string;
  last_sync_at: string | null;
  error_log: string | null;
  created_at: string;
};

const INTEGRATIONS = [
  { category: "Advertising", icon: Globe, items: [
    { id: "google_ads", name: "Google Ads", description: "Search, Display, YouTube campaigns" },
    { id: "meta_ads", name: "Meta Ads", description: "Facebook & Instagram advertising" },
    { id: "tiktok_ads", name: "TikTok Ads", description: "TikTok campaign management" },
    { id: "linkedin_ads", name: "LinkedIn Ads", description: "B2B advertising platform" },
    { id: "bing_ads", name: "Bing Ads", description: "Microsoft advertising network" },
  ]},
  { category: "E-commerce", icon: ShoppingCart, items: [
    { id: "shopify", name: "Shopify", description: "E-commerce store integration" },
    { id: "woocommerce", name: "WooCommerce", description: "WordPress commerce plugin" },
    { id: "custom_backend", name: "Custom Backend", description: "Your own backend API" },
  ]},
  { category: "Analytics", icon: BarChart3, items: [
    { id: "ga4", name: "GA4", description: "Google Analytics 4 tracking" },
    { id: "gtm", name: "Google Tag Manager", description: "Tag management system" },
    { id: "meta_capi", name: "Meta Conversion API", description: "Server-side tracking" },
  ]},
  { category: "Payments", icon: CreditCard, items: [
    { id: "razorpay", name: "Razorpay", description: "Indian payment gateway" },
    { id: "stripe", name: "Stripe", description: "Global payment processing" },
    { id: "paypal", name: "PayPal", description: "Online payment system" },
  ]},
];

const AdminIntegrationsHub = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardPlatform, setWizardPlatform] = useState({ id: "", name: "" });

  const fetchConnections = async () => {
    const { data } = await supabase.from("ad_platform_connections").select("*").order("created_at", { ascending: false });
    if (data) setConnections(data as unknown as Connection[]);
    setLoading(false);
  };

  useEffect(() => { fetchConnections(); }, []);

  const getConnectionStatus = (platformId: string) => connections.find(c => c.platform === platformId);

  const getStatusBadge = (conn: Connection | undefined) => {
    if (!conn) return <Badge variant="outline" className="text-muted-foreground">Not Connected</Badge>;
    if (conn.status === "connected") return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Connected</Badge>;
    if (conn.status === "error") return <Badge variant="destructive">Error</Badge>;
    return <Badge variant="secondary">{conn.status}</Badge>;
  };

  const getStatusIcon = (conn: Connection | undefined) => {
    if (!conn) return <Plug className="h-5 w-5 text-muted-foreground" />;
    if (conn.status === "connected") return <CheckCircle2 className="h-5 w-5 text-green-400" />;
    if (conn.status === "error") return <XCircle className="h-5 w-5 text-destructive" />;
    return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
  };

  const handleConnect = (platformId: string, platformName: string) => {
    setWizardPlatform({ id: platformId, name: platformName });
    setWizardOpen(true);
  };

  const handleDisconnect = async (connId: string) => {
    const { error } = await supabase.from("ad_platform_connections").delete().eq("id", connId);
    if (error) { toast.error("Failed to disconnect"); return; }
    toast.success("Disconnected");
    fetchConnections();
  };

  const connectedCount = connections.filter(c => c.status === "connected").length;
  const errorCount = connections.filter(c => c.status === "error").length;

  if (loading) return <div className="flex justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><Plug className="h-6 w-6 text-primary" /> Integrations Hub</h2>
        <p className="text-muted-foreground text-sm mt-1">Connect ad platforms, analytics, and payment gateways</p>
      </div>

      <Tabs defaultValue="connections">
        <TabsList>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="guide">Setup Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-6 mt-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{connectedCount}</p><p className="text-xs text-muted-foreground">Connected</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">{errorCount}</p><p className="text-xs text-muted-foreground">Errors</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-muted-foreground">{INTEGRATIONS.reduce((t, c) => t + c.items.length, 0) - connectedCount}</p><p className="text-xs text-muted-foreground">Available</p></CardContent></Card>
          </div>

          {/* Integration Categories */}
          {INTEGRATIONS.map(category => {
            const CatIcon = category.icon;
            return (
              <div key={category.category} className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <CatIcon className="h-5 w-5 text-primary" /> {category.category}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {category.items.map(item => {
                    const conn = getConnectionStatus(item.id);
                    return (
                      <Card key={item.id} className={conn?.status === "connected" ? "border-green-500/30" : ""}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(conn)}
                              <div>
                                <p className="font-medium text-foreground">{item.name}</p>
                                <p className="text-xs text-muted-foreground">{item.description}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            {getStatusBadge(conn)}
                            <div className="flex gap-1">
                              {conn?.status === "connected" ? (
                                <>
                                  <Button size="sm" variant="ghost"><RefreshCw className="h-3 w-3 mr-1" /> Sync</Button>
                                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDisconnect(conn.id)}>Disconnect</Button>
                                </>
                              ) : (
                                <Button size="sm" variant="outline" onClick={() => handleConnect(item.id, item.name)}>Connect</Button>
                              )}
                            </div>
                          </div>
                          {conn?.last_sync_at && (
                            <p className="text-[10px] text-muted-foreground mt-2">Last sync: {format(new Date(conn.last_sync_at), "dd MMM yyyy HH:mm")}</p>
                          )}
                          {conn?.error_log && (
                            <p className="text-[10px] text-destructive mt-1 truncate">{conn.error_log}</p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="guide" className="mt-4">
          <AdminIntegrationGuide />
        </TabsContent>
      </Tabs>

      {/* Connection Wizard */}
      <AdminIntegrationWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        platformId={wizardPlatform.id}
        platformName={wizardPlatform.name}
        onConnected={fetchConnections}
      />
    </div>
  );
};

export default AdminIntegrationsHub;
