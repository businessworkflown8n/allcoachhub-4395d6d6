import { Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useState } from "react";
import SearchDialog from "@/components/SearchDialog";
import LocationSelector from "@/components/LocationSelector";
import { useTranslation } from "@/i18n/TranslationProvider";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { role } = useUserRole();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
          <button onClick={() => handleSectionClick("#coaches")} className="text-sm text-muted-foreground transition-colors hover:text-foreground">{t("nav.browseCoaches")}</button>
          <Link to="/courses" className="text-sm text-muted-foreground transition-colors hover:text-foreground">{t("nav.courses")}</Link>
          <button onClick={() => handleSectionClick("#how-it-works")} className="text-sm text-muted-foreground transition-colors hover:text-foreground">{t("nav.howItWorks")}</button>
          <Link to="/webinars" className="text-sm text-muted-foreground transition-colors hover:text-foreground">{t("nav.webinars")}</Link>
          <Link to="/ai-blogs" className="text-sm text-muted-foreground transition-colors hover:text-foreground">{t("nav.aiBlogs")}</Link>
        </div>

        <div className="flex items-center gap-3">
          <LocationSelector />
          <SearchDialog />
          {user ? (
            <>
              <Link to={dashboardPath} className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:block">
                {t("nav.dashboard")}
              </Link>
              <button
                onClick={signOut}
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                {t("nav.signOut")}
              </button>
            </>
          ) : (
            <>
              <Link to="/auth?mode=login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {t("nav.signIn")}
              </Link>
              <Link
                to="/auth?mode=signup"
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                {t("nav.getStarted")}
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
            <button onClick={() => { setMobileOpen(false); handleSectionClick("#coaches"); }} className="text-sm text-muted-foreground text-left">{t("nav.browseCoaches")}</button>
            <Link to="/courses" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground">{t("nav.courses")}</Link>
            <button onClick={() => { setMobileOpen(false); handleSectionClick("#how-it-works"); }} className="text-sm text-muted-foreground text-left">{t("nav.howItWorks")}</button>
          <Link to="/webinars" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground">{t("nav.webinars")}</Link>
          <Link to="/ai-blogs" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground">{t("nav.aiBlogs")}</Link>
            {user && (
              <Link to={dashboardPath} onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground">{t("nav.dashboard")}</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
