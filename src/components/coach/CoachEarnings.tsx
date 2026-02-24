import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DollarSign, IndianRupee, TrendingUp, Clock, ArrowUpRight, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const CoachEarnings = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("enrollments").select("*, courses(title, price_usd, price_inr)").eq("coach_id", user.id),
      supabase.from("payouts").select("*").eq("coach_id", user.id).order("requested_at", { ascending: false }),
    ]).then(([e, po]) => {
      setEnrollments(e.data || []);
      setPayouts(po.data || []);
      setLoading(false);
    });
  }, [user]);

  const paidEnrollments = enrollments.filter((e) => e.payment_status === "paid");
  const totalEarningsUSD = paidEnrollments
    .filter((e) => e.currency === "USD")
    .reduce((sum, e) => sum + Number(e.amount_paid || 0), 0);
  const totalEarningsINR = paidEnrollments
    .filter((e) => e.currency !== "USD")
    .reduce((sum, e) => sum + Number(e.amount_paid || 0), 0);
  const totalPaidOut = payouts.filter((p) => p.status === "paid").reduce((sum, p) => sum + Number(p.amount), 0);

  const requestPayout = async () => {
    if (!user || (totalEarningsUSD + totalEarningsINR) <= 0) return;
    setRequesting(true);
    const { error } = await supabase.from("payouts").insert({ coach_id: user.id, amount: totalEarningsUSD + totalEarningsINR });
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

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <Users className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-bold text-foreground">{paidEnrollments.length}</p>
          <p className="text-xs text-muted-foreground">Paid Enrollments</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <DollarSign className="h-5 w-5 text-green-400 mb-2" />
          <p className="text-2xl font-bold text-foreground">${totalEarningsUSD.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Earnings (USD)</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <IndianRupee className="h-5 w-5 text-green-400 mb-2" />
          <p className="text-2xl font-bold text-foreground">₹{totalEarningsINR.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Earnings (INR)</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <Clock className="h-5 w-5 text-yellow-400 mb-2" />
          <p className="text-2xl font-bold text-foreground">${totalPaidOut.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Total Paid Out</p>
        </div>
      </div>

      {/* Course-wise breakdown */}
      {paidEnrollments.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Earnings by Course</h3>
          {Object.entries(
            paidEnrollments.reduce((acc: Record<string, { usd: number; inr: number; count: number }>, e) => {
              const title = (e.courses as any)?.title || "Unknown";
              if (!acc[title]) acc[title] = { usd: 0, inr: 0, count: 0 };
              acc[title].count++;
              if (e.currency === "USD") acc[title].usd += Number(e.amount_paid || 0);
              else acc[title].inr += Number(e.amount_paid || 0);
              return acc;
            }, {})
          ).map(([title, val]) => {
            const data = val as { usd: number; inr: number; count: number };
            return (
            <div key={title} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-border bg-card px-4 py-3 gap-2">
              <div>
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{data.count} paid enrollment{data.count > 1 ? "s" : ""}</p>
              </div>
              <div className="flex items-center gap-3">
                {data.usd > 0 && <span className="text-sm font-semibold text-foreground">${data.usd.toFixed(2)}</span>}
                {data.inr > 0 && <span className="text-sm font-semibold text-foreground">₹{data.inr.toFixed(2)}</span>}
              </div>
            </div>
            );})}
        </div>
      )}

      <button onClick={requestPayout} disabled={requesting || (totalEarningsUSD + totalEarningsINR) <= 0} className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50">
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
