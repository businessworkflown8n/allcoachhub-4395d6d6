import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, FunnelChart } from "recharts";
import { Video, Users, DollarSign, TrendingUp, Download, BarChart3, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const AdminWebinarAnalytics = () => {
  const [webinars, setWebinars] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [coachFilter, setCoachFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    const fetchAll = async () => {
      const [w, r, p] = await Promise.all([
        supabase.from("webinars").select("*").order("webinar_date", { ascending: false }),
        supabase.from("webinar_registrations").select("*"),
        supabase.from("profiles").select("user_id, full_name, email"),
      ]);
      setWebinars(w.data || []);
      setRegistrations(r.data || []);
      setProfiles(p.data || []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const coachName = (id: string) => profiles.find(p => p.user_id === id)?.full_name || "—";

  const coaches = useMemo(() => {
    const ids = [...new Set(webinars.map(w => w.coach_id))];
    return ids.map(id => ({ id, name: coachName(id) }));
  }, [webinars, profiles]);

  const filtered = useMemo(() => {
    return webinars.filter(w => {
      const matchCoach = coachFilter === "all" || w.coach_id === coachFilter;
      const matchType = typeFilter === "all" || (typeFilter === "paid" ? w.is_paid : !w.is_paid);
      return matchCoach && matchType;
    });
  }, [webinars, coachFilter, typeFilter]);

  const now = new Date();
  const totalRegs = filtered.reduce((s, w) => s + registrations.filter(r => r.webinar_id === w.id).length, 0);
  const totalAttended = filtered.reduce((s, w) => s + registrations.filter(r => r.webinar_id === w.id && r.attended).length, 0);
  const totalConverted = filtered.reduce((s, w) => s + registrations.filter(r => r.webinar_id === w.id && r.converted).length, 0);
  const totalRevenue = filtered.reduce((s, w) => {
    const wRegs = registrations.filter(r => r.webinar_id === w.id);
    return s + wRegs.reduce((rs: number, r: any) => rs + (r.amount_paid || 0), 0);
  }, 0);
  const avgAttendance = totalRegs > 0 ? Math.round((totalAttended / totalRegs) * 100) : 0;
  const conversionRate = totalRegs > 0 ? Math.round((totalConverted / totalRegs) * 100) : 0;

  // Coach performance table
  const coachPerformance = useMemo(() => {
    return coaches.map(c => {
      const cWebinars = filtered.filter(w => w.coach_id === c.id);
      const cRegs = registrations.filter(r => cWebinars.some(w => w.id === r.webinar_id));
      const attended = cRegs.filter(r => r.attended).length;
      const converted = cRegs.filter(r => r.converted).length;
      const revenue = cRegs.reduce((s: number, r: any) => s + (r.amount_paid || 0), 0);
      return {
        ...c,
        webinarCount: cWebinars.length,
        totalRegs: cRegs.length,
        attended,
        converted,
        revenue,
        attendanceRate: cRegs.length > 0 ? Math.round((attended / cRegs.length) * 100) : 0,
        conversionRate: cRegs.length > 0 ? Math.round((converted / cRegs.length) * 100) : 0,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [coaches, filtered, registrations]);

  // Monthly trend data
  const monthlyTrend = useMemo(() => {
    const months: Record<string, { month: string; webinars: number; registrations: number; revenue: number }> = {};
    filtered.forEach(w => {
      const m = w.webinar_date?.substring(0, 7);
      if (!m) return;
      if (!months[m]) months[m] = { month: m, webinars: 0, registrations: 0, revenue: 0 };
      months[m].webinars++;
      const wRegs = registrations.filter(r => r.webinar_id === w.id);
      months[m].registrations += wRegs.length;
      months[m].revenue += wRegs.reduce((s: number, r: any) => s + (r.amount_paid || 0), 0);
    });
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);
  }, [filtered, registrations]);

  // Top converting webinars
  const topWebinars = useMemo(() => {
    return filtered.map(w => {
      const wRegs = registrations.filter(r => r.webinar_id === w.id);
      return {
        ...w,
        coachName: coachName(w.coach_id),
        regCount: wRegs.length,
        attended: wRegs.filter(r => r.attended).length,
        converted: wRegs.filter(r => r.converted).length,
        revenue: wRegs.reduce((s: number, r: any) => s + (r.amount_paid || 0), 0),
        conversionRate: wRegs.length > 0 ? Math.round((wRegs.filter(r => r.converted).length / wRegs.length) * 100) : 0,
      };
    }).sort((a, b) => b.conversionRate - a.conversionRate).slice(0, 10);
  }, [filtered, registrations]);

  const exportCSV = () => {
    const headers = ["Title", "Coach", "Date", "Type", "Registrations", "Attended", "Attendance %", "Converted", "Conversion %", "Revenue"];
    const rows = topWebinars.map(w => [
      w.title, w.coachName, w.webinar_date, w.is_paid ? "Paid" : "Free",
      w.regCount, w.attended, w.regCount > 0 ? Math.round((w.attended / w.regCount) * 100) + "%" : "0%",
      w.converted, w.conversionRate + "%", w.revenue,
    ]);
    const csv = [headers, ...rows].map(r => r.map((v: any) => `"${v || ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "webinar_analytics.csv";
    a.click();
  };

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-foreground">Webinar Analytics</h2>
        <div className="flex gap-2">
          <Select value={coachFilter} onValueChange={setCoachFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Coaches" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Coaches</SelectItem>
              {coaches.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={exportCSV} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-6">
        {[
          { icon: Video, label: "Total Webinars", value: filtered.length, color: "text-primary" },
          { icon: Users, label: "Total Registrations", value: totalRegs, color: "text-blue-400" },
          { icon: Users, label: "Total Attended", value: totalAttended, color: "text-green-400" },
          { icon: TrendingUp, label: "Attendance Rate", value: `${avgAttendance}%`, color: "text-yellow-400" },
          { icon: Target, label: "Conversion Rate", value: `${conversionRate}%`, color: "text-purple-400" },
          { icon: DollarSign, label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, color: "text-emerald-400" },
        ].map((card, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <card.icon className={`h-4 w-4 ${card.color} mb-1`} />
            <p className="text-xl font-bold text-foreground">{card.value}</p>
            <p className="text-[11px] text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Conversion Funnel */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Conversion Funnel</h3>
        <div className="space-y-3">
          {[
            { label: "Registered", value: totalRegs, pct: 100, color: "bg-blue-500" },
            { label: "Attended", value: totalAttended, pct: avgAttendance, color: "bg-green-500" },
            { label: "Converted", value: totalConverted, pct: conversionRate, color: "bg-primary" },
          ].map((step, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{step.label}</span>
                <span>{step.value} ({step.pct}%)</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${step.color} transition-all`} style={{ width: `${step.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trend Chart */}
      {monthlyTrend.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }} />
              <Bar dataKey="webinars" fill="hsl(var(--primary))" name="Webinars" radius={[4, 4, 0, 0]} />
              <Bar dataKey="registrations" fill="#3b82f6" name="Registrations" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Coach Performance Table */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Coach-wise Performance</h3>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coach</TableHead>
                <TableHead>Webinars</TableHead>
                <TableHead>Registrations</TableHead>
                <TableHead>Attended</TableHead>
                <TableHead>Attendance %</TableHead>
                <TableHead>Converted</TableHead>
                <TableHead>Conversion %</TableHead>
                <TableHead>Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coachPerformance.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.webinarCount}</TableCell>
                  <TableCell className="text-muted-foreground">{c.totalRegs}</TableCell>
                  <TableCell className="text-muted-foreground">{c.attended}</TableCell>
                  <TableCell><span className={`rounded-full px-2 py-0.5 text-xs ${c.attendanceRate >= 35 ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>{c.attendanceRate}%</span></TableCell>
                  <TableCell className="text-muted-foreground">{c.converted}</TableCell>
                  <TableCell><span className={`rounded-full px-2 py-0.5 text-xs ${c.conversionRate >= 8 ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>{c.conversionRate}%</span></TableCell>
                  <TableCell className="font-medium text-foreground">₹{c.revenue.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Top Converting Webinars */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Top Converting Webinars</h3>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Coach</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Regs</TableHead>
                <TableHead>Attended</TableHead>
                <TableHead>Converted</TableHead>
                <TableHead>Conv %</TableHead>
                <TableHead>Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topWebinars.map(w => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium text-foreground max-w-[180px] truncate">{w.title}</TableCell>
                  <TableCell className="text-muted-foreground">{w.coachName}</TableCell>
                  <TableCell className="text-muted-foreground">{w.webinar_date}</TableCell>
                  <TableCell>{w.is_paid ? <span className="rounded-full px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400">Paid</span> : <span className="rounded-full px-2 py-0.5 text-xs bg-muted text-muted-foreground">Free</span>}</TableCell>
                  <TableCell className="text-muted-foreground">{w.regCount}</TableCell>
                  <TableCell className="text-muted-foreground">{w.attended}</TableCell>
                  <TableCell className="text-muted-foreground">{w.converted}</TableCell>
                  <TableCell><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${w.conversionRate >= 8 ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>{w.conversionRate}%</span></TableCell>
                  <TableCell className="font-medium text-foreground">₹{w.revenue.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AdminWebinarAnalytics;
