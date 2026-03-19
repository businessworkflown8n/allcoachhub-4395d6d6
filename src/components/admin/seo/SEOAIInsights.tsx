import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lightbulb, AlertTriangle, TrendingUp, TrendingDown, Zap, CheckCircle } from "lucide-react";
import { useSEOAnalytics } from "@/hooks/useSEOAnalytics";

const severityConfig: Record<string, { icon: any; bg: string; border: string; text: string }> = {
  error: { icon: AlertTriangle, bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400" },
  warning: { icon: Zap, bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400" },
  info: { icon: TrendingUp, bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
  success: { icon: CheckCircle, bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400" },
};

const typeLabels: Record<string, string> = {
  opportunity: "CTR Opportunity",
  push_zone: "Ranking Push",
  problem: "Content Issue",
  alert: "Traffic Alert",
  success: "Win",
};

const SEOAIInsights = () => {
  const { data, loading, fetchData } = useSEOAnalytics();

  useEffect(() => { fetchData("ai_insights"); }, []);

  const insights = data.aiInsights?.insights || [];

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const grouped = {
    error: insights.filter((i: any) => i.severity === "error"),
    warning: insights.filter((i: any) => i.severity === "warning"),
    info: insights.filter((i: any) => i.severity === "info"),
    success: insights.filter((i: any) => i.severity === "success"),
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">AI-Powered SEO Insights</CardTitle>
          <Badge variant="outline" className="ml-auto text-xs">{insights.length} insights</Badge>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <div className="text-center py-12">
              <Lightbulb className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No insights available. Connect GA4 & Search Console to generate AI recommendations.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Summary badges */}
              <div className="flex gap-2 flex-wrap mb-4">
                {grouped.error.length > 0 && <Badge className="bg-red-500/20 text-red-400 border-red-500/30">🔴 {grouped.error.length} Critical</Badge>}
                {grouped.warning.length > 0 && <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">🟡 {grouped.warning.length} Opportunities</Badge>}
                {grouped.info.length > 0 && <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">🔵 {grouped.info.length} Suggestions</Badge>}
                {grouped.success.length > 0 && <Badge className="bg-green-500/20 text-green-400 border-green-500/30">🟢 {grouped.success.length} Wins</Badge>}
              </div>

              {insights.map((insight: any, i: number) => {
                const config = severityConfig[insight.severity] || severityConfig.info;
                const Icon = config.icon;
                return (
                  <div key={i} className={`rounded-lg border ${config.border} ${config.bg} p-4`}>
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 ${config.text} mt-0.5 shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm text-foreground">{insight.title}</p>
                          <Badge variant="outline" className="text-[10px]">{typeLabels[insight.type] || insight.type}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                        {insight.metric && (
                          <p className={`text-xs ${config.text} mt-1 font-medium`}>{insight.metric}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader><CardTitle className="text-base">Recommended Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { action: "Review and update meta titles for pages with low CTR", priority: "High" },
              { action: "Add internal links to keywords in position 4-20", priority: "High" },
              { action: "Improve content on pages with bounce rate > 70%", priority: "Medium" },
              { action: "Add schema markup to course and coach pages", priority: "Medium" },
              { action: "Monitor indexed pages weekly for coverage issues", priority: "Low" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <Badge variant={item.priority === "High" ? "destructive" : "outline"} className="text-xs shrink-0 w-16 justify-center">
                  {item.priority}
                </Badge>
                <span className="text-sm text-foreground">{item.action}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SEOAIInsights;
