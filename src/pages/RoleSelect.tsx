import { GraduationCap, Users, ArrowRight } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import logo from "@/assets/logo.gif";

const RoleSelect = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const mode = searchParams.get("mode") === "login" ? "login" : "signup";
  const redirect = searchParams.get("redirect") || "";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleSelect = (role: "learner" | "coach") => {
    const redirectParam = redirect ? `?redirect=${encodeURIComponent(redirect)}` : "";
    navigate(`/${mode}/${role}${redirectParam}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img src={logo} alt="AI Coach Portal" className="mx-auto mb-4 h-14 w-14 rounded-xl" />
          <h1 className="text-2xl font-bold text-foreground">
            {mode === "login" ? "Welcome Back" : "Get Started"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login" ? "How would you like to sign in?" : "How would you like to join?"}
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleSelect("learner")}
            className="group flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-6 text-left transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/10"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-semibold text-foreground">
                {mode === "login" ? "I am a Learner" : "Join as Learner"}
              </p>
              <p className="text-sm text-muted-foreground">
                {mode === "login"
                  ? "Access your courses and learning dashboard"
                  : "Explore courses, learn from expert coaches"}
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </button>

          <button
            onClick={() => handleSelect("coach")}
            className="group flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-6 text-left transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/10"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Users className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-semibold text-foreground">
                {mode === "login" ? "I am a Coach" : "Join as Coach"}
              </p>
              <p className="text-sm text-muted-foreground">
                {mode === "login"
                  ? "Manage your courses and track earnings"
                  : "Create courses, teach, and earn"}
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <button onClick={() => navigate(`/auth?mode=signup${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ""}`)} className="font-medium text-primary hover:underline">
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button onClick={() => navigate(`/auth?mode=login${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ""}`)} className="font-medium text-primary hover:underline">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default RoleSelect;
