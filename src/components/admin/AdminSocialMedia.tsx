import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share2, FileText, CheckCircle, Users, TrendingUp } from "lucide-react";

const AdminSocialMedia = () => {
  const [stats, setStats] = useState({ total: 0, published: 0, users: 0 });
  const [topPosts, setTopPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: allPosts } = await supabase.from("social_posts").select("*").order("created_at", { ascending: false }).limit(100);
      const posts = (allPosts as any[]) || [];
      const userIds = new Set(posts.map(p => p.user_id));
      setStats({
        total: posts.length,
        published: posts.filter(p => p.status === "published").length,
        users: userIds.size,
      });
      setTopPosts(posts.filter(p => p.status === "published").slice(0, 10));
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Share2 className="h-5 w-5 text-primary" /> Social Media Monitoring
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-3 p-4">
            <FileText className="h-8 w-8 text-primary" />
            <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Posts Created</p></div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div><p className="text-2xl font-bold">{stats.published}</p><p className="text-xs text-muted-foreground">Posts Published</p></div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-8 w-8 text-blue-500" />
            <div><p className="text-2xl font-bold">{stats.users}</p><p className="text-xs text-muted-foreground">Active Users</p></div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Recent Published Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {topPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No published posts yet</p>
          ) : (
            <div className="space-y-3">
              {topPosts.map(post => (
                <div key={post.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2">{post.content}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {post.platforms?.map((pid: string) => (
                        <Badge key={pid} variant="outline" className="text-xs">{pid}</Badge>
                      ))}
                      <span className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSocialMedia;
