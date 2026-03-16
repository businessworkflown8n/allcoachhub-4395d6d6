import { useState } from "react";
import SocialAuthButtons from "./SocialAuthButtons";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowRight, CheckCircle, GraduationCap, Users, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const SignupForm = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [role, setRole] = useState<"learner" | "coach">("learner");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !mobile || !password) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
          role,
          mobile,
          city,
          country,
          ...(role === "coach" ? { company_name: companyName } : {}),
        },
      },
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setSuccess(true);
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    setResendLoading(false);

    if (error) {
      toast({
        title: "Failed to resend",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Email sent!",
        description: "A new verification link has been sent to your email.",
      });
    }
  };

  if (success) {
    return (
      <div className="py-8 text-center space-y-4">
        <CheckCircle className="mx-auto mb-4 h-12 w-12 text-primary" />
        <h3 className="mb-2 text-lg font-semibold text-foreground">Thank You For Registration!</h3>
        <p className="text-sm text-muted-foreground">
          Please verify your Email ID for further use. We've sent a verification link to <strong className="text-foreground">{email}</strong>.
        </p>
        <Button
          onClick={handleResendVerification}
          disabled={resendLoading}
          variant="outline"
          className="mt-4"
        >
          {resendLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Resending...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Resend Verification Email
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Role Selection */}
      <div className="space-y-3">
        <Label className="text-foreground">I want to join as</Label>
        <RadioGroup
          value={role}
          onValueChange={(v) => setRole(v as "learner" | "coach")}
          className="grid grid-cols-2 gap-3"
        >
          <label
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
              role === "learner"
                ? "border-primary bg-primary/10"
                : "border-border bg-secondary hover:border-muted-foreground/30"
            }`}
          >
            <RadioGroupItem value="learner" className="sr-only" />
            <GraduationCap className={`h-6 w-6 ${role === "learner" ? "text-primary" : "text-muted-foreground"}`} />
            <span className={`text-sm font-medium ${role === "learner" ? "text-primary" : "text-muted-foreground"}`}>
              Learner
            </span>
          </label>
          <label
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
              role === "coach"
                ? "border-primary bg-primary/10"
                : "border-border bg-secondary hover:border-muted-foreground/30"
            }`}
          >
            <RadioGroupItem value="coach" className="sr-only" />
            <Users className={`h-6 w-6 ${role === "coach" ? "text-primary" : "text-muted-foreground"}`} />
            <span className={`text-sm font-medium ${role === "coach" ? "text-primary" : "text-muted-foreground"}`}>
              Coach
            </span>
          </label>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-foreground">Full Name</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="John Doe"
          required
          className="bg-secondary border-border"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="bg-secondary border-border"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mobile" className="text-foreground">Mobile Number</Label>
        <Input
          id="mobile"
          type="tel"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          placeholder="+91 9876543210"
          required
          className="bg-secondary border-border"
        />
      </div>

      {role === "coach" && (
        <div className="space-y-2">
          <Label htmlFor="companyName" className="text-foreground">Company Name</Label>
          <Input
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Your company or brand name"
            required
            className="bg-secondary border-border"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="city" className="text-foreground">City</Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Your city"
            className="bg-secondary border-border"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country" className="text-foreground">Country</Label>
          <Input
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Your country"
            className="bg-secondary border-border"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-foreground">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min 6 characters"
          minLength={6}
          required
          className="bg-secondary border-border"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="glow-lime flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50"
      >
        {loading ? "Creating account..." : "Create Account"}
        {!loading && <ArrowRight className="h-4 w-4" />}
      </button>

      <SocialAuthButtons />
    </form>
  );
};

export default SignupForm;
