import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DollarSign, TrendingUp, Clock, ArrowUpRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const CoachEarnings = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("payments").select("*").eq("coach_id", user.id).order("created_at", { ascending: false }),
      supabase.from("payouts").select("*").eq("coach_id", user.id).order("requested_at", { ascending: false }),
    ]).then(([p, po]) => {
      setPayments(p.data || []);
      setPayouts(po.data || []);
      setLoading(false);
    });
  }, [user]);

  const totalEarnings = payments.reduce((sum, p) => sum + Number(p.coach_earning || 0), 0);
  const totalCommission = payments.reduce((sum, p) => sum + Number(p.platform_commission || 0), 0);
  const pendingPayout = totalEarnings - payouts.filter((p) => p.status === "paid").reduce((sum, p) => sum + Number(p.amount), 0);

  const requestPayout = async () => {
    if (!user || pendingPayout <= 0) return;
    setRequesting(true);
    const { error } = await supabase.from("payouts").insert({ coach_id: user.id, amount: pendingPayout });
    setRequesting(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Payout requested" });
      const { data } = await supabase.from("payouts").select("*").eq("coach_id", user.id).order("requested_at", { ascending: false });
      setPayouts(data || []);
    }
  };

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Earnings</h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <DollarSign className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-bold text-foreground">${totalEarnings.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Total Earnings</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <TrendingUp className="h-5 w-5 text-destructive mb-2" />
          <p className="text-2xl font-bold text-foreground">${totalCommission.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Commission Deducted</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <Clock className="h-5 w-5 text-yellow-400 mb-2" />
          <p className="text-2xl font-bold text-foreground">${pendingPayout.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Pending Payout</p>
        </div>
      </div>

      <button onClick={requestPayout} disabled={requesting || pendingPayout <= 0} className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50">
        <ArrowUpRight className="h-4 w-4" />
        {requesting ? "Requesting..." : "Request Withdrawal"}
      </button>

      {payouts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Payout History</h3>
          {payouts.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
              <span className="text-sm text-foreground">${Number(p.amount).toFixed(2)}</span>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${p.status === "paid" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>{p.status}</span>
                <span className="text-xs text-muted-foreground">{new Date(p.requested_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoachEarnings;
