import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, MessageSquare, Search, Plus } from "lucide-react";
import { toast } from "sonner";

const TopicSpaces = () => {
  const { user } = useAuth();
  const [topics, setTopics] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [topicsRes, membersRes] = await Promise.all([
        supabase.from("community_topics").select("*").eq("is_active", true).order("member_count", { ascending: false }),
        user ? supabase.from("community_topic_members").select("topic_id").eq("user_id", user.id) : { data: [] },
      ]);
      setTopics(topicsRes.data || []);
      setMemberships(new Set((membersRes.data || []).map((m: any) => m.topic_id)));
      setLoading(false);
    };
    load();
  }, [user]);

  const toggleJoin = async (topicId: string) => {
    if (!user) return;
    if (memberships.has(topicId)) {
      await supabase.from("community_topic_members").delete().eq("topic_id", topicId).eq("user_id", user.id);
      setMemberships(prev => { const n = new Set(prev); n.delete(topicId); return n; });
      toast.success("Left topic space");
    } else {
      await supabase.from("community_topic_members").insert({ topic_id: topicId, user_id: user.id });
      setMemberships(prev => new Set(prev).add(topicId));
      toast.success("Joined topic space!");
    }
  };

  const filtered = topics.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Topic Spaces</h2>
          <p className="text-sm text-muted-foreground">Join spaces to follow discussions on AI topics you care about.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search topics..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {filtered.length === 0 && <Card><CardContent className="p-8 text-center text-muted-foreground">No topics found.</CardContent></Card>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(topic => (
          <Card key={topic.id} className="transition-all hover:border-primary/30 hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <Button size="sm" variant={memberships.has(topic.id) ? "outline" : "default"} onClick={() => toggleJoin(topic.id)}>
                  {memberships.has(topic.id) ? "Joined" : <><Plus className="mr-1 h-3 w-3" />Join</>}
                </Button>
              </div>
              <h3 className="text-base font-semibold text-foreground">{topic.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{topic.description}</p>
              <div className="mt-4 flex items-center gap-4">
                <Badge variant="secondary" className="text-xs"><Users className="mr-1 h-3 w-3" />{topic.member_count} members</Badge>
                <Badge variant="secondary" className="text-xs"><MessageSquare className="mr-1 h-3 w-3" />{topic.post_count} posts</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TopicSpaces;
