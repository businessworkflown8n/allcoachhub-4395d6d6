import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, MessageSquare, HelpCircle, Sparkles, Calendar, Users, Trophy, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommunityLayoutProps {
  children: ReactNode;
  baseUrl: string;
}

const communityNav = [
  { label: "Home", path: "", icon: Home },
  { label: "Topic Spaces", path: "/topics", icon: MessageSquare },
  { label: "Ask a Coach", path: "/ask-a-coach", icon: HelpCircle },
  { label: "Prompt Library", path: "/prompts", icon: Sparkles },
  { label: "Live Events", path: "/events", icon: Calendar },
  { label: "Private Groups", path: "/groups", icon: Users },
  { label: "Leaderboard", path: "/leaderboard", icon: Trophy },
  { label: "Guidelines", path: "/guidelines", icon: BookOpen },
];

const CommunityLayout = ({ children, baseUrl }: CommunityLayoutProps) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    const full = baseUrl + path;
    return path === "" ? currentPath === baseUrl || currentPath === baseUrl + "/" : currentPath.startsWith(full);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {communityNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={baseUrl + item.path}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
};

export default CommunityLayout;
