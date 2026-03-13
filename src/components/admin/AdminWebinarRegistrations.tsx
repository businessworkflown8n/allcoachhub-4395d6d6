import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, Search, Download, Video, Calendar } from "lucide-react";
import { format } from "date-fns";

const AdminWebinarRegistrations = () => {
  const { user, loading: authLoading } = useAuth();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [webinars, setWebinars] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [coachFilter, setCoachFilter] = useState("all");
  const [webinarFilter, setWebinarFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (authLoading || !user) return;
    const fetch = async () => {
      const [r, w, p] = await Promise.all([
        supabase.from("webinar_registrations").select("*").order("registered_at", { ascending: false }),
        supabase.from("webinars").select("*"),
        supabase.from("profiles").select("user_id, full_name, email, contact_number"),
      ]);
      setRegistrations(r.data || []);
      setWebinars(w.data || []);
      setProfiles(p.data || []);
      setLoading(false);
    };
    fetch();
  }, [authLoading, user]);

  const coachName = (id: string) => profiles.find(p => p.user_id === id)?.full_name || "—";
  const webinarTitle = (id: string) => webinars.find(w => w.id === id)?.title || "—";
  const webinarCoachId = (wId: string) => webinars.find(w => w.id === wId)?.coach_id || "";

  const coaches = useMemo(() => {
    const ids = [...new Set(webinars.map(w => w.coach_id))];
    return ids.map(id => ({ id, name: coachName(id) }));
  }, [webinars, profiles]);

  const filteredRegs = useMemo(() => {
    return registrations.filter(r => {
      const profile = profiles.find(p => p.user_id === r.learner_id);
      const name = r.registrant_name || profile?.full_name || "";
      const email = r.registrant_email || profile?.email || "";
      const wTitle = webinarTitle(r.webinar_id);
      const cName = coachName(webinarCoachId(r.webinar_id));

      const matchSearch = !search || [name, email, wTitle, cName].some(v => v?.toLowerCase().includes(search.toLowerCase()));
      const matchCoach = coachFilter === "all" || webinarCoachId(r.webinar_id) === coachFilter;
      const matchWebinar = webinarFilter === "all" || r.webinar_id === webinarFilter;
      const regDate = r.registered_at?.split("T")[0] || "";
      const matchFrom = !dateFrom || regDate >= dateFrom;
      const matchTo = !dateTo || regDate <= dateTo;
      return matchSearch && matchCoach && matchWebinar && matchFrom && matchTo;
    });
  }, [registrations, search, coachFilter, webinarFilter, dateFrom, dateTo, profiles, webinars]);

  // Stats
  const totalRegs = filteredRegs.length;
  const uniqueWebinars = new Set(filteredRegs.map(r => r.webinar_id)).size;
  const uniqueCoaches = new Set(filteredRegs.map(r => webinarCoachId(r.webinar_id))).size;

  // Per-webinar summary
  const webinarSummary = useMemo(() => {
    const map = new Map<string, number>();
    filteredRegs.forEach(r => map.set(r.webinar_id, (map.get(r.webinar_id) || 0) + 1));
    return Array.from(map.entries())
      .map(([wId, count]) => ({ id: wId, title: webinarTitle(wId), coach: coachName(webinarCoachId(wId)), count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredRegs, webinars, profiles]);

  const exportCSV = () => {
    const headers = ["Registrant Name", "Email", "Phone", "Webinar", "Coach", "Registration Date"];
    const rows = filteredRegs.map(r => {
      const profile = profiles.find(p => p.user_id === r.learner_id);
      return [
        r.registrant_name || profile?.full_name || "—",
        r.registrant_email || profile?.email || "—",
        r.registrant_phone || profile?.contact_number || "—",
        webinarTitle(r.webinar_id),
        coachName(webinarCoachId(r.webinar_id)),
        r.registered_at ? format(new Date(r.registered_at), "yyyy-MM-dd HH:mm") : "—",
      ];
    });
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "webinar_registrations.csv";
    a.click();
  };

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-foreground">Webinar Registrations</h2>
        <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name, email, webinar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-secondary border-border w-56" />
        </div>
        <select value={coachFilter} onChange={e => setCoachFilter(e.target.value)} className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground">
          <option value="all">All Coaches</option>
          {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={webinarFilter} onChange={e => setWebinarFilter(e.target.value)} className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground">
          <option value="all">All Webinars</option>
          {webinars.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
        </select>
        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-secondary border-border w-40" />
        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-secondary border-border w-40" />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <Users className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-bold text-foreground">{totalRegs}</p>
          <p className="text-xs text-muted-foreground">Total Registrations</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <Video className="h-5 w-5 text-blue-400 mb-2" />
          <p className="text-2xl font-bold text-foreground">{uniqueWebinars}</p>
          <p className="text-xs text-muted-foreground">Webinars with Registrations</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <Calendar className="h-5 w-5 text-green-400 mb-2" />
          <p className="text-2xl font-bold text-foreground">{uniqueCoaches}</p>
          <p className="text-xs text-muted-foreground">Coaches with Registrations</p>
        </div>
      </div>

      {/* Per-Webinar Summary */}
      {webinarSummary.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <h3 className="text-sm font-semibold text-foreground mb-3">Registrations Per Webinar</h3>
          {webinarSummary.map(ws => (
            <div key={ws.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{ws.title}</p>
                <p className="text-xs text-muted-foreground">Coach: {ws.coach}</p>
              </div>
              <span className="rounded-full bg-primary/20 text-primary px-3 py-0.5 text-sm font-bold">{ws.count} Registrations</span>
            </div>
          ))}
        </div>
      )}

      {/* Full Registration List */}
      {filteredRegs.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No registrations found</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Webinar</TableHead>
                <TableHead>Coach</TableHead>
                <TableHead>Registered At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegs.map(r => {
                const profile = profiles.find(p => p.user_id === r.learner_id);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-foreground font-medium">{r.registrant_name || profile?.full_name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{r.registrant_email || profile?.email || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{r.registrant_phone || profile?.contact_number || "—"}</TableCell>
                    <TableCell className="text-foreground">{webinarTitle(r.webinar_id)}</TableCell>
                    <TableCell className="text-muted-foreground">{coachName(webinarCoachId(r.webinar_id))}</TableCell>
                    <TableCell className="text-muted-foreground">{r.registered_at ? format(new Date(r.registered_at), "MMM d, yyyy HH:mm") : "—"}</TableCell>
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

export default AdminWebinarRegistrations;
