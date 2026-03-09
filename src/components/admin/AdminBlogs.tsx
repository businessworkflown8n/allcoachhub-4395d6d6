import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, Eye, EyeOff, FileText, TrendingUp, BarChart3, Search } from "lucide-react";

const CATEGORIES = [
  "AI Trends",
  "AI in Education",
  "AI Tools",
  "AI Fundamentals",
  "AI Careers",
  "AI Research",
  "AI Policy",
  "Weekly Update",
];

const CTA_OPTIONS = [
  { text: "Join AI Course", link: "/courses" },
  { text: "Watch AI Webinar", link: "/webinars" },
  { text: "Become AI Coach", link: "/auth?mode=signup" },
];

type Blog = {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string;
  content: string | null;
  category: string;
  image_url: string | null;
  author: string | null;
  published_at: string;
  is_published: boolean;
  meta_title: string | null;
  meta_description: string | null;
  read_time: string;
  blog_type: string;
  cta_text: string | null;
  cta_link: string | null;
  tags: string[] | null;
};

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "AI Trends",
  image_url: "",
  author: "AI Coach Portal",
  published_at: new Date().toISOString().slice(0, 16),
  is_published: true,
  meta_title: "",
  meta_description: "",
  read_time: "5 min read",
  blog_type: "article",
  cta_text: "",
  cta_link: "/courses",
  tags: "",
};

