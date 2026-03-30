import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Search, Plus, Pencil, Trash2, ArrowUp, ArrowDown, GripVertical, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const generateSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

const AdminCoachCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [coachCounts, setCoachCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formIcon, setFormIcon] = useState("");
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    // Admin needs to see ALL categories (active + inactive), so use service approach
    // Since RLS only allows SELECT on active ones for public, admins have the ALL policy
    const { data, error } = await supabase
      .from("coach_categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error);
      toast({ title: "Error loading categories", description: error.message, variant: "destructive" });
    }
    setCategories((data as Category[]) || []);

    // Get coach counts per category
    const { data: profiles } = await supabase
      .from("profiles")
      .select("category_id")
      .not("category_id", "is", null);

    const counts: Record<string, number> = {};
    (profiles || []).forEach((p: any) => {
      counts[p.category_id] = (counts[p.category_id] || 0) + 1;
    });
    setCoachCounts(counts);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const filtered = useMemo(() => {
    if (!search) return categories;
    const q = search.toLowerCase();
    return categories.filter(c => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
  }, [categories, search]);

  const openCreate = () => {
    setEditing(null);
    setFormName("");
    setFormSlug("");
    setFormIcon("");
    setFormSortOrder(categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) + 1 : 1);
    setFormActive(true);
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormIcon(cat.icon || "");
    setFormSortOrder(cat.sort_order);
    setFormActive(cat.is_active);
    setDialogOpen(true);
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editing) setFormSlug(generateSlug(val));
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    const slug = formSlug.trim() || generateSlug(formName);

    // Check duplicate name/slug
    const dupName = categories.find(c => c.name.toLowerCase() === formName.trim().toLowerCase() && c.id !== editing?.id);
    const dupSlug = categories.find(c => c.slug === slug && c.id !== editing?.id);
    if (dupName) { toast({ title: "Duplicate category name", variant: "destructive" }); return; }
    if (dupSlug) { toast({ title: "Duplicate slug", variant: "destructive" }); return; }

    setSaving(true);

    const payload = {
      name: formName.trim(),
      slug,
      icon: formIcon.trim() || null,
      sort_order: formSortOrder,
      is_active: formActive,
    };

    if (editing) {
      const { error } = await supabase.from("coach_categories").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSaving(false); return; }
      toast({ title: "Category updated" });
    } else {
      const { error } = await supabase.from("coach_categories").insert(payload);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSaving(false); return; }
      toast({ title: "Category created" });
    }

    setSaving(false);
    setDialogOpen(false);
    fetchCategories();
  };

  const handleDelete = async (cat: Category) => {
    const count = coachCounts[cat.id] || 0;
    if (count > 0) {
      toast({
        title: "Cannot delete",
        description: `${count} coach(es) are using this category. Deactivate it instead, or reassign coaches first.`,
        variant: "destructive",
      });
      return;
    }
    if (!confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("coach_categories").delete().eq("id", cat.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Category deleted" });
    fetchCategories();
  };

  const toggleActive = async (cat: Category) => {
    const { error } = await supabase.from("coach_categories").update({ is_active: !cat.is_active }).eq("id", cat.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: cat.is_active ? "Category deactivated" : "Category activated" });
    fetchCategories();
  };

  const moveOrder = async (cat: Category, direction: "up" | "down") => {
    const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex(c => c.id === cat.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const other = sorted[swapIdx];
    await Promise.all([
      supabase.from("coach_categories").update({ sort_order: other.sort_order }).eq("id", cat.id),
      supabase.from("coach_categories").update({ sort_order: cat.sort_order }).eq("id", other.id),
    ]);
    fetchCategories();
  };

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Coach Categories</h2>
          <p className="text-sm text-muted-foreground">{categories.length} categories · {categories.filter(c => c.is_active).length} active</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search categories..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Icon</TableHead>
              <TableHead className="text-center">Coaches</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No categories found</TableCell></TableRow>
            ) : filtered.map((cat, i) => (
              <TableRow key={cat.id} className={!cat.is_active ? "opacity-60" : ""}>
                <TableCell className="text-muted-foreground">{cat.sort_order}</TableCell>
                <TableCell className="font-medium">{cat.icon && <span className="mr-1">{cat.icon}</span>}{cat.name}</TableCell>
                <TableCell className="text-muted-foreground font-mono text-xs">{cat.slug}</TableCell>
                <TableCell>{cat.icon || "—"}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="gap-1"><Users className="h-3 w-3" />{coachCounts[cat.id] || 0}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={cat.is_active ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleActive(cat)}>
                    {cat.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveOrder(cat, "up")} disabled={cat.sort_order <= 1}>
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveOrder(cat, "down")}>
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(cat)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(cat)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={formName} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. Career" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={formSlug} onChange={e => setFormSlug(e.target.value)} placeholder="auto-generated" className="font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <Label>Icon / Emoji (optional)</Label>
              <Input value={formIcon} onChange={e => setFormIcon(e.target.value)} placeholder="e.g. 🎯" />
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input type="number" value={formSortOrder} onChange={e => setFormSortOrder(Number(e.target.value))} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={formActive} onCheckedChange={setFormActive} />
              <Label>Active</Label>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : editing ? "Update Category" : "Create Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCoachCategories;
