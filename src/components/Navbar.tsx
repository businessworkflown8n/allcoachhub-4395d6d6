import { Sparkles } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">AI Coach</span>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#coaches" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Browse Coaches</a>
          <a href="#courses" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Courses</a>
          <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">How It Works</a>
        </div>

        <div className="flex items-center gap-4">
          <button className="text-sm text-muted-foreground transition-colors hover:text-foreground">Sign In</button>
          <button className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90">
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
