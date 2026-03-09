import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Zap, Clock, TrendingUp, Gamepad2, Target, Timer, Play } from "lucide-react";
import { getDifficulty } from "@/lib/puzzleGenerator";

const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

const LearnerDailyZip = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<any>(null);
  const [levelScores, setLevelScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: prog }, { data: scores }] = await Promise.all([
        supabase.from("daily_zip_progress").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("daily_zip_level_scores").select("*").eq("user_id", user.id).order("level_number", { ascending: false }).limit(50),
      ]);
      setProgress(prog);
      setLevelScores(scores || []);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" /> Daily Zip Stats
          </h2>
          <p className="text-sm text-muted-foreground">Your game progress and history</p>
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

      {/* Level History */}
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
    </div>
  );
};

export default LearnerDailyZip;
