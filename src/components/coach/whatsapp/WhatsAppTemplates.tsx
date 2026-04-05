import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

interface Template {
  id: string;
  name: string;
  category: string;
  content: string;
  variables: string[];
  status: string;
}

const categoryColors: Record<string, string> = {
  promotion: "default",
  event: "secondary",
  reminder: "outline",
  followup: "secondary",
  onboarding: "default",
};

const WhatsAppTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("whatsapp_templates").select("*").order("created_at", { ascending: false });
      setTemplates((data as Template[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <p className="text-muted-foreground text-center py-8">Loading templates...</p>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Message Templates</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((t) => (
          <Card key={t.id}>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground">{t.name}</span>
                </div>
                <div className="flex gap-2">
                  <Badge variant={(categoryColors[t.category] as any) || "secondary"} className="capitalize">{t.category}</Badge>
                  <Badge variant={t.status === "approved" ? "default" : "secondary"}>{t.status}</Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 font-mono">{t.content}</p>
              {t.variables && t.variables.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {t.variables.map((v) => (
                    <Badge key={v} variant="outline" className="text-xs">
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {templates.length === 0 && (
          <p className="text-muted-foreground col-span-2 text-center py-8">No templates available.</p>
        )}
      </div>
    </div>
  );
};

export default WhatsAppTemplates;
