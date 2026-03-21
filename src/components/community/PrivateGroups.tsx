import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Lock, Globe, UserPlus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const PrivateGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("private_groups").select("*").eq("is_active", true).order("member_count", { ascending: false });
      setGroups(data || []);
      if (user) {
        const { data: mems } = await supabase.from("private_group_members").select("group_id, status").eq("user_id", user.id);
        const map: Record<string, string> = {};
        (mems || []).forEach((m: any) => { map[m.group_id] = m.status; });
        setMemberships(map);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const requestJoin = async (groupId: string, accessType: string) => {
    if (!user) return;
    if (accessType === "invite") { toast.info("This group is invite-only."); return; }
    const status = accessType === "open" ? "approved" : "pending";
    const { error } = await supabase.from("private_group_members").insert({ group_id: groupId, user_id: user.id, status });
    if (error) { toast.error("Failed to join"); return; }
    setMemberships(prev => ({ ...prev, [groupId]: status }));
    toast.success(status === "approved" ? "Joined group!" : "Join request sent!");
  };

  const accessIcons: Record<string, any> = { open: Globe, request: UserPlus, invite: Lock };
  const filtered = groups.filter(g => g.title.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Private Groups</h2>
          <p className="text-sm text-muted-foreground">Join focused communities for deeper learning and collaboration.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search groups..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {filtered.length === 0 && <Card><CardContent className="p-8 text-center text-muted-foreground">No groups found.</CardContent></Card>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(group => {
          const AccessIcon = accessIcons[group.access_type] || Globe;
          const membership = memberships[group.id];
          return (
            <Card key={group.id} className="transition-all hover:border-primary/30">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-xs capitalize"><AccessIcon className="mr-1 h-3 w-3" />{group.access_type}</Badge>
                </div>
                <h3 className="font-semibold text-foreground">{group.title}</h3>
                {group.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{group.description}</p>}
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />{group.member_count}/{group.max_members || "∞"} members
                </div>
                <div className="mt-4">
                  {membership === "approved" ? (
                    <Button size="sm" variant="outline" className="w-full" disabled>Joined</Button>
                  ) : membership === "pending" ? (
                    <Button size="sm" variant="outline" className="w-full" disabled>Request Pending</Button>
                  ) : (
                    <Button size="sm" className="w-full" onClick={() => requestJoin(group.id, group.access_type)}>
                      {group.access_type === "invite" ? "Invite Only" : group.access_type === "request" ? "Request to Join" : "Join Group"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PrivateGroups;
