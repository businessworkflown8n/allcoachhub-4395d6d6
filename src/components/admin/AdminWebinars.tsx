import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Video, Search, Download, Eye, Users, Calendar, ChevronLeft } from "lucide-react";

const AdminWebinars = () => {
  const [webinars, setWebinars] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [coachFilter, setCoachFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedWebinar, setSelectedWebinar] = useState<any>(null);
  const [regProfiles, setRegProfiles] = useState<any[]>([]);

  const fetchAll = async () => {
    const [w, r, p] = await Promise.all([
      supabase.from("webinars").select("*").order("webinar_date", { ascending: false }),
      supabase.from("webinar_registrations").select("*"),
      supabase.from("profiles").select("user_id, full_name, email, contact_number"),
    ]);
    setWebinars(w.data || []);
    setRegistrations(r.data || []);
    setProfiles(p.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const coachName = (id: string) => profiles.find(p => p.user_id === id)?.full_name || "—";
  const regCount = (wId: string) => registrations.filter(r => r.webinar_id === wId).length;

  const coaches = useMemo(() => {
    const ids = [...new Set(webinars.map(w => w.coach_id))];
    return ids.map(id => ({ id, name: coachName(id) }));
  }, [webinars, profiles]);

  const filtered = useMemo(() => {
    return webinars.filter(w => {
      const matchSearch = !search || [w.title, coachName(w.coach_id)].some(v => v?.toLowerCase().includes(search.toLowerCase()));
      const matchCoach = coachFilter === "all" || w.coach_id === coachFilter;
      const matchFrom = !dateFrom || w.webinar_date >= dateFrom;
      const matchTo = !dateTo || w.webinar_date <= dateTo;
      return matchSearch && matchCoach && matchFrom && matchTo;
    });
  }, [webinars, search, coachFilter, dateFrom, dateTo, profiles]);

  const updateLinkStatus = async (webinarId: string, status: string) => {
    const { error } = await supabase.from("webinars").update({ webinar_link_status: status } as any).eq("id", webinarId);
    if (error) return;
    setWebinars(prev => prev.map(w => w.id === webinarId ? { ...w, webinar_link_status: status } : w));
  };

  const viewRegistrants = async (webinar: any) => {
    setSelectedWebinar(webinar);
    const regs = registrations.filter(r => r.webinar_id === webinar.id);
    const ids = regs.map(r => r.learner_id);
    if (ids.length > 0) {
      const { data } = await supabase.from("profiles").select("user_id, full_name, email, contact_number").in("user_id", ids);
      setRegProfiles(data || []);
    } else {
      setRegProfiles([]);
    }
  };

  const exportWebinarsCSV = () => {
    const headers = ["Title", "Coach", "Date", "Time", "Duration (min)", "Registrations", "Status", "Created"];
    const rows = filtered.map(w => [
      w.title, coachName(w.coach_id), w.webinar_date, w.webinar_time, w.duration_minutes, regCount(w.id),
      new Date(`${w.webinar_date}T${w.webinar_time}`) > new Date() ? "Upcoming" : "Past",
      new Date(w.created_at).toLocaleDateString()
    ]);
    downloadCSV([headers, ...rows], "webinars_report.csv");
  };

  const exportRegistrantsCSV = () => {
    if (!selectedWebinar) return;
    const regs = registrations.filter(r => r.webinar_id === selectedWebinar.id);
    const headers = ["Learner Name", "Email", "Phone", "Registered At"];
    const rows = regs.map(r => {
      const p = regProfiles.find(pr => pr.user_id === r.learner_id);
      return [p?.full_name || "—", p?.email || "—", p?.contact_number || "—", new Date(r.registered_at).toLocaleDateString()];
    });
    downloadCSV([headers, ...rows], `${selectedWebinar.title}-registrants.csv`);
  };

  const downloadCSV = (data: any[][], filename: string) => {
    const csv = data.map(r => r.map((v: any) => `"${v || ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  };

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  // Registrant detail view
  if (selectedWebinar) {
    const regs = registrations.filter(r => r.webinar_id === selectedWebinar.id);
    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedWebinar(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /> Back to Webinars</button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">{selectedWebinar.title}</h2>
            <p className="text-sm text-muted-foreground">Coach: {coachName(selectedWebinar.coach_id)} • {selectedWebinar.webinar_date} at {selectedWebinar.webinar_time}</p>
          </div>
          <button onClick={exportRegistrantsCSV} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-primary transition-colors">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4"><p className="text-2xl font-bold text-foreground">{regs.length}</p><p className="text-xs text-muted-foreground">Total Registrations</p></div>
          <div className="rounded-xl border border-border bg-card p-4"><p className="text-2xl font-bold text-foreground">{selectedWebinar.duration_minutes} min</p><p className="text-xs text-muted-foreground">Duration</p></div>
          <div className="rounded-xl border border-border bg-card p-4"><p className="text-2xl font-bold text-foreground">{new Date(`${selectedWebinar.webinar_date}T${selectedWebinar.webinar_time}`) > new Date() ? "Upcoming" : "Past"}</p><p className="text-xs text-muted-foreground">Status</p></div>
        </div>
        {regProfiles.length > 0 ? (
          <div className="rounded-xl border border-border overflow-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Registered</TableHead></TableRow></TableHeader>
              <TableBody>
                {regs.map(r => {
                  const p = regProfiles.find(pr => pr.user_id === r.learner_id);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-foreground font-medium">{p?.full_name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{p?.email || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{p?.contact_number || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{new Date(r.registered_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : <p className="text-sm text-muted-foreground text-center py-8">No registrations yet</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-foreground">Webinar Management</h2>
        <button onClick={exportWebinarsCSV} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-primary transition-colors">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-secondary border-border w-48" />
        </div>
        <select value={coachFilter} onChange={e => setCoachFilter(e.target.value)} className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground">
          <option value="all">All Coaches</option>
          {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-secondary border-border w-40" placeholder="From" />
        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-secondary border-border w-40" placeholder="To" />
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4"><Video className="h-5 w-5 text-primary mb-2" /><p className="text-2xl font-bold text-foreground">{filtered.length}</p><p className="text-xs text-muted-foreground">Total Webinars</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><Users className="h-5 w-5 text-blue-400 mb-2" /><p className="text-2xl font-bold text-foreground">{filtered.reduce((s, w) => s + regCount(w.id), 0)}</p><p className="text-xs text-muted-foreground">Total Registrations</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><Calendar className="h-5 w-5 text-green-400 mb-2" /><p className="text-2xl font-bold text-foreground">{filtered.filter(w => new Date(`${w.webinar_date}T${w.webinar_time}`) > new Date()).length}</p><p className="text-xs text-muted-foreground">Upcoming</p></div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16"><Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No webinars found</p></div>
      ) : (
        <div className="rounded-xl border border-border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Coach</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Registrations</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Link Approval</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(w => (
                <TableRow key={w.id}>
                  <TableCell className="text-foreground font-medium max-w-[200px] truncate">{w.title}</TableCell>
                  <TableCell className="text-muted-foreground">{coachName(w.coach_id)}</TableCell>
                  <TableCell className="text-muted-foreground">{w.webinar_date}</TableCell>
                  <TableCell className="text-muted-foreground">{w.webinar_time}</TableCell>
                  <TableCell className="text-muted-foreground">{w.duration_minutes} min</TableCell>
                  <TableCell className="text-foreground font-medium">{regCount(w.id)}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${new Date(`${w.webinar_date}T${w.webinar_time}`) > new Date() ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}`}>
                      {new Date(`${w.webinar_date}T${w.webinar_time}`) > new Date() ? "Upcoming" : "Past"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {w.webinar_link_status === "approved" ? (
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-500/20 text-green-400">Approved</span>
                      ) : w.webinar_link_status === "rejected" ? (
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-destructive/20 text-destructive">Rejected</span>
                      ) : (
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-500/20 text-yellow-400">Pending</span>
                      )}
                      {w.webinar_link_status !== "approved" && (
                        <button onClick={() => updateLinkStatus(w.id, "approved")} className="rounded p-1 text-green-400 hover:bg-green-500/10 text-xs font-medium" title="Approve">✓</button>
                      )}
                      {w.webinar_link_status !== "rejected" && (
                        <button onClick={() => updateLinkStatus(w.id, "rejected")} className="rounded p-1 text-destructive hover:bg-destructive/10 text-xs font-medium" title="Reject">✗</button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <button onClick={() => viewRegistrants(w)} className="rounded p-1 text-primary hover:bg-primary/10"><Eye className="h-4 w-4" /></button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminWebinars;
