import { useParams, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import LearnerSignupForm from "@/components/auth/LearnerSignupForm";
import CoachSignupForm from "@/components/auth/CoachSignupForm";
import { Phone, GraduationCap, Users } from "lucide-react";
import logo from "@/assets/logo.gif";
import { Link } from "react-router-dom";

const Signup = () => {
  const { role: urlRole } = useParams<{ role: string }>();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const redirect = searchParams.get("redirect");

  if (!urlRole || !["learner", "coach"].includes(urlRole)) {
    return <Navigate to="/auth?mode=signup" replace />;
  }

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

  const Icon = urlRole === "coach" ? Users : GraduationCap;
  const roleLabel = urlRole === "coach" ? "Coach" : "Learner";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img src={logo} alt="AI Coach Portal" className="mx-auto mb-4 h-14 w-14 rounded-xl" />
          <div className="mx-auto mb-3 flex items-center justify-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 w-fit">
            <Icon className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{roleLabel}</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create your {roleLabel} account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {urlRole === "coach" ? "Start teaching and earning today" : "Begin your AI learning journey"}
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
          {urlRole === "coach" ? <CoachSignupForm /> : <LearnerSignupForm />}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to={`/login/${urlRole}`} className="font-medium text-primary hover:underline">
              Sign in as {roleLabel}
            </Link>
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Not a {roleLabel.toLowerCase()}?{" "}
          <Link to="/auth?mode=signup" className="font-medium text-primary hover:underline">
            Switch role
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
