import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Sparkles, RefreshCw, Check, Loader2 } from "lucide-react";

interface AIThumbnailGeneratorProps {
  courseTitle: string;
  onSelect: (dataUrl: string) => void;
}

const AIThumbnailGenerator = ({ courseTitle, onSelect }: AIThumbnailGeneratorProps) => {
  const defaultPrompt = `Create a professional course thumbnail for "${courseTitle}" with bold text, modern design, high contrast, 16:9, 1280x720 pixels`;
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const generate = async () => {
    if (!prompt.trim()) { toast({ title: "Please enter a prompt", variant: "destructive" }); return; }
    setLoading(true);
    setImages([]);
    setSelectedIdx(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-thumbnail", {
        body: { prompt: prompt.trim(), count: 3 },
      });

      if (error) throw error;
      if (data?.error) {
        toast({ title: "Generation failed", description: data.error, variant: "destructive" });
        setLoading(false);
        return;
      }

      setImages(data.images || []);
      if (!data.images?.length) toast({ title: "No images were generated", variant: "destructive" });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error generating thumbnails", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleSelect = (idx: number) => {
    setSelectedIdx(idx);
    onSelect(images[idx]);
    toast({ title: "Thumbnail selected! It will be used when you save the course." });
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h4 className="font-semibold text-foreground text-sm">Generate Thumbnail with AI</h4>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground text-xs">Prompt (editable)</Label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="bg-secondary border-border text-sm"
          rows={3}
        />
      </div>

      <div className="flex gap-2">
        <Button type="button" onClick={generate} disabled={loading} size="sm" className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Generating..." : "Generate Thumbnail"}
        </Button>
        {images.length > 0 && (
          <Button type="button" onClick={generate} disabled={loading} size="sm" variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Regenerate
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-xs text-muted-foreground">Generating {3} variations...</p>
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`relative cursor-pointer rounded-lg border-2 overflow-hidden transition-all ${
                selectedIdx === idx ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
              }`}
              onClick={() => handleSelect(idx)}
            >
              <img src={img} alt={`Variation ${idx + 1}`} className="w-full aspect-video object-cover" />
              {selectedIdx === idx && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                  <div className="rounded-full bg-primary p-1.5">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleSelect(idx); }}
                className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-md bg-card/90 px-3 py-1 text-xs font-medium text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Use Thumbnail
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIThumbnailGenerator;
