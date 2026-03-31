import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface Props {
  themeColor: string;
}

const CoachWebsiteStickyCTA = ({ themeColor }: Props) => {
  const scrollToDemo = () => document.getElementById("cw-demo")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm py-3 px-4 md:hidden">
      <Button className="w-full gap-2 text-base font-semibold" style={{ backgroundColor: themeColor }} onClick={scrollToDemo}>
        Enroll Now <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default CoachWebsiteStickyCTA;
