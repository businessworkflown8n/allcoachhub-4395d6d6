import { getScoreColor, getScoreBg, getScoreLabel, type SEOCheck } from "@/lib/seoScorer";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface Props {
  score: number;
  checks?: SEOCheck[];
  compact?: boolean;
}

const statusIcon = {
  good: <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />,
  warning: <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 shrink-0" />,
  poor: <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />,
};

const SEOScoreIndicator = ({ score, checks, compact }: Props) => {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <div className={`w-2.5 h-2.5 rounded-full ${getScoreBg(score)}`} />
        <span className={`text-sm font-bold ${getScoreColor(score)}`}>{score}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Circular score */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
            <circle
              cx="32" cy="32" r="28" fill="none"
              stroke={score >= 80 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444"}
              strokeWidth="4"
              strokeDasharray={`${(score / 100) * 176} 176`}
              strokeLinecap="round"
            />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${getScoreColor(score)}`}>
            {score}
          </span>
        </div>
        <div>
          <p className={`text-sm font-semibold ${getScoreColor(score)}`}>{getScoreLabel(score)}</p>
          <p className="text-xs text-muted-foreground">SEO Score</p>
        </div>
      </div>

      {/* Checks list */}
      {checks && checks.length > 0 && (
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {checks.map((check) => (
            <div key={check.id} className="flex items-start gap-2 py-1">
              {statusIcon[check.status]}
              <span className="text-xs text-muted-foreground">{check.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SEOScoreIndicator;