const AdminBlogs = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  const fetchBlogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ai_blogs")
      .select("*")
      .order("published_at", { ascending: false });
    if (!error && data) setBlogs(data as unknown as Blog[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (blog: Blog) => {
    setEditing(blog.id);
    setForm({
      title: blog.title,
      slug: blog.slug || "",
      excerpt: blog.excerpt,
      content: blog.content || "",
      category: blog.category,
      image_url: blog.image_url || "",
      author: blog.author || "AI Coach Portal",
      published_at: blog.published_at.slice(0, 16),
      is_published: blog.is_published,
      meta_title: blog.meta_title || "",
      meta_description: blog.meta_description || "",
      read_time: blog.read_time,
      blog_type: blog.blog_type,
      cta_text: blog.cta_text || "",
      cta_link: blog.cta_link || "/courses",
      tags: (blog.tags || []).join(", "),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.excerpt.trim()) {
      toast.error("Title and excerpt are required");
      return;
    }

    const payload: any = {
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      content: form.content || null,
      category: form.category,
      image_url: form.image_url || null,
      author: form.author || "AI Coach Portal",
      published_at: new Date(form.published_at).toISOString(),
      is_published: form.is_published,
      meta_title: form.meta_title || null,
      meta_description: form.meta_description || null,
      read_time: form.read_time || "5 min read",
      blog_type: form.blog_type,
      cta_text: form.cta_text || null,
      cta_link: form.cta_link || null,
      tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
    };

    // Only set slug on create (let trigger handle it), or if manually changed on edit
    if (form.slug.trim()) {
      payload.slug = form.slug.trim();
    }

    if (editing) {
      const { error } = await supabase.from("ai_blogs").update(payload).eq("id", editing);
      if (error) {
        toast.error("Failed to update blog");
        return;
      }
      toast.success("Blog updated");
    } else {
      const { error } = await supabase.from("ai_blogs").insert(payload);
      if (error) {
        toast.error("Failed to create blog");
        return;
      }
      toast.success("Blog created");
    }

    setDialogOpen(false);
    fetchBlogs();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this blog permanently?")) return;
    const { error } = await supabase.from("ai_blogs").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Blog deleted");
    fetchBlogs();
  };

  const togglePublish = async (blog: Blog) => {
    const { error } = await supabase
      .from("ai_blogs")
      .update({ is_published: !blog.is_published })
      .eq("id", blog.id);
    if (!error) {
      toast.success(blog.is_published ? "Blog unpublished" : "Blog published");
      fetchBlogs();
    }
  };

  const filtered = blogs.filter((b) => {
    const matchCat = filterCategory === "All" || b.category === filterCategory;
    const matchSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalPublished = blogs.filter((b) => b.is_published).length;
  const totalDraft = blogs.filter((b) => !b.is_published).length;
  const topCategory = blogs.reduce((acc, b) => {
    acc[b.category] = (acc[b.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topCatName = Object.entries(topCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{blogs.length}</p>
                <p className="text-sm text-muted-foreground">Total Blogs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Eye className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{totalPublished}</p>
                <p className="text-sm text-muted-foreground">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <EyeOff className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{totalDraft}</p>
                <p className="text-sm text-muted-foreground">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{topCatName}</p>
                <p className="text-sm text-muted-foreground">Top Category</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 flex-1 max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search blogs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Blog
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No blogs found</TableCell>
                </TableRow>
              ) : (
                filtered.map((blog) => (
                  <TableRow key={blog.id}>
                    <TableCell>
                      <div className="max-w-[300px]">
                        <p className="font-medium text-foreground line-clamp-1">{blog.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{blog.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{blog.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={blog.is_published ? "default" : "outline"}>
                        {blog.is_published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(blog.published_at), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => togglePublish(blog)} title={blog.is_published ? "Unpublish" : "Publish"}>
                          {blog.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(blog)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(blog.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Blog" : "Add New Blog"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Blog Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Enter blog title" />
              </div>
              <div className="space-y-2">
                <Label>Slug / URL</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Auto-generated if empty" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Author</Label>
                <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Excerpt / Short Description *</Label>
              <Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Brief summary of the blog" rows={2} />
            </div>

            <div className="space-y-2">
              <Label>Blog Content (Markdown supported)</Label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Write blog content in Markdown..." rows={12} className="font-mono text-sm" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Featured Image URL</Label>
                <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Publish Date</Label>
                <Input type="datetime-local" value={form.published_at} onChange={(e) => setForm({ ...form, published_at: e.target.value })} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Read Time</Label>
                <Input value={form.read_time} onChange={(e) => setForm({ ...form, read_time: e.target.value })} placeholder="5 min read" />
              </div>
              <div className="space-y-2">
                <Label>Tags / Keywords (comma separated)</Label>
                <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="AI, Machine Learning, Tools" />
              </div>
            </div>

            {/* CTA Section */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <Label className="text-base font-semibold">Call-To-Action Button</Label>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm">CTA Button Text</Label>
                  <Select value={form.cta_text || "custom"} onValueChange={(v) => {
                    if (v === "custom") {
                      setForm({ ...form, cta_text: "" });
                    } else {
                      const opt = CTA_OPTIONS.find((o) => o.text === v);
                      setForm({ ...form, cta_text: v, cta_link: opt?.link || form.cta_link });
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select or custom" />
                    </SelectTrigger>
                    <SelectContent>
                      {CTA_OPTIONS.map((o) => (
                        <SelectItem key={o.text} value={o.text}>{o.text}</SelectItem>
                      ))}
                      <SelectItem value="custom">Custom...</SelectItem>
                    </SelectContent>
                  </Select>
                  {(form.cta_text && !CTA_OPTIONS.find((o) => o.text === form.cta_text)) && (
                    <Input value={form.cta_text} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} placeholder="Custom CTA text" />
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">CTA Link</Label>
                  <Input value={form.cta_link} onChange={(e) => setForm({ ...form, cta_link: e.target.value })} placeholder="/courses" />
                </div>
              </div>
            </div>

            {/* SEO Section */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <Label className="text-base font-semibold">SEO Settings</Label>
              <div className="space-y-2">
                <Label className="text-sm">Meta Title</Label>
                <Input value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} placeholder="SEO title (max 60 chars)" maxLength={60} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Meta Description</Label>
                <Textarea value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} placeholder="SEO description (max 160 chars)" rows={2} maxLength={160} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
              <Label>{form.is_published ? "Published" : "Draft"}</Label>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editing ? "Update Blog" : "Create Blog"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBlogs;
