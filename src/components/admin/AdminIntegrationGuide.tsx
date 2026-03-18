import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen, CheckCircle2, AlertTriangle, RefreshCw, ExternalLink
} from "lucide-react";

const GUIDES = [
  {
    platform: "Google Ads",
    steps: [
      "Go to Integrations Hub",
      "Click "Connect" on Google Ads",
      "Enter your Google Ads Account ID (found in top-right of Google Ads dashboard, format: 123-456-7890)",
      "Enter your account name for identification",
      "Review & grant read-only permissions",
      "Select data types to sync (Campaigns, Ad Groups, Conversions)",
      "Configure currency, timezone, and sync frequency",
      "Confirm connection",
    ],
    tips: "Ensure you have admin access to the Google Ads account. MCC accounts can connect multiple sub-accounts.",
  },
  {
    platform: "Meta Ads",
    steps: [
      "Click "Connect" on Meta Ads",
      "Enter your Ad Account ID (found in Meta Business Settings → Ad Accounts, format: act_123456789)",
      "Enter a display name",
      "Grant read-only permissions for campaign data",
      "Select data scope (Campaigns, Ad Sets, Ads, Conversions)",
      "Map currency and timezone settings",
      "Confirm the connection",
    ],
    tips: "You need Business Manager admin access. Ensure your ad account is active and not restricted.",
  },
  {
    platform: "TikTok Ads",
    steps: [
      "Click "Connect" on TikTok Ads",
      "Enter your TikTok Advertiser ID",
      "Grant campaign data access permissions",
      "Select which data to sync",
      "Configure sync settings",
      "Confirm connection",
    ],
    tips: "TikTok Ads API access requires a developer account. Contact TikTok support if you need API access enabled.",
  },
  {
    platform: "LinkedIn Ads",
    steps: [
      "Click "Connect" on LinkedIn Ads",
      "Enter your LinkedIn Campaign Manager Account ID",
      "Authorize read-only access to campaigns",
      "Select data types to sync",
      "Configure currency and timezone",
      "Confirm connection",
    ],
    tips: "You need Campaign Manager access for the LinkedIn company page associated with the ad account.",
  },
];

const ERRORS = [
  { error: "Permission Denied", solution: "Reconnect with an account that has admin/advertiser access to the ad platform.", icon: "🔒" },
  { error: "Token Expired", solution: "Refresh the connection from the Integrations Hub. Click the sync button next to the platform.", icon: "⏰" },
  { error: "No Ad Account Found", solution: "Verify you have an active ad account on the platform. Check access permissions in the platform's settings.", icon: "🔍" },
  { error: "Rate Limit Exceeded", solution: "Wait 15 minutes and try again. Reduce sync frequency if this happens regularly.", icon: "⚡" },
  { error: "Invalid Account ID", solution: "Double-check the account ID format. Each platform has a specific format (see steps above).", icon: "❌" },
];

const AdminIntegrationGuide = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" /> How to Connect Ad Platforms
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Step-by-step guides for connecting each advertising platform</p>
      </div>

      {/* Platform Guides */}
      <div className="grid gap-4 lg:grid-cols-2">
        {GUIDES.map(guide => (
          <Card key={guide.platform}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {guide.platform}
                <Badge variant="secondary" className="text-[10px]">{guide.steps.length} steps</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {guide.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-foreground">{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-3 p-2 rounded bg-accent/50 text-xs text-muted-foreground flex items-start gap-2">
                <CheckCircle2 className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" />
                <span>{guide.tips}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Error Handling Guide */}
      <div>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-400" /> Troubleshooting
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Common connection issues and how to resolve them</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ERRORS.map(err => (
          <Card key={err.error}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{err.icon}</span>
                <p className="font-medium text-sm text-foreground">{err.error}</p>
              </div>
              <p className="text-xs text-muted-foreground">{err.solution}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Sync Info */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium text-foreground flex items-center gap-2 mb-2">
            <RefreshCw className="h-4 w-4 text-primary" /> Sync Settings
          </h4>
          <div className="grid gap-3 sm:grid-cols-3 text-sm">
            <div>
              <p className="font-medium text-foreground">Hourly Sync</p>
              <p className="text-xs text-muted-foreground">Updates every hour. Best for active campaigns where you need real-time data.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Daily Sync</p>
              <p className="text-xs text-muted-foreground">Updates once daily at midnight. Recommended for most use cases.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Weekly Sync</p>
              <p className="text-xs text-muted-foreground">Updates weekly on Monday. Best for low-volume accounts.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminIntegrationGuide;
