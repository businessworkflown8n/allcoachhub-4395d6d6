import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Shield, ArrowRight, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ADMIN_EMAIL = "aicoachportal@gmail.com";

const AdminOTPLogin = () => {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

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

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: ADMIN_EMAIL,
      options: { shouldCreateUser: false },
    });

    setLoading(false);

    if (error) {
      toast({ title: "Failed to send OTP", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "OTP Sent", description: `A 6-digit code has been sent to ${ADMIN_EMAIL}` });
    setStep("otp");
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({ title: "Enter full OTP", description: "Please enter the 6-digit code.", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.verifyOtp({
      email: ADMIN_EMAIL,
      token: otp,
      type: "email",
    });

    if (error) {
      setLoading(false);
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
      return;
    }

    // Verify admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user!.id)
      .single();

    if (roleData?.role !== "admin") {
      await supabase.auth.signOut();
      setLoading(false);
      toast({ title: "Access denied", description: "This login is for administrators only.", variant: "destructive" });
      return;
    }

    setLoading(false);
    window.location.href = "/admin";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Admin OTP Login</h1>
          <p className="mt-2 text-sm text-muted-foreground">Secure access via email verification</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          {step === "email" ? (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="admin-otp-email" className="text-foreground">Admin Email</Label>
                <div className="flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2.5">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{ADMIN_EMAIL}</span>
                </div>
                <p className="text-xs text-muted-foreground">A 6-digit OTP will be sent to this email</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div className="space-y-3">
                <Label className="text-foreground">Enter 6-digit OTP</Label>
                <p className="text-xs text-muted-foreground">
                  Code sent to <span className="font-medium text-foreground">{ADMIN_EMAIL}</span>
                </p>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Sign In"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={() => { setStep("email"); setOtp(""); }}
                className="w-full text-sm text-primary hover:underline"
              >
                Resend OTP
              </button>
            </form>
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
