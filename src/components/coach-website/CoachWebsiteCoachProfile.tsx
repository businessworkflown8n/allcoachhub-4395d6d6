import { MapPin, Briefcase, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Props {
  coach: any;
  themeColor: string;
}

const CoachWebsiteCoachProfile = ({ coach, themeColor }: Props) => {
  if (!coach) return null;

  return (
    <section className="border-b border-border py-14">
      <div className="container mx-auto px-4">
        <h2 className="mb-8 text-center text-2xl font-bold text-foreground">Meet Your Coach</h2>
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-start sm:text-left">
          {coach.avatar_url ? (
            <img src={coach.avatar_url} alt={coach.full_name} className="h-28 w-28 shrink-0 rounded-full border-2 object-cover" style={{ borderColor: themeColor }} />
          ) : (
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-secondary text-3xl font-bold text-muted-foreground">
              {coach.full_name?.[0]}
            </div>
          )}
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-bold text-foreground">{coach.full_name}</h3>
            {coach.specialization && (
              <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
                <Briefcase className="h-3.5 w-3.5" /> {coach.specialization}
              </p>
            )}
            {coach.country && (
              <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
                <MapPin className="h-3.5 w-3.5" /> {coach.country}
              </p>
            )}
            {coach.bio && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{coach.bio}</p>}
            {coach.slug && (
              <Link to={`/coach-profile/${coach.slug}`}>
                <Button variant="outline" size="sm" className="mt-4 gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" /> View Full Profile
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoachWebsiteCoachProfile;
