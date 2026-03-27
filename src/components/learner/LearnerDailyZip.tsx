import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Zap, Clock, Gamepad2, Target, Timer, Play, Medal, Crown, Award } from "lucide-react";
import { getDifficulty } from "@/lib/puzzleGenerator";

const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

const getRankIcon = (index: number) => {
  if (index === 0) return <Crown className="h-5 w-5 text-yellow-400" />;
  if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
  if (index === 2) return <Award className="h-5 w-5 text-amber-600" />;
  return <span className="text-sm font-semibold text-muted-foreground">#{index + 1}</span>;
};

const LearnerDailyZip = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<any>(null);
  const [levelScores, setLevelScores] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"stats" | "ranks">("stats");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: prog }, { data: scores }, { data: lb }] = await Promise.all([
        supabase.from("daily_zip_progress").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("daily_zip_level_scores").select("*").eq("user_id", user.id).order("level_number", { ascending: false }).limit(50),
      supabase.from("daily_zip_progress")
          .select("*")
          .order("current_level", { ascending: false })
          .order("total_score", { ascending: false })
          .limit(100),
      ]);
      setProgress(prog);
      setLevelScores(scores || []);
      setLeaderboard(lb || []);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const currentLevel = progress?.current_level || 1;
  const totalScore = progress?.total_score || 0;
  const gamesPlayed = progress?.total_games_played || 0;
  const bestTime = progress?.best_time_seconds;
  const avgScore = gamesPlayed > 0 ? Math.round(totalScore / gamesPlayed) : 0;
  const userRank = leaderboard.findIndex((r: any) => r.user_id === user?.id) + 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" /> Daily Zip Stats
          </h2>
          <p className="text-sm text-muted-foreground">
            Your game progress and history
            {userRank > 0 && <span className="ml-2 font-medium text-primary">• Rank #{userRank}</span>}
          </p>
        </div>
        <Button onClick={() => navigate("/daily-zip")} className="gap-2">
          <Play className="h-4 w-4" />
          {gamesPlayed > 0 ? `Resume Level ${currentLevel}` : "Start Playing"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border/50 bg-card/80">
          <CardContent className="pt-5 pb-4 text-center">
            <Target className="mx-auto mb-2 h-6 w-6 text-primary" />
            <p className="text-2xl font-bold text-foreground">{currentLevel}</p>
            <p className="text-xs text-muted-foreground">Current Level</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="pt-5 pb-4 text-center">
            <Trophy className="mx-auto mb-2 h-6 w-6 text-primary" />
            <p className="text-2xl font-bold text-foreground">{totalScore.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Score</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="pt-5 pb-4 text-center">
            <Gamepad2 className="mx-auto mb-2 h-6 w-6 text-primary" />
            <p className="text-2xl font-bold text-foreground">{gamesPlayed}</p>
            <p className="text-xs text-muted-foreground">Games Played</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="pt-5 pb-4 text-center">
            <Timer className="mx-auto mb-2 h-6 w-6 text-primary" />
            <p className="text-2xl font-bold text-foreground">{bestTime ? formatTime(bestTime) : "--"}</p>
            <p className="text-xs text-muted-foreground">Best Time</p>
          </CardContent>
        </Card>
      </div>

      {/* Extra info */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-card/80">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-lg font-bold text-foreground">{getDifficulty(currentLevel)}</p>
            <p className="text-xs text-muted-foreground">Current Difficulty</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-lg font-bold text-foreground">{avgScore}</p>
            <p className="text-xs text-muted-foreground">Average Score</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-lg font-bold text-foreground">{Math.round((Math.max(currentLevel - 1, 0) / 1000) * 100)}%</p>
            <p className="text-xs text-muted-foreground">Overall Progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: History & Ranks */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          <TabsTrigger value="stats" className="gap-1.5"><Clock className="h-3.5 w-3.5" /> History</TabsTrigger>
          <TabsTrigger value="ranks" className="gap-1.5"><Trophy className="h-3.5 w-3.5" /> Ranks</TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-primary" /> Recent Level History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {levelScores.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No levels completed yet. Start playing to see your history!</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Level</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {levelScores.map((score) => (
                      <TableRow key={score.id}>
                        <TableCell className="font-medium">Level {score.level_number}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {getDifficulty(score.level_number)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-primary">{score.score}</TableCell>
                        <TableCell>{formatTime(score.time_seconds)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(score.completed_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ranks">
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="h-4 w-4 text-primary" /> Global Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No players yet. Be the first!</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Games</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((entry: any, idx: number) => {
                      const isCurrentUser = entry.user_id === user?.id;
                      const profile = entry.profiles;
                      return (
                        <TableRow key={entry.id} className={isCurrentUser ? "bg-primary/5 border-primary/20" : ""}>
                          <TableCell className="w-16">{getRankIcon(idx)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${isCurrentUser ? "text-primary" : "text-foreground"}`}>
                                {profile?.full_name || "Anonymous"}
                                {isCurrentUser && <span className="ml-1 text-xs text-muted-foreground">(You)</span>}
                              </span>
                              {profile?.country && (
                                <span className="text-xs text-muted-foreground">{profile.country}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">{entry.current_level}</TableCell>
                          <TableCell className="text-primary font-semibold">{(entry.total_score || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-muted-foreground">{entry.total_games_played}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LearnerDailyZip;
