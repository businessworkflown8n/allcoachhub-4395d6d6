import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface Props {
  themeColor: string;
}

const CoachWebsiteFloatingCTA = ({ themeColor }: Props) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToDemo = () => document.getElementById("cw-demo")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div
      className={`fixed bottom-6 right-6 z-40 hidden md:block transition-all duration-300 ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"}`}
    >
      <Button
        size="lg"
        className="gap-2 rounded-full px-6 text-base font-semibold shadow-lg transition-transform hover:scale-105"
        style={{ backgroundColor: themeColor }}
        onClick={scrollToDemo}
      >
        Book Free Demo <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default CoachWebsiteFloatingCTA;
