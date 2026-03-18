import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign } from "lucide-react";
import GlobalDateRangePicker, { useDateRange } from "@/components/shared/GlobalDateRangePicker";

const AdminRevenue = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { dateRange, setDateRange, dateFrom, dateTo } = useDateRange("last30");

  useEffect(() => {
    supabase.from("payments").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setPayments(data || []);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return payments.filter(p => {
      const d = p.created_at?.slice(0, 10);
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
    });
  }, [payments, dateFrom, dateTo]);

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  const totalRevenue = filtered.reduce((s, p) => s + Number(p.amount), 0);
  const totalCommission = filtered.reduce((s, p) => s + Number(p.platform_commission), 0);
  const totalCoachPay = filtered.reduce((s, p) => s + Number(p.coach_earning), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-bold text-foreground">Revenue</h2>
        <GlobalDateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <DollarSign className="h-6 w-6 text-green-400 mb-3" />
          <p className="text-3xl font-bold text-foreground">${totalRevenue.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">Total Revenue</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-3xl font-bold text-foreground">${totalCommission.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">Platform Commission</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-3xl font-bold text-foreground">${totalCoachPay.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">Coach Payouts</p>
        </div>
      </div>

      {filtered.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Recent Transactions</h3>
          {filtered.slice(0, 20).map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
              <span className="text-sm text-foreground">${Number(p.amount).toFixed(2)} {p.currency}</span>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${p.status === "paid" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>{p.status}</span>
                <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminRevenue;
