import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Eye, Lock, Search } from "lucide-react";

const CATEGORIES = ["All", "General", "AI Research", "AI Tools", "Templates", "Guides", "Worksheets", "Case Studies"];

const Materials = () => {
  useSEO({
    title: "Learning Materials – AI Coach Portal",
    description: "Access curated AI learning materials, templates, guides, and research documents.",
    canonical: "https://www.aicoachportal.com/materials",
  });

  const { user, loading: authLoading } = useAuth();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [pageEnabled, setPageEnabled] = useState(true);

  useEffect(() => {
    const checkPageEnabled = async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "materials_page_enabled")
        .single();
      if (data) setPageEnabled(data.value === "true");
    };
    checkPageEnabled();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchMaterials = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("materials")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (data) setMaterials(data);
      setLoading(false);
    };
    fetchMaterials();
  }, [user]);

  const filtered = materials.filter((m) => {
    const matchCat = filterCategory === "All" || m.category === filterCategory;
    const matchSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const fileIcon = (type: string) => {
    switch (type) {
      case "pdf": return "📄";
      case "doc": return "📝";
      case "xls": return "📊";
      case "image": return "🖼️";
      case "video": return "🎬";
      default: return "📁";
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16">
        {!pageEnabled ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Lock className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Materials Currently Unavailable</h1>
            <p className="text-muted-foreground">This section is temporarily disabled. Please check back later.</p>
          </div>
        ) : !user ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Lock className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Login Required</h1>
            <p className="text-muted-foreground mb-6">Please login to access learning materials.</p>
            <div className="flex gap-3">
              <Link to="/auth?mode=login" className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90">Sign In</Link>
              <Link to="/auth?mode=signup" className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-accent">Sign Up</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Learning Materials</h1>
              <p className="text-muted-foreground">Browse and download curated AI learning resources</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 flex-1 max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input placeholder="Search materials..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">No materials found</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((m) => (
                  <Link key={m.id} to={`/materials/${m.slug}`}>
                    <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer">
                      {m.thumbnail_url && (
                        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                          <img src={m.thumbnail_url} alt={m.title} className="h-full w-full object-cover" />
                        </div>
                      )}
                      <CardContent className={m.thumbnail_url ? "pt-4" : "pt-6"}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-2xl">{fileIcon(m.file_type)}</span>
                          <Badge variant="secondary" className="shrink-0">{m.category}</Badge>
                        </div>
                        <h3 className="font-semibold text-foreground line-clamp-2 mb-1">{m.title}</h3>
                        {m.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{m.description}</p>}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {m.view_count}</span>
                          <span className="flex items-center gap-1"><Download className="h-3 w-3" /> {m.download_count}</span>
                          <Badge variant="outline" className="uppercase text-[10px]">{m.file_type}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Materials;
