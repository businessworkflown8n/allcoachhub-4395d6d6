import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Copy, Mail, MessageCircle, Users, MousePointerClick, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CoachReferrals = () => {
  const { user } = useAuth();
  const [clicks, setClicks] = useState(0);
  const [signups, setSignups] = useState(0);
  const [enrollments, setEnrollments] = useState(0);

  const inviteLink = user
    ? `${window.location.origin}/coach-landing?ref=${user.id}`
    : "";

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ count: clickCount }, { count: signupCount }, { count: enrollCount }] = await Promise.all([
        supabase.from("referral_clicks").select("*", { count: "exact", head: true }).eq("referrer_id", user.id),
        supabase.from("referrals").select("*", { count: "exact", head: true }).eq("referrer_id", user.id),
        supabase.from("referrals").select("*", { count: "exact", head: true }).eq("referrer_id", user.id).not("converted_at", "is", null),
      ]);
      setClicks(clickCount || 0);
      setSignups(signupCount || 0);
      setEnrollments(enrollCount || 0);
    })();
  }, [user]);

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({ title: "Invite link copied!", description: "Share it with fellow coaches." });
  };

  const shareWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hey! I'm coaching on AI Coach Portal — a marketplace that brings you students at the lowest acquisition cost. Join me using my invite link:\n\n${inviteLink}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const shareEmail = () => {
    const subject = encodeURIComponent("Join me as a coach on AI Coach Portal");
    const body = encodeURIComponent(
      `Hi,\n\nI'm coaching on AI Coach Portal and it's been a great way to reach new students at very low acquisition cost.\n\nJoin as a coach using my invite link:\n${inviteLink}\n\nSee you inside!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Invite Fellow Coaches</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Grow the network — invite other coaches and help them get students at the lowest enrollment cost.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <MousePointerClick className="h-4 w-4" />
            <span className="text-xs">Link Clicks</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{clicks}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <UserPlus className="h-4 w-4" />
            <span className="text-xs">Coach Signups</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{signups}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-xs">Active Coaches</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{enrollments}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Your Coach Invite Link</h3>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input value={inviteLink} readOnly className="font-mono text-xs" />
          <Button onClick={copyLink} className="shrink-0">
            <Copy className="mr-2 h-4 w-4" />
            Copy Link
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="outline" onClick={shareWhatsApp}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Share on WhatsApp
          </Button>
          <Button variant="outline" onClick={shareEmail}>
            <Mail className="mr-2 h-4 w-4" />
            Share via Email
          </Button>
        </div>

        <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Why invite other coaches?</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Help fellow coaches access students at the lowest enrollment cost</li>
            <li>Grow the AI Coach community and platform reach</li>
            <li>Future commission rewards (coming soon — pending admin activation)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CoachReferrals;
