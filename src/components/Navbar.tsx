import { Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useState } from "react";
import SearchDialog from "@/components/SearchDialog";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { role } = useUserRole();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const dashboardPath = role === "admin" ? "/admin" : role === "coach" ? "/coach" : "/learner";

  const handleSectionClick = (hash: string) => {
    if (location.pathname !== "/") {
      navigate("/" + hash);
    } else {
      const el = document.querySelector(hash);
      el?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="AI Coach Portal" className="h-8 w-8 rounded-lg" />
          <span className="text-lg font-bold text-foreground">AI Coach Portal</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <button onClick={() => handleSectionClick("#coaches")} className="text-sm text-muted-foreground transition-colors hover:text-foreground">Browse Coaches</button>
          <button onClick={() => handleSectionClick("#courses")} className="text-sm text-muted-foreground transition-colors hover:text-foreground">Courses</button>
          <button onClick={() => handleSectionClick("#how-it-works")} className="text-sm text-muted-foreground transition-colors hover:text-foreground">How It Works</button>
          <Link to="/ai-blogs" className="text-sm text-muted-foreground transition-colors hover:text-foreground">AI Blogs</Link>
        </div>

        <div className="flex items-center gap-4">
          <SearchDialog />
          {user ? (
            <>
              <Link to={dashboardPath} className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:block">
                Dashboard
              </Link>
              <button
                onClick={signOut}
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Sign In
              </Link>
              <Link
                to="/auth"
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Get Started
              </Link>
            </>
          )}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-muted-foreground">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-3 pt-3">
            <button onClick={() => { setMobileOpen(false); handleSectionClick("#coaches"); }} className="text-sm text-muted-foreground text-left">Browse Coaches</button>
            <button onClick={() => { setMobileOpen(false); handleSectionClick("#courses"); }} className="text-sm text-muted-foreground text-left">Courses</button>
            <button onClick={() => { setMobileOpen(false); handleSectionClick("#how-it-works"); }} className="text-sm text-muted-foreground text-left">How It Works</button>
            <Link to="/ai-blogs" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground">AI Blogs</Link>
            {user && (
              <Link to={dashboardPath} onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground">Dashboard</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
