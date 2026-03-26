import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Upload } from "lucide-react";

const CATEGORIES = ["General", "AI Research", "AI Tools", "Templates", "Guides", "Worksheets", "Case Studies"];
const FILE_TYPES = ["pdf", "doc", "xls", "image", "video", "link"];

interface MaterialFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingMaterial?: any;
  onSaved: () => void;
  coachId?: string;
}

const MaterialFormDialog = ({ open, onOpenChange, editingMaterial, onSaved, coachId }: MaterialFormDialogProps) => {
  const [form, setForm] = useState(() => getInitialForm(editingMaterial));
  const [uploading, setUploading] = useState(false);

  function getInitialForm(m?: any) {
    return {
      title: m?.title || "",
      description: m?.description || "",
      category: m?.category || "General",
      file_url: m?.file_url || "",
      file_type: m?.file_type || "pdf",
      external_url: m?.external_url || "",
      is_published: m?.is_published ?? true,
      is_downloadable: m?.is_downloadable ?? true,
      thumbnail_url: m?.thumbnail_url || "",
    };
  }

  // Reset form when dialog opens with new data
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setForm(getInitialForm(editingMaterial));
    }
    onOpenChange(isOpen);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExts = ["pdf", "docx", "doc", "ppt", "pptx", "xls", "xlsx", "zip"];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!allowedExts.includes(ext)) {
      toast.error("Allowed: PDF, DOCX, PPT, XLS, ZIP");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File must be under 20MB");
      return;
    }

    setUploading(true);
    const path = `files/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("materials").upload(path, file);
    if (error) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("materials").getPublicUrl(path);
    const fileTypeMap: Record<string, string> = { pdf: "pdf", doc: "doc", docx: "doc", ppt: "doc", pptx: "doc", xls: "xls", xlsx: "xls", zip: "pdf" };
    setForm((prev) => ({ ...prev, file_url: urlData.publicUrl, file_type: fileTypeMap[ext] || "pdf" }));
    setUploading(false);
    toast.success("File uploaded");
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.file_url && !form.external_url.trim()) {
      toast.error("Upload a file or add a link");
      return;
    }

    let resourceType = "file";
    if (form.file_url && form.external_url.trim()) resourceType = "both";
    else if (!form.file_url && form.external_url.trim()) resourceType = "link";

    if (form.external_url.trim()) {
      try { new URL(form.external_url); } catch {
        toast.error("Invalid URL format");
        return;
      }
    }

    const payload: any = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category,
      file_url: form.file_url || null,
      file_type: resourceType === "link" ? "link" : form.file_type,
      external_url: form.external_url.trim() || null,
      resource_type: resourceType,
      is_published: form.is_published,
      is_downloadable: form.is_downloadable,
      is_email_shareable: true,
      thumbnail_url: form.thumbnail_url || null,
    };

    if (editingMaterial) {
      const { error } = await supabase.from("materials").update(payload).eq("id", editingMaterial.id);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Material updated");
    } else {
      const { error } = await supabase.from("materials").insert(payload);
      if (error) { toast.error("Failed to create"); return; }
      toast.success("Material created");
    }
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingMaterial ? "Edit Material" : "Add New Material"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Material title" />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Optional description" rows={3} />
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Upload Document (PDF, DOCX, PPT, XLS, ZIP)</Label>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" asChild disabled={uploading}>
                <label className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-1.5" />
                  {uploading ? "Uploading..." : "Choose File"}
                  <input type="file" className="hidden" accept=".pdf,.docx,.doc,.ppt,.pptx,.xls,.xlsx,.zip" onChange={handleFileUpload} />
                </label>
              </Button>
              {form.file_url && <span className="text-xs text-green-600 truncate max-w-[200px]">✓ File uploaded</span>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>OR Material Link (URL)</Label>
            <Input value={form.external_url} onChange={(e) => setForm((p) => ({ ...p, external_url: e.target.value }))} placeholder="https://example.com/resource" type="url" />
          </div>

          {!form.file_url && !form.external_url.trim() && (
            <p className="text-xs text-destructive">At least one required: File or Link</p>
          )}

          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <Switch checked={form.is_published} onCheckedChange={(v) => setForm((p) => ({ ...p, is_published: v }))} />
              <Label className="text-sm">Published</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_downloadable} onCheckedChange={(v) => setForm((p) => ({ ...p, is_downloadable: v }))} />
              <Label className="text-sm">Downloadable</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={uploading}>{editingMaterial ? "Update" : "Create"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialFormDialog;
