import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { analyzeSEO } from "@/lib/seoScorer";
import SEOScoreIndicator from "./SEOScoreIndicator";

interface SEOPageRow {
  id: string;
  page_url: string;
  page_type: string;
  meta_title: string | null;
  meta_description: string | null;
  h1_tag: string | null;
  primary_keyword: string | null;
  secondary_keywords: string[] | null;
  robots_directive: string;
  canonical_url: string | null;
  schema_markup: any;
  seo_score: number;
  index_status: string;
  last_crawled_at: string | null;
  crawl_errors: string | null;
  is_auto_generated: boolean;
  content_length?: number;
  image_count?: number;
  images_with_alt?: number;
}

interface Props {
  page: SEOPageRow;
  onClose: () => void;
}

const SEOEditorPanel = ({ page, onClose }: Props) => {
  const [form, setForm] = useState({
    meta_title: page.meta_title || "",
    meta_description: page.meta_description || "",
    h1_tag: page.h1_tag || "",
    primary_keyword: page.primary_keyword || "",
    secondary_keywords: (page.secondary_keywords || []).join(", "),
    robots_directive: page.robots_directive,
    canonical_url: page.canonical_url || "",
    schema_markup: page.schema_markup ? JSON.stringify(page.schema_markup, null, 2) : "",
    index_status: page.index_status,
  });
  const [saving, setSaving] = useState(false);

  // Real-time SEO analysis
  const analysis = useMemo(() => {
    let schemaJson = null;
    try { schemaJson = form.schema_markup.trim() ? JSON.parse(form.schema_markup) : null; } catch { /* ignore */ }
    return analyzeSEO({
      metaTitle: form.meta_title,
      metaDescription: form.meta_description,
      h1Tag: form.h1_tag,
      primaryKeyword: form.primary_keyword,
      canonicalUrl: form.canonical_url,
      schemaMarkup: schemaJson,
      pageUrl: page.page_url,
      contentLength: page.content_length || 0,
      imageCount: page.image_count || 0,
      imagesWithAlt: page.images_with_alt || 0,
    });
  }, [form, page.page_url, page.content_length, page.image_count, page.images_with_alt]);

  const handleSave = async () => {
    setSaving(true);
    let schemaJson = null;
    if (form.schema_markup.trim()) {
      try {
        schemaJson = JSON.parse(form.schema_markup);
      } catch {
        toast({ title: "Invalid JSON", description: "Schema markup must be valid JSON.", variant: "destructive" });
        setSaving(false);
        return;
      }
    }

    const secondaryArr = form.secondary_keywords.split(",").map(k => k.trim()).filter(Boolean);

    const { error } = await supabase
      .from("seo_page_metadata")
      .update({
        meta_title: form.meta_title || null,
        meta_description: form.meta_description || null,
        h1_tag: form.h1_tag || null,
        primary_keyword: form.primary_keyword || null,
        secondary_keywords: secondaryArr,
        robots_directive: form.robots_directive,
        canonical_url: form.canonical_url || null,
        schema_markup: schemaJson,
        index_status: form.index_status,
        seo_score: analysis.score,
        seo_suggestions: analysis.suggestions,
        updated_at: new Date().toISOString(),
      })
      .eq("id", page.id);

    if (error) {
      toast({ title: "Save Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "SEO metadata updated successfully." });
      onClose();
    }
    setSaving(false);
  };

  const titleLen = form.meta_title.length;
  const descLen = form.meta_description.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Edit SEO: {page.page_url}</h3>
          <Badge variant="outline" className="capitalize">{page.page_type}</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Form fields */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Meta Tags</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Meta Title <span className={titleLen > 60 ? "text-destructive" : "text-muted-foreground"}>({titleLen}/60)</span></Label>
                <Input value={form.meta_title} onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))} maxLength={70} />
                <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full transition-all ${titleLen >= 30 && titleLen <= 60 ? "bg-green-500" : titleLen > 0 ? "bg-yellow-500" : "bg-muted"}`} style={{ width: `${Math.min((titleLen / 60) * 100, 100)}%` }} />
                </div>
              </div>
              <div>
                <Label>Meta Description <span className={descLen > 160 ? "text-destructive" : "text-muted-foreground"}>({descLen}/160)</span></Label>
                <Textarea value={form.meta_description} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))} maxLength={170} rows={3} />
                <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full transition-all ${descLen >= 120 && descLen <= 160 ? "bg-green-500" : descLen > 50 ? "bg-yellow-500" : "bg-muted"}`} style={{ width: `${Math.min((descLen / 160) * 100, 100)}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Headings & Keywords</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>H1 Tag</Label>
                <Input value={form.h1_tag} onChange={e => setForm(f => ({ ...f, h1_tag: e.target.value }))} />
              </div>
              <div>
                <Label>Focus Keyword</Label>
                <Input value={form.primary_keyword} onChange={e => setForm(f => ({ ...f, primary_keyword: e.target.value }))} placeholder="e.g. ai marketing course" />
              </div>
              <div>
                <Label>Secondary Keywords (comma separated)</Label>
                <Input value={form.secondary_keywords} onChange={e => setForm(f => ({ ...f, secondary_keywords: e.target.value }))} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Robots & Canonical</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Robots Directive</Label>
                <Select value={form.robots_directive} onValueChange={v => setForm(f => ({ ...f, robots_directive: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="index, follow">index, follow</SelectItem>
                    <SelectItem value="noindex, follow">noindex, follow</SelectItem>
                    <SelectItem value="noindex, nofollow">noindex, nofollow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Canonical URL</Label>
                <Input value={form.canonical_url} onChange={e => setForm(f => ({ ...f, canonical_url: e.target.value }))} />
              </div>
              <div>
                <Label>Index Status</Label>
                <Select value={form.index_status} onValueChange={v => setForm(f => ({ ...f, index_status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indexed">Indexed</SelectItem>
                    <SelectItem value="not_indexed">Not Indexed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Schema Markup (JSON-LD)</CardTitle></CardHeader>
            <CardContent>
              <Textarea
                value={form.schema_markup}
                onChange={e => setForm(f => ({ ...f, schema_markup: e.target.value }))}
                rows={8}
                className="font-mono text-xs"
                placeholder='{"@context":"https://schema.org","@type":"Course",...}'
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: Score & Preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">SEO Analysis</CardTitle></CardHeader>
            <CardContent>
              <SEOScoreIndicator score={analysis.score} checks={analysis.checks} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">SERP Preview</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border bg-background p-4 space-y-1">
                <p className="text-sm text-blue-500 truncate font-medium">{form.meta_title || "Page Title"}</p>
                <p className="text-xs text-green-600 truncate">https://www.aicoachportal.com{page.page_url}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{form.meta_description || "No description set."}</p>
              </div>
            </CardContent>
          </Card>

          {analysis.suggestions.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Suggestions</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {analysis.suggestions.map((s, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-yellow-500 mt-0.5">•</span> {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default SEOEditorPanel;
