import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { MessageCircle, Search, Users } from "lucide-react";

interface CoachAccess {
  user_id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  daily_message_limit: number;
  monthly_campaign_credits: number;
}

const AdminWhatsAppAccess = () => {
  const [coaches, setCoaches] = useState<CoachAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCoaches = async () => {
    setLoading(true);
    // Get all coaches
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, email");

    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "coach");

    const coachIds = new Set((roles || []).map((r) => r.user_id));

    const { data: accessRows } = await supabase
      .from("whatsapp_access")
      .select("coach_id, is_active, daily_message_limit, monthly_campaign_credits");

    const accessMap = new Map(
      (accessRows || []).map((a) => [a.coach_id, a])
    );

    const list: CoachAccess[] = (profiles || [])
      .filter((p) => coachIds.has(p.user_id))
      .map((p) => {
        const access = accessMap.get(p.user_id);
        return {
          user_id: p.user_id,
          full_name: p.full_name || "Unknown",
          email: p.email || "",
          is_active: access?.is_active ?? false,
          daily_message_limit: access?.daily_message_limit ?? 1000,
          monthly_campaign_credits: access?.monthly_campaign_credits ?? 10,
        };
      });

    setCoaches(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchCoaches();
  }, []);

  const toggleAccess = async (coachId: string, currentActive: boolean) => {
    const newActive = !currentActive;
    const { data: existing } = await supabase
      .from("whatsapp_access")
      .select("id")
      .eq("coach_id", coachId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("whatsapp_access")
        .update({ is_active: newActive, updated_at: new Date().toISOString() })
        .eq("coach_id", coachId);
    } else {
      await supabase
        .from("whatsapp_access")
        .insert({ coach_id: coachId, is_active: newActive });
    }

    setCoaches((prev) =>
      prev.map((c) =>
        c.user_id === coachId ? { ...c, is_active: newActive } : c
      )
    );

    toast({
      title: newActive ? "WhatsApp Access Enabled" : "WhatsApp Access Disabled",
      description: `Access ${newActive ? "granted" : "revoked"} successfully.`,
    });
  };

  const filtered = coaches.filter(
    (c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = coaches.filter((c) => c.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageCircle className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold text-foreground">WhatsApp Access Control</h2>
          <p className="text-sm text-muted-foreground">Enable or disable WhatsApp Campaign Dashboard for coaches</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold text-foreground">{coaches.length}</p>
                <p className="text-sm text-muted-foreground">Total Coaches</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-primary">{activeCount}</p>
                <p className="text-sm text-muted-foreground">Access Enabled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold text-foreground">{coaches.length - activeCount}</p>
                <p className="text-sm text-muted-foreground">Access Disabled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <CardTitle className="text-foreground">Coach WhatsApp Access</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search coaches..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading coaches...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coach Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>WhatsApp Access</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((coach) => (
                    <TableRow key={coach.user_id}>
                      <TableCell className="font-medium text-foreground">{coach.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{coach.email}</TableCell>
                      <TableCell>
                        <Switch
                          checked={coach.is_active}
                          onCheckedChange={() => toggleAccess(coach.user_id, coach.is_active)}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant={coach.is_active ? "default" : "secondary"}>
                          {coach.is_active ? "Active" : "Disabled"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No coaches found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWhatsAppAccess;
