import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, DollarSign, UserPlus, BookOpen } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const LearnerReferrals = () => {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("referrals").select("*").eq("referrer_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      setReferrals(data || []);
      setLoading(false);
    });
  }, [user]);

  const handleRefer = async () => {
    if (!user || !email) return;
    const { error } = await supabase.from("referrals").insert({ referrer_id: user.id, referrer_role: "learner", referred_email: email });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Referral sent!" });
      setEmail("");
      const { data } = await supabase.from("referrals").select("*").eq("referrer_id", user.id).order("created_at", { ascending: false });
      setReferrals(data || []);
    }
  };

  const stats = {
    total: referrals.length,
    registered: referrals.filter((r) => r.status === "registered" || r.status === "enrolled").length,
    enrolled: referrals.filter((r) => r.status === "enrolled").length,
    earnings: referrals.reduce((sum, r) => sum + Number(r.commission_earned || 0), 0),
  };

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Referral Program</h2>
      <p className="text-sm text-muted-foreground">Earn 10% commission when your referrals enroll in courses</p>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total Referred", value: stats.total, icon: Users },
          { label: "Registered", value: stats.registered, icon: UserPlus },
          { label: "Enrolled", value: stats.enrolled, icon: BookOpen },
          { label: "Earnings", value: `$${stats.earnings}`, icon: DollarSign },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <s.icon className="h-5 w-5 text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Invite a Friend</h3>
        <div className="flex gap-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="friend@email.com" className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" />
          <button onClick={handleRefer} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110">Send</button>
        </div>
      </div>

      {referrals.length > 0 && (
        <div className="space-y-2">
          {referrals.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
              <span className="text-sm text-foreground">{r.referred_email}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                r.status === "enrolled" ? "bg-green-500/20 text-green-400" : r.status === "registered" ? "bg-blue-500/20 text-blue-400" : "bg-yellow-500/20 text-yellow-400"
              }`}>{r.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LearnerReferrals;
