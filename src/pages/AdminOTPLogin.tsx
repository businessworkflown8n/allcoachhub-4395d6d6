import { useState, useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Shield, ArrowRight, Mail, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ADMIN_EMAIL = "aicoachportal@gmail.com";

const AdminOTPLogin = () => {
  useSEO({
    title: "Verify OTP – Admin Login",
    description: "Enter your one-time password to access the admin dashboard.",
    canonical: "https://www.aicoachportal.com/admin/otp-login",
    noIndex: true,
  });

  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  // Handle magic link callback - when user arrives with recovery/login session
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session?.user) {
        // Check if admin
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();

        if (roleData?.role === "admin") {
          toast({ title: "Welcome!", description: "Admin login successful." });
          navigate("/admin", { replace: true });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (authLoading || (user && roleLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user && role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(ADMIN_EMAIL, {
      redirectTo: `${window.location.origin}/admin/otp-login`,
    });

    setLoading(false);

    if (error) {
      toast({ title: "Failed to send link", description: error.message, variant: "destructive" });
      return;
    }

    setSent(true);
    toast({ title: "Login Link Sent!", description: `Check ${ADMIN_EMAIL} for the login link.` });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard Login</h1>
          <p className="mt-2 text-sm text-muted-foreground">Click the link in your email to login to Admin Dashboard</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          {!sent ? (
            <form onSubmit={handleSendMagicLink} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Admin Email</label>
                <div className="flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2.5">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{ADMIN_EMAIL}</span>
                </div>
                <p className="text-xs text-muted-foreground">Click below to receive a link — click it to login to Admin Dashboard</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Click And Login in Admin Dashboard"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          ) : (
            <div className="space-y-5 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <ExternalLink className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Check Your Email</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                   A login link has been sent to <span className="font-medium text-foreground">{ADMIN_EMAIL}</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Click the link in the email to login to Admin Dashboard.</p>
              </div>

              <button
                onClick={() => setSent(false)}
                className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm font-medium text-foreground transition-all hover:bg-muted"
              >
                Resend Login Link
              </button>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Use password login? <a href="/admin/login" className="text-primary hover:underline">Admin Password Login</a>
        </p>
      </div>
    </div>
  );
};

export default AdminOTPLogin;
