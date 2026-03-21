import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquare, HelpCircle, Calendar, TrendingUp, Users, Star, ArrowRight } from "lucide-react";

interface CommunityHomeProps {
  baseUrl: string;
  userRole: string;
}

const CommunityHome = ({ baseUrl, userRole }: CommunityHomeProps) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [postsRes, questionsRes, eventsRes, topicsRes] = await Promise.all([
        supabase.from("community_posts").select("*").eq("is_featured", true).order("created_at", { ascending: false }).limit(4),
        supabase.from("community_questions").select("*").eq("is_resolved", false).order("created_at", { ascending: false }).limit(4),
        supabase.from("community_events").select("*").eq("status", "upcoming").order("start_time", { ascending: true }).limit(3),
        supabase.from("community_topics").select("*").order("member_count", { ascending: false }).limit(4),
      ]);
      setPosts(postsRes.data || []);
      setQuestions(questionsRes.data || []);
      setEvents(eventsRes.data || []);
      setTopics(topicsRes.data || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome to AI Community</h1>
            <p className="mt-1 text-muted-foreground">Learn, share, and grow with fellow AI enthusiasts and expert coaches.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm"><Link to={baseUrl + "/ask-a-coach"}><HelpCircle className="mr-2 h-4 w-4" />Ask a Question</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to={baseUrl + "/prompts"}><Sparkles className="mr-2 h-4 w-4" />Share a Prompt</Link></Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Featured Discussions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Featured Discussions</h2>
            <Link to={baseUrl + "/topics"} className="text-sm text-primary hover:underline flex items-center gap-1">View All <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="space-y-3">
            {posts.length === 0 && <Card><CardContent className="p-6 text-center text-muted-foreground">No featured discussions yet. Start a conversation!</CardContent></Card>}
            {posts.map(post => (
              <Card key={post.id} className="transition-colors hover:border-primary/30">
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">{post.author_role}</Badge>
                      {post.is_featured && <Badge className="text-xs bg-primary/20 text-primary border-0">Featured</Badge>}
                    </div>
                    <h3 className="font-medium text-foreground truncate">{post.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Star className="h-3 w-3" />{post.like_count} likes</span>
                      <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{post.comment_count} comments</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Unanswered Questions */}
          <div className="flex items-center justify-between pt-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><HelpCircle className="h-5 w-5 text-primary" />Unanswered Questions</h2>
            <Link to={baseUrl + "/ask-a-coach"} className="text-sm text-primary hover:underline flex items-center gap-1">View All <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="space-y-3">
            {questions.length === 0 && <Card><CardContent className="p-6 text-center text-muted-foreground">No unanswered questions. Be the first to ask!</CardContent></Card>}
            {questions.map(q => (
              <Card key={q.id} className="transition-colors hover:border-primary/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">{q.skill_level}</Badge>
                    {!q.is_resolved && <Badge variant="destructive" className="text-xs">Needs Answer</Badge>}
                  </div>
                  <h3 className="font-medium text-foreground">{q.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{q.description}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{q.view_count} views</span>
                    <span>{q.answer_count} answers</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Upcoming Events */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {events.length === 0 && <p className="text-sm text-muted-foreground">No upcoming events.</p>}
              {events.map(e => (
                <div key={e.id} className="rounded-lg border border-border p-3">
                  <Badge variant="outline" className="text-xs mb-1">{e.event_type}</Badge>
                  <h4 className="text-sm font-medium text-foreground">{e.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(e.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-xs text-muted-foreground">{e.registered_count}/{e.capacity || '∞'} registered</p>
                </div>
              ))}
              <Link to={baseUrl + "/events"} className="text-sm text-primary hover:underline block text-center">See all events →</Link>
            </CardContent>
          </Card>

          {/* Popular Topics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-primary" />Popular Spaces</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topics.map(t => (
                <Link key={t.id} to={baseUrl + "/topics"} className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:border-primary/30">
                  <div>
                    <h4 className="text-sm font-medium text-foreground">{t.title}</h4>
                    <p className="text-xs text-muted-foreground">{t.member_count} members</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">{t.post_count} posts</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CommunityHome;
