import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Award, Medal, Crown, Star } from "lucide-react";

const CommunityLeaderboard = () => {
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("community_badges").select("*").order("name");
      setBadges(data || []);
      setLoading(false);
    };
    load();
  }, []);

  // Demo leaderboard data (will be replaced with real aggregated data later)
  const leaderboardData = [
    { rank: 1, name: "Sarah Chen", role: "Coach", points: 2450, posts: 45, answers: 32, icon: Crown },
    { rank: 2, name: "Raj Patel", role: "Coach", points: 2180, posts: 38, answers: 28, icon: Medal },
    { rank: 3, name: "Emily Johnson", role: "Learner", points: 1920, posts: 52, answers: 15, icon: Medal },
    { rank: 4, name: "Michael Torres", role: "Learner", points: 1650, posts: 31, answers: 22, icon: Star },
    { rank: 5, name: "Aisha Mohammed", role: "Coach", points: 1420, posts: 27, answers: 19, icon: Star },
  ];

  if (loading) return <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Leaderboard & Badges</h2>
        <p className="text-sm text-muted-foreground">See top contributors and earn badges for your community activity.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Leaderboard */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Trophy className="h-5 w-5 text-primary" />Top Contributors This Month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {leaderboardData.map(user => {
                const Icon = user.icon;
                const bgColors = ["", "bg-yellow-500/10", "bg-gray-400/10", "bg-orange-500/10", "", ""];
                return (
                  <div key={user.rank} className={`flex items-center gap-4 rounded-lg border border-border p-3 ${bgColors[user.rank] || ""}`}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {user.rank <= 3 ? <Icon className="h-4 w-4" /> : user.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{user.name}</span>
                        <Badge variant="outline" className="text-xs">{user.role}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span>{user.posts} posts</span>
                        <span>{user.answers} answers</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-primary">{user.points.toLocaleString()} pts</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Badges */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Award className="h-5 w-5 text-primary" />Community Badges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {badges.length === 0 && <p className="text-sm text-muted-foreground">No badges available yet.</p>}
              {badges.map(badge => (
                <div key={badge.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Award className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">{badge.name}</h4>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                    {badge.criteria && <p className="text-xs text-muted-foreground mt-0.5 italic">Criteria: {badge.criteria}</p>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CommunityLeaderboard;
