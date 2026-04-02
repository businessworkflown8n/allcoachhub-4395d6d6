import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Upload, X, ImageIcon } from "lucide-react";
import { useCoachCategoryPermissions } from "@/hooks/useCoachCategoryPermissions";
import { useCoachCategories } from "@/hooks/useCoachCategories";
import CategoryRequestModal from "@/components/coach/CategoryRequestModal";

const CoachCourseForm = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [saving, setSaving] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [thumbnailRequestNote, setThumbnailRequestNote] = useState("");
  const [showThumbRequest, setShowThumbRequest] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { approvedCategories, requests, loading: permLoading, refetch: refetchPerms } = useCoachCategoryPermissions(user?.id);
  const { categories: allCategories } = useCoachCategories(true);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    level: "Beginner",
    language: "English",
    duration_hours: "",
    price_usd: "",
    price_inr: "",
    original_price_usd: "",
    original_price_inr: "",
    discount_percent: "",
  });

  // Set default category to primary approved category
  useEffect(() => {
    if (!isEdit && approvedCategories.length > 0 && !form.category) {
      const primary = approvedCategories.find((c) => c.is_primary);
      setForm((prev) => ({ ...prev, category: primary?.category_name || approvedCategories[0].category_name }));
    }
  }, [approvedCategories, isEdit]);

  useEffect(() => {
    if (isEdit && user) {
      supabase.from("courses").select("*").eq("id", id).eq("coach_id", user.id).single().then(({ data }) => {
        if (data) {
          setForm({
            title: data.title,
            description: data.description || "",
            category: data.category,
            level: data.level,
            language: data.language,
            duration_hours: String(data.duration_hours),
            price_usd: String(data.price_usd),
            price_inr: String(data.price_inr),
            original_price_usd: data.original_price_usd ? String(data.original_price_usd) : "",
            original_price_inr: data.original_price_inr ? String(data.original_price_inr) : "",
            discount_percent: data.discount_percent ? String(data.discount_percent) : "",
          });
          if (data.thumbnail_url) setThumbnailPreview(data.thumbnail_url);
        }
      });
    }
  }, [id, user, isEdit]);

  const updateField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  // Categories not yet approved and not pending
  const pendingCategoryIds = new Set(requests.filter((r) => r.status === "pending").map((r) => r.requested_category_id));
  const approvedCategoryIds = new Set(approvedCategories.map((c) => c.category_id));
  const requestableCategories = allCategories.filter(
    (c) => !approvedCategoryIds.has(c.id) && !pendingCategoryIds.has(c.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!form.category) {
      toast({ title: "Category is required", variant: "destructive" });
      return;
    }

    // Validate category is approved
    const isApproved = approvedCategories.some((c) => c.category_name === form.category);
    if (!isApproved) {
      toast({ title: "You can only create courses in your approved categories", variant: "destructive" });
      return;
    }

    setSaving(true);

    const payload = {
      coach_id: user.id,
      title: form.title,
      description: form.description,
      category: form.category,
      level: form.level,
      language: form.language,
      duration_hours: Number(form.duration_hours) || 0,
      price_usd: Number(form.price_usd) || 0,
      price_inr: Number(form.price_inr) || 0,
      original_price_usd: form.original_price_usd ? Number(form.original_price_usd) : null,
      original_price_inr: form.original_price_inr ? Number(form.original_price_inr) : null,
      discount_percent: form.discount_percent ? Number(form.discount_percent) : 0,
    };

    let error;
    if (isEdit) {
      ({ error } = await supabase.from("courses").update(payload).eq("id", id));
    } else {
      ({ error } = await supabase.from("courses").insert(payload));
    }

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: isEdit ? "Course updated" : "Course created" });
      navigate("/coach/courses");
    }
  };

  if (permLoading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  return (
    <div className="max-w-2xl space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h2 className="text-xl font-bold text-foreground">{isEdit ? "Edit Course" : "Create New Course"}</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-foreground">Course Title *</Label>
          <Input value={form.title} onChange={(e) => updateField("title", e.target.value)} required className="bg-secondary border-border" />
        </div>

        <div className="space-y-2">
          <Label className="text-foreground">Description</Label>
          <Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} className="bg-secondary border-border" rows={4} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-foreground">Category *</Label>
            <Select value={form.category} onValueChange={(v) => updateField("category", v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {approvedCategories.map((cat) => (
                  <SelectItem key={cat.category_id} value={cat.category_name}>
                    {cat.category_icon ? `${cat.category_icon} ` : ""}{cat.category_name}
                    {cat.is_primary ? " (Primary)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">You can create courses only in your approved categories.</p>
            <button
              type="button"
              onClick={() => setRequestModalOpen(true)}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Plus className="h-3 w-3" /> Want to teach in another category? Request approval
            </button>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Level</Label>
            <Select value={form.level} onValueChange={(v) => updateField("level", v)}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Language</Label>
            <Input value={form.language} onChange={(e) => updateField("language", e.target.value)} className="bg-secondary border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Duration (hours) *</Label>
            <Input type="number" value={form.duration_hours} onChange={(e) => updateField("duration_hours", e.target.value)} required className="bg-secondary border-border" />
          </div>
        </div>

        <h3 className="text-sm font-semibold text-foreground pt-2">Pricing</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-foreground">Price (USD) *</Label>
            <Input type="number" value={form.price_usd} onChange={(e) => updateField("price_usd", e.target.value)} required className="bg-secondary border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Price (INR) *</Label>
            <Input type="number" value={form.price_inr} onChange={(e) => updateField("price_inr", e.target.value)} required className="bg-secondary border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Original Price (USD)</Label>
            <Input type="number" value={form.original_price_usd} onChange={(e) => updateField("original_price_usd", e.target.value)} className="bg-secondary border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Original Price (INR)</Label>
            <Input type="number" value={form.original_price_inr} onChange={(e) => updateField("original_price_inr", e.target.value)} className="bg-secondary border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Discount %</Label>
            <Input type="number" value={form.discount_percent} onChange={(e) => updateField("discount_percent", e.target.value)} className="bg-secondary border-border" />
          </div>
        </div>

        <button type="submit" disabled={saving} className="glow-lime rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50">
          {saving ? "Saving..." : isEdit ? "Update Course" : "Create Course"}
        </button>
      </form>

      {/* Pending requests info */}
      {requests.filter((r) => r.status === "pending").length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">Pending Category Requests</h4>
          <div className="space-y-1">
            {requests.filter((r) => r.status === "pending").map((r) => (
              <p key={r.id} className="text-xs text-muted-foreground">
                {r.category_icon} {r.category_name} — <span className="text-yellow-400">Pending</span>
              </p>
            ))}
          </div>
        </div>
      )}

      <CategoryRequestModal
        open={requestModalOpen}
        onOpenChange={setRequestModalOpen}
        coachId={user?.id || ""}
        availableCategories={requestableCategories}
        onSuccess={refetchPerms}
      />
    </div>
  );
};

export default CoachCourseForm;
