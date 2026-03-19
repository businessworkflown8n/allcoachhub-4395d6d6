import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Search, Globe, BarChart3, Wand2 } from "lucide-react";
import SEOPageManager from "./seo/SEOPageManager";
import SEOKeywordManager from "./seo/SEOKeywordManager";
import SEOIndexingCenter from "./seo/SEOIndexingCenter";
import SEOPerformanceTracking from "./seo/SEOPerformanceTracking";
import SEOTemplateEngine from "./seo/SEOTemplateEngine";

const AdminSEODashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">SEO Control Dashboard</h2>
        <p className="text-sm text-muted-foreground">Manage indexing, metadata, keywords, and performance across all public pages.</p>
      </div>

      <Tabs defaultValue="pages" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1">
          <TabsTrigger value="pages" className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Pages
          </TabsTrigger>
          <TabsTrigger value="keywords" className="flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5" /> Keywords
          </TabsTrigger>
          <TabsTrigger value="indexing" className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" /> Indexing
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Performance
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-1.5">
            <Wand2 className="h-3.5 w-3.5" /> Templates
          </TabsTrigger>
        </TabsList>

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
