/**
 * Reusable footer block for E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness).
 * Renders author identity, last-reviewed date, and external references on every Knowledge Hub page.
 */
import { CheckCircle2, ExternalLink, User } from "lucide-react";

interface Reference {
  title: string;
  url: string;
}

interface EEATFooterProps {
  authorName: string;
  authorExpertise: string;
  reviewedBy?: string | null;
  lastUpdated: string;
  references?: Reference[] | null;
}

export const EEATFooter = ({
  authorName,
  authorExpertise,
  reviewedBy,
  lastUpdated,
  references,
}: EEATFooterProps) => {
  const formattedDate = new Date(lastUpdated).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <section
      aria-label="Source verification"
      className="mt-12 rounded-xl border border-border bg-card/50 p-6"
    >
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
        <CheckCircle2 className="h-4 w-4 text-primary" />
        Source verification
      </h2>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Author</dt>
          <dd className="mt-0.5 flex items-center gap-1.5 font-medium text-foreground">
            <User className="h-3.5 w-3.5" />
            {authorName}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Expertise</dt>
          <dd className="mt-0.5 text-foreground">{authorExpertise}</dd>
        </div>
        {reviewedBy && (
          <div>
            <dt className="text-muted-foreground">Reviewed by</dt>
            <dd className="mt-0.5 text-foreground">{reviewedBy}</dd>
          </div>
        )}
        <div>
          <dt className="text-muted-foreground">Last updated</dt>
          <dd className="mt-0.5 text-foreground">{formattedDate}</dd>
        </div>
      </dl>

      {references && references.length > 0 && (
        <div className="mt-5 border-t border-border pt-4">
          <h3 className="mb-2 text-sm font-semibold text-foreground">External references</h3>
          <ul className="space-y-1.5 text-sm">
            {references.map((ref, i) => (
              <li key={i}>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1.5 text-primary hover:underline"
                >
                  {ref.title}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
