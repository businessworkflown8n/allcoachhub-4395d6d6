import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props { open: boolean; onClose: () => void; }

const BundleCreator = ({ open, onClose }: Props) => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [form, setForm] = useState({ title: "", priceUsd: "", priceInr: "" });
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const [cRes, bRes] = await Promise.all([
      supabase.from("courses").select("id, title").eq("coach_id", user.id),
      supabase.from("program_bundles").select("*").eq("coach_id", user.id).order("created_at", { ascending: false }),
    ]);
    setCourses(cRes.data || []);
    setBundles(bRes.data || []);
  };

  useEffect(() => { if (open) fetchData(); }, [open, user]);

  const toggleCourse = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  };

  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error("Bundle title is required"); return; }
    if (selected.length < 2) { toast.error("Select at least 2 programs"); return; }
    setLoading(true);
    const { data: bundle, error } = await supabase.from("program_bundles").insert({
      coach_id: user!.id,
      title: form.title,
      bundle_price_usd: Number(form.priceUsd) || 0,
      bundle_price_inr: Number(form.priceInr) || 0,
      is_published: true,
    }).select("id").single();

    if (error || !bundle) { toast.error(error?.message || "Failed"); setLoading(false); return; }

    const items = selected.map((course_id) => ({ bundle_id: bundle.id, course_id }));
    const { error: itemErr } = await supabase.from("bundle_items").insert(items);
    if (itemErr) toast.error(itemErr.message);
    else { toast.success("Bundle created!"); setForm({ title: "", priceUsd: "", priceInr: "" }); setSelected([]); fetchData(); }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bundle Programs</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input placeholder="Bundle Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" placeholder="Price (USD)" value={form.priceUsd} onChange={(e) => setForm({ ...form, priceUsd: e.target.value })} />
            <Input type="number" placeholder="Price (INR)" value={form.priceInr} onChange={(e) => setForm({ ...form, priceInr: e.target.value })} />
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Select Programs</p>
            <div className="space-y-2 max-h-40 overflow-y-auto rounded-lg border border-border p-2">
              {courses.map((c) => (
                <label key={c.id} className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                  <Checkbox checked={selected.includes(c.id)} onCheckedChange={() => toggleCourse(c.id)} />
                  {c.title}
                </label>
              ))}
              {courses.length === 0 && <p className="text-sm text-muted-foreground">No courses yet</p>}
            </div>
          </div>

          <Button onClick={handleCreate} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Bundle"}
          </Button>

          {/* Existing Bundles */}
          {bundles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Your Bundles</p>
              {bundles.map((b) => (
                <div key={b.id} className="rounded-lg border border-border p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{b.title}</p>
                    <p className="text-xs text-muted-foreground">${Number(b.bundle_price_usd).toFixed(0)} · {b.sales_count} sales</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${b.is_published ? "bg-emerald-500/20 text-emerald-400" : "bg-secondary text-muted-foreground"}`}>
                    {b.is_published ? "Live" : "Draft"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BundleCreator;
