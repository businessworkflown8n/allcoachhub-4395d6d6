import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign } from "lucide-react";

const AdminRevenue = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("payments").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setPayments(data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalCommission = payments.reduce((s, p) => s + Number(p.platform_commission), 0);
  const totalCoachPay = payments.reduce((s, p) => s + Number(p.coach_earning), 0);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Revenue</h2>
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

      {payments.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Recent Transactions</h3>
          {payments.slice(0, 20).map((p) => (
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
