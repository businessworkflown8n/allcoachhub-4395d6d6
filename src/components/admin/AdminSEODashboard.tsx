import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Search, Globe, BarChart3, Wand2, TrendingUp, Key, Lightbulb, Filter } from "lucide-react";
import SEOPageManager from "./seo/SEOPageManager";
import SEOKeywordManager from "./seo/SEOKeywordManager";
import SEOIndexingCenter from "./seo/SEOIndexingCenter";
import SEOPerformanceTracking from "./seo/SEOPerformanceTracking";
import SEOTemplateEngine from "./seo/SEOTemplateEngine";
import SEOTrafficOverview from "./seo/SEOTrafficOverview";
import SEOKeywordPerformance from "./seo/SEOKeywordPerformance";
import SEOFunnelEngagement from "./seo/SEOFunnelEngagement";
import SEOAIInsights from "./seo/SEOAIInsights";

const AdminSEODashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">SEO Control Dashboard</h2>
        <p className="text-sm text-muted-foreground">Manage indexing, metadata, keywords, performance, and AI insights across all public pages.</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="keywords-live" className="flex items-center gap-1.5">
            <Key className="h-3.5 w-3.5" /> Keywords
          </TabsTrigger>
          <TabsTrigger value="funnel" className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" /> Funnel & Engagement
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5" /> AI Insights
          </TabsTrigger>
          <TabsTrigger value="pages" className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Pages
          </TabsTrigger>
          <TabsTrigger value="keywords" className="flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5" /> Keyword DB
          </TabsTrigger>
          <TabsTrigger value="indexing" className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" /> Indexing
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Health
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-1.5">
            <Wand2 className="h-3.5 w-3.5" /> Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><SEOTrafficOverview /></TabsContent>
        <TabsContent value="keywords-live"><SEOKeywordPerformance /></TabsContent>
        <TabsContent value="funnel"><SEOFunnelEngagement /></TabsContent>
        <TabsContent value="insights"><SEOAIInsights /></TabsContent>
        <TabsContent value="pages"><SEOPageManager /></TabsContent>
        <TabsContent value="keywords"><SEOKeywordManager /></TabsContent>
        <TabsContent value="indexing"><SEOIndexingCenter /></TabsContent>
        <TabsContent value="performance"><SEOPerformanceTracking /></TabsContent>
        <TabsContent value="templates"><SEOTemplateEngine /></TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSEODashboard;
