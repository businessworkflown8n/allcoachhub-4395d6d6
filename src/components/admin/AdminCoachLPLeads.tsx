import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users, Mail, Phone, Loader2, TrendingUp, Calendar } from "lucide-react";
import { format } from "date-fns";

const AdminCoachLPLeads = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [websites, setWebsites] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [coachFilter, setCoachFilter] = useState("all");

  const fetchAll = async () => {
    setLoading(true);

    // Fetch leads that have a user_id (coach-attributed)
    const { data: leadsData } = await supabase
      .from("chatbot_leads")
      .select("*")
      .not("user_id", "is", null)
      .order("created_at", { ascending: false });
    setLeads(leadsData || []);

    if (leadsData && leadsData.length > 0) {
      const coachIds = [...new Set(leadsData.map((l) => l.user_id).filter(Boolean))];

      // Fetch profiles and websites in parallel
      const [profilesRes, websitesRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, email").in("user_id", coachIds),
        supabase.from("coach_websites").select("coach_id, institute_name, slug").in("coach_id", coachIds),
      ]);

      const pMap: Record<string, any> = {};
      profilesRes.data?.forEach((p) => (pMap[p.user_id] = p));
      setProfiles(pMap);

      const wMap: Record<string, any> = {};
      websitesRes.data?.forEach((w) => (wMap[w.coach_id] = w));
      setWebsites(wMap);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const coachOptions = [...new Set(leads.map((l) => l.user_id).filter(Boolean))];

  const filtered = leads.filter((l) => {
    if (coachFilter !== "all" && l.user_id !== coachFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.name?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.whatsapp?.includes(q) ||
        profiles[l.user_id]?.full_name?.toLowerCase().includes(q) ||
        websites[l.user_id]?.institute_name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Stats
  const totalLeads = leads.length;
  const uniqueCoaches = new Set(leads.map((l) => l.user_id).filter(Boolean)).size;
  const todayLeads = leads.filter(
    (l) => new Date(l.created_at).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" /> Coach Leads from Landing Pages
      </h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalLeads}</p>
              <p className="text-xs text-muted-foreground">Total Leads</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{uniqueCoaches}</p>
              <p className="text-xs text-muted-foreground">Coaches with Leads</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{todayLeads}</p>
              <p className="text-xs text-muted-foreground">Today's Leads</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, coach..."
            className="pl-9 w-[260px]"
          />
        </div>
        <select
          value={coachFilter}
          onChange={(e) => setCoachFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="all">All Coaches</option>
          {coachOptions.map((cid) => (
            <option key={cid} value={cid}>
              {profiles[cid]?.full_name || websites[cid]?.institute_name || cid}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No leads found.
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Coach / Institute</TableHead>
                <TableHead>Landing Page</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((lead) => {
                const coach = profiles[lead.user_id];
                const site = websites[lead.user_id];
                return (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium text-foreground">{lead.name}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" /> {lead.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" /> {lead.whatsapp}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-foreground">
                        {coach?.full_name || "Unknown"}
                      </div>
                      {site && (
                        <div className="text-xs text-muted-foreground">{site.institute_name}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {site ? (
                        <a
                          href={`/coach-website/${site.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          /coach-website/{site.slug}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(lead.created_at), "MMM d, yyyy h:mm a")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminCoachLPLeads;
