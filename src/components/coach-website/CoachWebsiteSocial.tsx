import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface Props {
  socialLinks: Record<string, string>;
}

const CoachWebsiteSocial = ({ socialLinks }: Props) => {
  const entries = Object.entries(socialLinks).filter(([, url]) => url);
  if (!entries.length) return null;

  return (
    <section className="border-b border-border py-12">
      <div className="container mx-auto px-4">
        <h2 className="mb-4 text-2xl font-bold text-foreground">Connect With Us</h2>
        <div className="flex flex-wrap gap-3">
          {entries.map(([platform, url]) => (
            <a key={platform} href={url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="capitalize gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" /> {platform}
              </Button>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoachWebsiteSocial;
