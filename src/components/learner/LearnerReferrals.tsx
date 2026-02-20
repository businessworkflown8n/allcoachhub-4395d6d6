import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, DollarSign, UserPlus, BookOpen, Copy, Mail, MessageCircle, Link2, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LearnerReferrals = () => {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [copied, setCopied] = useState(false);

  const referralLink = user
    ? `${window.location.origin}/auth?ref=${user.id}`
    : "";

  useEffect(() => {
    if (!user) return;
    supabase.from("referrals").select("*").eq("referrer_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      setReferrals(data || []);
      setLoading(false);
    });
  }, [user]);

  const refreshReferrals = async () => {
    if (!user) return;
    const { data } = await supabase.from("referrals").select("*").eq("referrer_id", user.id).order("created_at", { ascending: false });
    setReferrals(data || []);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Link copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaEmail = async () => {
    if (!user || !email) return;
    const { error } = await supabase.from("referrals").insert({ referrer_id: user.id, referrer_role: "learner", referred_email: email });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    const subject = encodeURIComponent("Join me on AllCoachHub!");
    const body = encodeURIComponent(`Hey! I'd love for you to check out AllCoachHub. Use my referral link to sign up:\n\n${referralLink}\n\nSee you there!`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank");
    toast({ title: "Referral tracked & email opened!" });
    setEmail("");
    await refreshReferrals();
  };

  const shareViaWhatsApp = async () => {
    if (!user || !whatsapp) return;
    const cleanNumber = whatsapp.replace(/\D/g, "");
    const { error } = await supabase.from("referrals").insert({ referrer_id: user.id, referrer_role: "learner", referred_email: `whatsapp:${cleanNumber}` });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    const message = encodeURIComponent(`Hey! Join me on AllCoachHub and start learning from top coaches. Sign up using my referral link:\n${referralLink}`);
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, "_blank");
    toast({ title: "Referral tracked & WhatsApp opened!" });
    setWhatsapp("");
    await refreshReferrals();
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

      {/* Unique Referral Link */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Link2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Your Unique Referral Link</h3>
        </div>
        <div className="flex gap-2">
          <Input value={referralLink} readOnly className="flex-1 bg-secondary text-xs" />
          <Button size="sm" variant="outline" onClick={copyLink} className="shrink-0">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>

      {/* Share via Email */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Invite via Email</h3>
        </div>
        <div className="flex gap-2">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="friend@email.com" className="flex-1" />
          <Button size="sm" onClick={shareViaEmail} disabled={!email} className="shrink-0">
            <Mail className="h-4 w-4" /> Send
          </Button>
        </div>
      </div>

      {/* Share via WhatsApp */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <MessageCircle className="h-4 w-4 text-green-500" />
          <h3 className="text-sm font-semibold text-foreground">Invite via WhatsApp</h3>
        </div>
        <div className="flex gap-2">
          <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+91 9876543210" className="flex-1" />
          <Button size="sm" onClick={shareViaWhatsApp} disabled={!whatsapp} className="shrink-0 bg-green-600 hover:bg-green-700 text-white">
            <MessageCircle className="h-4 w-4" /> Send
          </Button>
        </div>
      </div>

      {referrals.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Referral History</h3>
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
