import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import SignupForm from "@/components/auth/SignupForm";
import LoginForm from "@/components/auth/LoginForm";
import { Phone } from "lucide-react";
import logo from "@/assets/logo.gif";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "login" ? "login" : "signup";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  
  useSEO({
    title: mode === "login" ? "Login – AI Coach Portal" : "Sign Up – AI Coach Portal",
    description: mode === "login" 
      ? "Sign in to your AI Coach Portal account to access courses, webinars, and AI learning resources."
      : "Create your AI Coach Portal account and start learning AI from expert coaches today.",
    canonical: `https://www.aicoachportal.com/auth?mode=${mode}`,
    noIndex: true,
  });

  const { user, loading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const redirect = searchParams.get("redirect");

  if (loading || (user && roleLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    if (redirect) return <Navigate to={redirect} replace />;
    const dashboardPath = role === "admin" ? "/admin" : role === "coach" ? "/coach" : "/learner";
    return <Navigate to={dashboardPath} replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img src={logo} alt="AI Coach Portal" className="mx-auto mb-4 h-14 w-14 rounded-xl" />
          <h1 className="text-2xl font-bold text-foreground">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signup" ? "Join as a Learner or Coach" : "Sign in to your account"}
          </p>
          <a
            href="tel:+919852411280"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Phone className="h-4 w-4" />
            Call Us
          </a>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          {mode === "signup" ? <SignupForm /> : <LoginForm />}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button onClick={() => setMode("login")} className="font-medium text-primary hover:underline">Sign in</button>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <button onClick={() => setMode("signup")} className="font-medium text-primary hover:underline">Sign up</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
