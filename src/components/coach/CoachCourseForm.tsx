import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const CoachCourseForm = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [saving, setSaving] = useState(false);
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
        }
      });
    }
  }, [id, user, isEdit]);

  const updateField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
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
            <Input value={form.category} onChange={(e) => updateField("category", e.target.value)} required className="bg-secondary border-border" placeholder="e.g. Prompt Engineering" />
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
    </div>
  );
};

export default CoachCourseForm;
