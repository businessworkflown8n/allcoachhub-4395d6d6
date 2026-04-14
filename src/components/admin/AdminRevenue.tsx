import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GlobalDateRangePicker, { useDateRange } from "@/components/shared/GlobalDateRangePicker";
import {
  DollarSign, Users, TrendingUp, Download, Search, Eye,
  CheckCircle, Clock, AlertCircle, CreditCard, PieChart
} from "lucide-react";

const AdminRevenue = () => {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [payoutFilter, setPayoutFilter] = useState("all");
  const [coachFilter, setCoachFilter] = useState("all");
  const [selectedCoach, setSelectedCoach] = useState<string | null>(null);
  const { dateRange, setDateRange, dateFrom, dateTo } = useDateRange("last30");

  useEffect(() => {
    const fetch = async () => {
      const [e, p, po, t, pr, c, cm] = await Promise.all([
        supabase.from("enrollments").select("*").order("enrolled_at", { ascending: false }),
        supabase.from("payments").select("*").order("created_at", { ascending: false }),
        supabase.from("payouts").select("*").order("requested_at", { ascending: false }),
        supabase.from("transactions").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("user_id, full_name, email"),
        supabase.from("courses").select("id, title, coach_id, price_usd, price_inr"),
        supabase.from("coach_commissions").select("*"),
      ]);
      setEnrollments(e.data || []);
      setPayments(p.data || []);
      setPayouts(po.data || []);
      setTransactions(t.data || []);
      setProfiles(pr.data || []);
      setCourses(c.data || []);
      setCommissions(cm.data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const getName = (id: string) => profiles.find(p => p.user_id === id)?.full_name || "—";
  const getEmail = (id: string) => profiles.find(p => p.user_id === id)?.email || "—";
  const getCourseName = (id: string) => courses.find(c => c.id === id)?.title || "—";
  const getCommRate = (coachId: string) => {
    const c = commissions.find(x => x.coach_id === coachId);
    return c ? c.commission_percent : 10;
  };

  const filteredEnrollments = useMemo(() => {
    return enrollments.filter(e => {
      const d = e.enrolled_at?.slice(0, 10);
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      if (paymentFilter !== "all" && e.payment_status !== paymentFilter) return false;
      if (coachFilter !== "all" && e.coach_id !== coachFilter) return false;
      return true;
    });
  }, [enrollments, dateFrom, dateTo, paymentFilter, coachFilter]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const d = p.created_at?.slice(0, 10);
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      if (coachFilter !== "all" && p.coach_id !== coachFilter) return false;
      return true;
    });
  }, [payments, dateFrom, dateTo, coachFilter]);

  // Coach-wise aggregation
  const coachData = useMemo(() => {
    const coachIds = [...new Set(filteredEnrollments.map(e => e.coach_id))];
    return coachIds.map(cid => {
      const ce = filteredEnrollments.filter(e => e.coach_id === cid);
      const cp = filteredPayments.filter(p => p.coach_id === cid);
      const totalRevenue = ce.reduce((s, e) => s + Number(e.amount_paid || 0), 0);
      const paidEnrollments = ce.filter(e => e.payment_status === "paid");
      const totalPaid = paidEnrollments.reduce((s, e) => s + Number(e.amount_paid || 0), 0);
      const totalPending = totalRevenue - totalPaid;
      const commRate = getCommRate(cid);
      const commission = totalPaid * (commRate / 100);
      const netEarnings = totalPaid - commission;
      const coachPayouts = payouts.filter(p => p.coach_id === cid);
      const totalPaidOut = coachPayouts.filter(p => p.status === "processed").reduce((s, p) => s + Number(p.amount), 0);
      return {
        coach_id: cid,
        name: getName(cid),
        email: getEmail(cid),
        totalEnrollments: ce.length,
        totalRevenue,
        totalPaid,
        totalPending,
        commRate,
        commission,
        netEarnings,
        totalPaidOut,
        payoutStatus: totalPaidOut >= netEarnings ? "Settled" : totalPaidOut > 0 ? "Partial" : "Pending",
      };
    }).filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()))
      .filter(c => payoutFilter === "all" || c.payoutStatus.toLowerCase() === payoutFilter);
  }, [filteredEnrollments, filteredPayments, payouts, profiles, commissions, search, payoutFilter]);

  // Summary
  const summary = useMemo(() => {
    const totalCoaches = coachData.length;
    const totalEnrollments = coachData.reduce((s, c) => s + c.totalEnrollments, 0);
    const totalRevenue = coachData.reduce((s, c) => s + c.totalRevenue, 0);
    const totalPaid = coachData.reduce((s, c) => s + c.totalPaid, 0);
    const totalPending = coachData.reduce((s, c) => s + c.totalPending, 0);
    const totalCommission = coachData.reduce((s, c) => s + c.commission, 0);
    const totalPaidOut = coachData.reduce((s, c) => s + c.totalPaidOut, 0);
    return { totalCoaches, totalEnrollments, totalRevenue, totalPaid, totalPending, totalCommission, totalPaidOut };
  }, [coachData]);

  // Chart data: revenue by date
  const revenueByDate = useMemo(() => {
    const map: Record<string, { paid: number; pending: number }> = {};
    filteredEnrollments.forEach(e => {
      const d = e.enrolled_at?.slice(0, 10);
      if (!d) return;
      if (!map[d]) map[d] = { paid: 0, pending: 0 };
      if (e.payment_status === "paid") map[d].paid += Number(e.amount_paid || 0);
      else map[d].pending += Number(e.amount_paid || 0);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-30);
  }, [filteredEnrollments]);

  const maxRevenue = Math.max(...revenueByDate.map(([, v]) => v.paid + v.pending), 1);

  // Selected coach detail
  const selectedCoachData = useMemo(() => {
    if (!selectedCoach) return null;
    return coachData.find(c => c.coach_id === selectedCoach) || null;
  }, [selectedCoach, coachData]);

  const coachEnrollments = useMemo(() => {
    if (!selectedCoach) return [];
    return filteredEnrollments.filter(e => e.coach_id === selectedCoach);
  }, [selectedCoach, filteredEnrollments]);

  const coachTransactions = useMemo(() => {
    if (!selectedCoach) return [];
    return transactions.filter(t => t.coach_id === selectedCoach);
  }, [selectedCoach, transactions]);

  const exportCSV = () => {
    const headers = ["Coach Name", "Email", "Total Enrollments", "Total Revenue", "Paid", "Pending", "Commission %", "Commission", "Net Earnings", "Paid Out", "Payout Status"];
    const rows = coachData.map(c => [
      c.name, c.email, c.totalEnrollments, c.totalRevenue.toFixed(2), c.totalPaid.toFixed(2),
      c.totalPending.toFixed(2), c.commRate, c.commission.toFixed(2), c.netEarnings.toFixed(2),
      c.totalPaidOut.toFixed(2), c.payoutStatus,
    ]);
    const csv = [headers, ...rows].map(r => r.map((v: any) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `revenue_report_${dateFrom || "all"}_${dateTo || "all"}.csv`;
    a.click();
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );

  const summaryCards = [
    { label: "Total Coaches", value: summary.totalCoaches, icon: Users, color: "text-primary" },
    { label: "Total Enrollments", value: summary.totalEnrollments, icon: TrendingUp, color: "text-blue-400" },
    { label: "Total Revenue", value: `$${summary.totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-green-400" },
    { label: "Total Paid", value: `$${summary.totalPaid.toFixed(2)}`, icon: CheckCircle, color: "text-emerald-400" },
    { label: "Total Pending", value: `$${summary.totalPending.toFixed(2)}`, icon: Clock, color: "text-yellow-400" },
    { label: "Total Commission", value: `$${summary.totalCommission.toFixed(2)}`, icon: PieChart, color: "text-purple-400" },
    { label: "Total Payout Done", value: `$${summary.totalPaidOut.toFixed(2)}`, icon: CreditCard, color: "text-cyan-400" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground tracking-tight">Revenue Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Complete revenue analytics with coach-wise breakdown</p>
        </div>
        <div className="flex items-center gap-3">
          <GlobalDateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
          <button onClick={exportCSV} className="inline-flex items-center gap-1.5 rounded-xl border border-border/50 bg-secondary/80 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all cursor-pointer">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {summaryCards.map(card => (
          <div key={card.label} className="rounded-2xl border border-border/50 bg-card p-4 flex flex-col gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <card.icon className={`h-4.5 w-4.5 ${card.color}`} />
            </div>
            <p className="text-xl font-bold text-foreground tracking-tight">{card.value}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      {revenueByDate.length > 0 && (
        <div className="rounded-2xl border border-border/50 bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Revenue Over Time (Last 30 Days)</h3>
          <div className="flex items-end gap-[2px] h-40">
            {revenueByDate.map(([date, val]) => {
              const paidH = (val.paid / maxRevenue) * 100;
              const pendH = (val.pending / maxRevenue) * 100;
              return (
                <div key={date} className="flex-1 flex flex-col justify-end items-center group relative min-w-0">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-card border border-border rounded-lg px-2 py-1 text-[10px] text-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {date}: ${(val.paid + val.pending).toFixed(0)}
                  </div>
                  {pendH > 0 && <div className="w-full rounded-t bg-yellow-500/40" style={{ height: `${pendH}%`, minHeight: pendH > 0 ? 2 : 0 }} />}
                  <div className="w-full rounded-t bg-emerald-500" style={{ height: `${paidH}%`, minHeight: paidH > 0 ? 2 : 0 }} />
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Paid</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-500/40" /> Pending</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search coach..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-secondary/50 border-border/50 w-52 h-10 rounded-xl text-sm" />
        </div>
        <select value={coachFilter} onChange={e => setCoachFilter(e.target.value)} className="rounded-xl border border-border/50 bg-secondary/50 px-3 py-2 text-sm text-foreground h-10">
          <option value="all">All Coaches</option>
          {[...new Set(enrollments.map(e => e.coach_id))].map(id => (
            <option key={id} value={id}>{getName(id)}</option>
          ))}
        </select>
        <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} className="rounded-xl border border-border/50 bg-secondary/50 px-3 py-2 text-sm text-foreground h-10">
          <option value="all">All Payments</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="pending">Pending</option>
        </select>
        <select value={payoutFilter} onChange={e => setPayoutFilter(e.target.value)} className="rounded-xl border border-border/50 bg-secondary/50 px-3 py-2 text-sm text-foreground h-10">
          <option value="all">All Payouts</option>
          <option value="settled">Settled</option>
          <option value="partial">Partial</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Coach Table */}
      {coachData.length === 0 ? (
        <div className="rounded-2xl border border-border/50 bg-card text-center py-20">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No revenue data found</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Coach</TableHead>
              <TableHead className="text-center">Enrollments</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Pending</TableHead>
              <TableHead className="text-center">Comm %</TableHead>
              <TableHead className="text-right">Commission</TableHead>
              <TableHead className="text-right">Net Earnings</TableHead>
              <TableHead className="text-center">Payout</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coachData.map(c => (
              <TableRow key={c.coach_id}>
                <TableCell>
                  <div>
                    <p className="text-foreground font-medium text-sm">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground">{c.email}</p>
                  </div>
                </TableCell>
                <TableCell className="text-center text-foreground font-medium">{c.totalEnrollments}</TableCell>
                <TableCell className="text-right text-foreground font-medium tabular-nums">${c.totalRevenue.toFixed(2)}</TableCell>
                <TableCell className="text-right text-emerald-400 font-medium tabular-nums">${c.totalPaid.toFixed(2)}</TableCell>
                <TableCell className="text-right text-yellow-400 font-medium tabular-nums">${c.totalPending.toFixed(2)}</TableCell>
                <TableCell className="text-center text-muted-foreground">{c.commRate}%</TableCell>
                <TableCell className="text-right text-purple-400 font-medium tabular-nums">${c.commission.toFixed(2)}</TableCell>
                <TableCell className="text-right text-foreground font-bold tabular-nums">${c.netEarnings.toFixed(2)}</TableCell>
                <TableCell className="text-center">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    c.payoutStatus === "Settled" ? "bg-green-500/15 text-green-400" :
                    c.payoutStatus === "Partial" ? "bg-yellow-500/15 text-yellow-400" :
                    "bg-red-500/15 text-red-400"
                  }`}>{c.payoutStatus}</span>
                </TableCell>
                <TableCell className="text-center">
                  <button onClick={() => setSelectedCoach(c.coach_id)} className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs text-primary hover:bg-primary/20 transition-colors">
                    <Eye className="h-3 w-3" /> Details
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Paid vs Pending Pie */}
      {summary.totalRevenue > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/50 bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Paid vs Pending</h3>
            <div className="flex items-center gap-6">
              <div className="relative h-28 w-28">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-yellow-500/30" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-emerald-500" strokeWidth="3"
                    strokeDasharray={`${(summary.totalPaid / summary.totalRevenue) * 100} ${100 - (summary.totalPaid / summary.totalRevenue) * 100}`} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
                  {((summary.totalPaid / summary.totalRevenue) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Paid: ${summary.totalPaid.toFixed(2)}</p>
                <p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-yellow-500/40" /> Pending: ${summary.totalPending.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Commission Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Gross Revenue</span><span className="text-foreground font-medium">${summary.totalPaid.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Platform Commission</span><span className="text-purple-400 font-medium">- ${summary.totalCommission.toFixed(2)}</span></div>
              <div className="h-px bg-border/50" />
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Coach Net Earnings</span><span className="text-foreground font-bold">${(summary.totalPaid - summary.totalCommission).toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Already Paid Out</span><span className="text-cyan-400 font-medium">${summary.totalPaidOut.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Coach Detail Modal */}
      <Dialog open={!!selectedCoach} onOpenChange={() => setSelectedCoach(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">{selectedCoachData?.name} — Revenue Details</DialogTitle>
          </DialogHeader>
          {selectedCoachData && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                {[
                  { label: "Learners", value: coachEnrollments.length },
                  { label: "Revenue", value: `$${selectedCoachData.totalRevenue.toFixed(2)}` },
                  { label: "Paid", value: `$${selectedCoachData.totalPaid.toFixed(2)}` },
                  { label: "Pending", value: `$${selectedCoachData.totalPending.toFixed(2)}` },
                ].map(s => (
                  <div key={s.label} className="rounded-xl border border-border/50 bg-secondary/30 p-3 text-center">
                    <p className="text-lg font-bold text-foreground">{s.value}</p>
                    <p className="text-[11px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              <Tabs defaultValue="learners" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="learners" className="flex-1">Learners</TabsTrigger>
                  <TabsTrigger value="transactions" className="flex-1">Transactions</TabsTrigger>
                </TabsList>

                <TabsContent value="learners">
                  {coachEnrollments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No enrollments found</p>
                  ) : (
                    <div className="overflow-auto max-h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Learner</TableHead>
                            <TableHead>Course</TableHead>
                            <TableHead className="text-right">Paid</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {coachEnrollments.map(e => (
                            <TableRow key={e.id}>
                              <TableCell>
                                <div>
                                  <p className="text-foreground text-sm font-medium">{e.full_name}</p>
                                  <p className="text-[11px] text-muted-foreground">{e.email}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm max-w-[150px] truncate">{getCourseName(e.course_id)}</TableCell>
                              <TableCell className="text-right text-foreground font-medium tabular-nums">${Number(e.amount_paid || 0).toFixed(2)}</TableCell>
                              <TableCell className="text-center">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                  e.payment_status === "paid" ? "bg-green-500/15 text-green-400" :
                                  e.payment_status === "partial" ? "bg-yellow-500/15 text-yellow-400" :
                                  "bg-red-500/15 text-red-400"
                                }`}>{e.payment_status}</span>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">{new Date(e.enrolled_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="transactions">
                  {coachTransactions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No transactions found</p>
                  ) : (
                    <div className="overflow-auto max-h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {coachTransactions.map(t => (
                            <TableRow key={t.id}>
                              <TableCell className="text-muted-foreground text-sm">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                              <TableCell className="text-right text-foreground font-medium tabular-nums">${Number(t.amount).toFixed(2)} {t.currency}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">{t.payment_method || "—"}</TableCell>
                              <TableCell className="text-center">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                  t.status === "completed" ? "bg-green-500/15 text-green-400" :
                                  t.status === "pending" ? "bg-yellow-500/15 text-yellow-400" :
                                  "bg-red-500/15 text-red-400"
                                }`}>{t.status}</span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRevenue;
