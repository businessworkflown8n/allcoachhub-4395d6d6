import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    navigate("/");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Enter your email", description: "Please enter your email address first.", variant: "destructive" });
      return;
    }
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check your email", description: "A password reset link has been sent to your email." });
      setShowReset(false);
    }
  };

  if (showReset) {
    return (
      <form onSubmit={handleResetPassword} className="space-y-5">
        <p className="text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>
        <div className="space-y-2">
          <Label htmlFor="reset-email" className="text-foreground">Email</Label>
          <Input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="bg-secondary border-border"
          />
        </div>
        <button
          type="submit"
          disabled={resetLoading}
          className="glow-lime flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50"
        >
          {resetLoading ? "Sending..." : "Send Reset Link"}
          {!resetLoading && <ArrowRight className="h-4 w-4" />}
        </button>
        <button type="button" onClick={() => setShowReset(false)} className="w-full text-sm text-primary hover:underline">
          Back to Sign In
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="login-email" className="text-foreground">Email</Label>
        <Input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="bg-secondary border-border"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password" className="text-foreground">Password</Label>
          <button type="button" onClick={() => setShowReset(true)} className="text-xs text-primary hover:underline">
            Forgot Password?
          </button>
        </div>
        <Input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
          required
          className="bg-secondary border-border"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="glow-lime flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign In"}
        {!loading && <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  );
};

export default LoginForm;
