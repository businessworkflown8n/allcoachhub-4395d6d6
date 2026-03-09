import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Clock, Zap, RotateCcw, Undo2, Lightbulb, ChevronLeft, ChevronRight, Share2, Users, Globe, TrendingUp, Calendar } from "lucide-react";
import { toast } from "sonner";
import { generatePuzzle, generateDailyPuzzle, getDifficulty, getGridSize, type PuzzleData, type Cell } from "@/lib/puzzleGenerator";

const MAX_LEVEL = 1000;

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "bg-green-500/20 text-green-600 border-green-500/30",
  Medium: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  Hard: "bg-orange-500/20 text-orange-600 border-orange-500/30",
  Expert: "bg-red-500/20 text-red-600 border-red-500/30",
  Daily: "bg-primary/20 text-primary border-primary/30",
};

const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

const DailyZip = () => {
  const { user } = useAuth();
  const [currentLevel, setCurrentLevel] = useState(1);
  const [tab, setTab] = useState<"game" | "daily" | "leaderboard">("game");
  const [userPath, setUserPath] = useState<Cell[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // DB state
  const [progress, setProgress] = useState<{ current_level: number; total_score: number; total_games_played: number } | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [communityStats, setCommunityStats] = useState({ totalPlayers: 0, totalSolved: 0, highestLevel: 0 });
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<"all" | "weekly" | "monthly">("all");

  // Generate puzzle
  const puzzle = useMemo<PuzzleData>(() => {
    if (tab === "daily") return generateDailyPuzzle();
    return generatePuzzle(currentLevel);
  }, [currentLevel, tab]);

  // Load progress on mount
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("daily_zip_progress").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setProgress(data as any);
        setCurrentLevel((data as any).current_level || 1);
      }
    };
    load();
  }, [user]);

  // Load leaderboard
  useEffect(() => {
    const load = async () => {
      const { data: lb } = await supabase
        .from("daily_zip_progress")
        .select("*, profiles:user_id(full_name, country)")
        .order("current_level", { ascending: false })
        .limit(20);
      setLeaderboard(lb || []);

      const { data: stats } = await supabase.from("daily_zip_progress").select("current_level, total_games_played");
      if (stats && stats.length > 0) {
        setCommunityStats({
          totalPlayers: stats.length,
          totalSolved: stats.reduce((s: number, r: any) => s + (r.total_games_played || 0), 0),
          highestLevel: Math.max(...stats.map((r: any) => r.current_level || 1)),
        });
      }
    };
    load();
  }, []);

  // Timer
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning]);

  // Reset when level/tab changes
  useEffect(() => {
    resetGame();
  }, [currentLevel, tab]);

  const resetGame = () => {
    setUserPath([]);
    setIsCompleted(false);
    setTimer(0);
    setIsRunning(false);
    setHintsUsed(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const getWaypointAt = (row: number, col: number) =>
    puzzle.waypoints.find(w => w.row === row && w.col === col);

  const isAdjacent = (a: Cell, b: Cell) =>
    Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;

  const isInPath = (row: number, col: number) =>
    userPath.some(p => p.row === row && p.col === col);

  const getPathIndex = (row: number, col: number) =>
    userPath.findIndex(p => p.row === row && p.col === col);

  const checkCompletion = useCallback((path: Cell[]) => {
    if (path.length !== puzzle.totalCells) return false;
    const sortedWp = [...puzzle.waypoints].sort((a, b) => a.value - b.value);
    let lastIdx = -1;
    for (const wp of sortedWp) {
      const idx = path.findIndex(p => p.row === wp.row && p.col === wp.col);
      if (idx === -1 || idx <= lastIdx) return false;
      lastIdx = idx;
    }
    return true;
  }, [puzzle]);

  const handleCellInteraction = (row: number, col: number) => {
    if (isCompleted) return;

    if (userPath.length === 0) {
      const wp = getWaypointAt(row, col);
      if (wp?.value === 1) {
        setUserPath([{ row, col }]);
        setIsRunning(true);
      }
      return;
    }

    // Backtrack if clicking existing path cell
    const existingIdx = getPathIndex(row, col);
    if (existingIdx !== -1) {
      setUserPath(userPath.slice(0, existingIdx + 1));
      return;
    }

    const last = userPath[userPath.length - 1];
    if (!isAdjacent(last, { row, col })) return;

    // Check waypoint ordering - if this cell has a waypoint, verify it's the next expected one
    const wp = getWaypointAt(row, col);
    if (wp) {
      const visitedWaypoints = puzzle.waypoints
        .filter(w => userPath.some(p => p.row === w.row && p.col === w.col))
        .sort((a, b) => a.value - b.value);
      const nextExpected = visitedWaypoints.length > 0 ? visitedWaypoints[visitedWaypoints.length - 1].value + 1 : 2;
      if (wp.value !== nextExpected) return; // Wrong waypoint order
    }

    const newPath = [...userPath, { row, col }];
    setUserPath(newPath);

    if (checkCompletion(newPath)) {
      setIsCompleted(true);
      setIsRunning(false);
      const score = Math.max(1000 - timer * 5 - hintsUsed * 50, 100);
      saveScore(score);
      toast.success("🎉 Level Complete!");
    }
  };

  const handlePointerDown = (row: number, col: number) => {
    setIsDrawing(true);
    handleCellInteraction(row, col);
  };
  const handlePointerEnter = (row: number, col: number) => {
    if (isDrawing) handleCellInteraction(row, col);
  };
  const handlePointerUp = () => setIsDrawing(false);

  const handleUndo = () => {
    if (userPath.length <= 1) return;
    setUserPath(userPath.slice(0, -1));
  };

  const handleHint = () => {
    if (isCompleted || !puzzle.path) return;
    const nextIdx = userPath.length;
    if (nextIdx >= puzzle.path.length) return;

    if (userPath.length === 0) {
      // Start from first waypoint (which is path[0])
      setUserPath([puzzle.path[0]]);
      setIsRunning(true);
    } else {
      // Find the next cell in the solution path from current position
      const lastCell = userPath[userPath.length - 1];
      const lastInSolution = puzzle.path.findIndex(p => p.row === lastCell.row && p.col === lastCell.col);
      if (lastInSolution !== -1 && lastInSolution + 1 < puzzle.path.length) {
        const nextCell = puzzle.path[lastInSolution + 1];
        const newPath = [...userPath, nextCell];
        setUserPath(newPath);
        if (checkCompletion(newPath)) {
          setIsCompleted(true);
          setIsRunning(false);
          saveScore(Math.max(100, 500 - timer * 5));
          toast.success("🎉 Level Complete!");
        }
      }
    }
    setHintsUsed(h => h + 1);
  };

  const saveScore = async (score: number) => {
    if (!user) return;
    const levelNum = tab === "daily" ? 0 : currentLevel;

    if (tab !== "daily") {
      // Save level score
      await supabase.from("daily_zip_level_scores").upsert({
        user_id: user.id,
        level_number: levelNum,
        time_seconds: timer,
        score,
      }, { onConflict: "user_id,level_number" });

      // Update progress
      const newLevel = Math.min(currentLevel + 1, MAX_LEVEL);
      const { data: existing } = await supabase.from("daily_zip_progress").select("*").eq("user_id", user.id).maybeSingle();
      if (existing) {
        await supabase.from("daily_zip_progress").update({
          current_level: Math.max((existing as any).current_level, newLevel),
          total_score: (existing as any).total_score + score,
          total_games_played: (existing as any).total_games_played + 1,
          best_time_seconds: (existing as any).best_time_seconds ? Math.min((existing as any).best_time_seconds, timer) : timer,
          updated_at: new Date().toISOString(),
        }).eq("user_id", user.id);
      } else {
        await supabase.from("daily_zip_progress").insert({
          user_id: user.id,
          current_level: newLevel,
          total_score: score,
          total_games_played: 1,
          best_time_seconds: timer,
        });
      }
      setProgress(prev => ({
        current_level: Math.max(prev?.current_level || 1, newLevel),
        total_score: (prev?.total_score || 0) + score,
        total_games_played: (prev?.total_games_played || 0) + 1,
      }));
    } else {
      // Save daily score
      await supabase.from("daily_zip_scores").upsert({
        user_id: user.id,
        puzzle_id: "daily-" + new Date().toISOString().split("T")[0],
        time_seconds: timer,
        score,
      } as any, { onConflict: "user_id,puzzle_id" as any });
    }
  };

  const goToNextLevel = () => {
    if (currentLevel < MAX_LEVEL) {
      setCurrentLevel(currentLevel + 1);
    }
  };

  const shareResult = (platform: string) => {
    const levelText = tab === "daily" ? "today's Daily Challenge" : `Level ${currentLevel}`;
    const msg = `🧩 I completed ${levelText} in Daily Zip in ${formatTime(timer)}!\nCan you beat my score?\n\nPlay here: https://www.aicoachportal.com/daily-zip`;
    const encoded = encodeURIComponent(msg);
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encoded}`,
      twitter: `https://twitter.com/intent/tweet?text=${encoded}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://www.aicoachportal.com/daily-zip")}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?quote=${encoded}&u=${encodeURIComponent("https://www.aicoachportal.com/daily-zip")}`,
    };
    window.open(urls[platform], "_blank");
  };

  // Path connectivity for rendering
  const getPathNeighbors = (row: number, col: number) => {
    const idx = getPathIndex(row, col);
    if (idx === -1) return { top: false, right: false, bottom: false, left: false };
    const prev = idx > 0 ? userPath[idx - 1] : null;
    const next = idx < userPath.length - 1 ? userPath[idx + 1] : null;
    return {
      top: (prev?.row === row - 1 && prev?.col === col) || (next?.row === row - 1 && next?.col === col),
      right: (prev?.col === col + 1 && prev?.row === row) || (next?.col === col + 1 && next?.row === row),
      bottom: (prev?.row === row + 1 && prev?.col === col) || (next?.row === row + 1 && next?.col === col),
      left: (prev?.col === col - 1 && prev?.row === row) || (next?.col === col - 1 && next?.row === row),
    };
  };

  const getCellRadius = (row: number, col: number) => {
    const n = getPathNeighbors(row, col);
    const r = 12;
    return `${n.top || n.left ? 0 : r}px ${n.top || n.right ? 0 : r}px ${n.bottom || n.right ? 0 : r}px ${n.bottom || n.left ? 0 : r}px`;
  };

  // SEO
  useEffect(() => {
    document.title = "Daily Zip – AI Puzzle Game | AI Coach Portal";
    const meta = document.querySelector('meta[name="description"]');
    const content = "Play Daily Zip, a grid puzzle game with 1000 levels. Connect numbers in order, fill every cell, and compete on the leaderboard!";
    if (meta) meta.setAttribute("content", content);
    else {
      const m = document.createElement("meta"); m.name = "description"; m.content = content;
      document.head.appendChild(m);
    }
  }, []);

  const gridSize = puzzle.gridSize;
  const cellSize = gridSize <= 6 ? 64 : gridSize <= 7 ? 56 : 48;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mb-1 flex items-center justify-center gap-2">
              <Zap className="h-7 w-7 text-primary" />
              <h1 className="text-3xl font-bold text-foreground md:text-4xl">Daily Zip</h1>
            </div>
            <p className="text-sm text-muted-foreground">Connect the dots in order • Fill every cell</p>
          </div>

          {/* Main tabs */}
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mx-auto mb-6 max-w-md">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="game" className="gap-1"><Zap className="h-3.5 w-3.5" /> Levels</TabsTrigger>
              <TabsTrigger value="daily" className="gap-1"><Calendar className="h-3.5 w-3.5" /> Daily</TabsTrigger>
              <TabsTrigger value="leaderboard" className="gap-1"><Trophy className="h-3.5 w-3.5" /> Ranks</TabsTrigger>
            </TabsList>
          </Tabs>

          {tab === "leaderboard" ? (
            <LeaderboardView leaderboard={leaderboard} communityStats={communityStats} userId={user?.id} period={leaderboardPeriod} setPeriod={setLeaderboardPeriod} />
          ) : (
            <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_300px]">
              {/* Game area */}
              <Card className="border-border/50 bg-card/80 backdrop-blur">
                <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 pb-3">
                  <div className="flex items-center gap-3">
                    {tab === "game" && (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={currentLevel <= 1} onClick={() => setCurrentLevel(currentLevel - 1)}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="min-w-[80px] text-center text-sm font-semibold text-foreground">
                          Level {currentLevel} / {MAX_LEVEL}
                        </span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={currentLevel >= (progress?.current_level || 1)} onClick={() => setCurrentLevel(currentLevel + 1)}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {tab === "daily" && <span className="text-sm font-semibold text-foreground">Daily Challenge</span>}
                    <Badge variant="outline" className={DIFFICULTY_COLORS[puzzle.difficulty] || ""}>
                      {puzzle.difficulty} {gridSize}×{gridSize}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-sm">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatTime(timer)}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Game board */}
                  <div
                    className="mx-auto select-none touch-none"
                    style={{ maxWidth: gridSize * (cellSize + 2) }}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                  >
                    <div
                      className="grid"
                      style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, gap: "2px" }}
                    >
                      {Array.from({ length: gridSize }, (_, row) =>
                        Array.from({ length: gridSize }, (_, col) => {
                          const wp = getWaypointAt(row, col);
                          const inPath = isInPath(row, col);
                          const pathIdx = getPathIndex(row, col);
                          const isHead = pathIdx === userPath.length - 1 && userPath.length > 0;

                          return (
                            <div
                              key={`${row}-${col}`}
                              className={`flex items-center justify-center transition-colors duration-100 ${
                                isCompleted && inPath
                                  ? "bg-primary text-primary-foreground"
                                  : inPath
                                    ? isHead
                                      ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.5)]"
                                      : "bg-primary/80 text-primary-foreground"
                                    : "bg-muted/40 hover:bg-muted/60"
                              }`}
                              style={{
                                width: cellSize,
                                height: cellSize,
                                borderRadius: inPath ? getCellRadius(row, col) : "4px",
                                cursor: isCompleted ? "default" : "pointer",
                              }}
                              onPointerDown={() => handlePointerDown(row, col)}
                              onPointerEnter={() => handlePointerEnter(row, col)}
                            >
                              {wp ? (
                                <div
                                  className={`flex items-center justify-center rounded-full font-bold ${
                                    inPath
                                      ? "bg-foreground text-background"
                                      : "bg-foreground text-background"
                                  }`}
                                  style={{ width: cellSize * 0.55, height: cellSize * 0.55, fontSize: cellSize * 0.28 }}
                                >
                                  {wp.value}
                                </div>
                              ) : inPath ? (
                                <span className="text-xs font-medium opacity-50">{pathIdx + 1}</span>
                              ) : null}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleUndo} disabled={userPath.length <= 1 || isCompleted}>
                      <Undo2 className="mr-1 h-3.5 w-3.5" /> Undo
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleHint} disabled={isCompleted}>
                      <Lightbulb className="mr-1 h-3.5 w-3.5" /> Hint
                    </Button>
                    <Button variant="outline" size="sm" onClick={resetGame}>
                      <RotateCcw className="mr-1 h-3.5 w-3.5" /> Restart
                    </Button>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{userPath.length} / {puzzle.totalCells} cells</span>
                    <span>{Math.round((userPath.length / puzzle.totalCells) * 100)}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-200"
                      style={{ width: `${(userPath.length / puzzle.totalCells) * 100}%` }}
                    />
                  </div>

                  {/* Completion */}
                  {isCompleted && (
                    <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-6 text-center animate-fade-in">
                      <Trophy className="mx-auto mb-2 h-10 w-10 text-primary" />
                      <h3 className="mb-1 text-xl font-bold text-foreground">
                        {tab === "daily" ? "Daily Challenge Complete!" : `Level ${currentLevel} Complete!`}
                      </h3>
                      <p className="text-sm text-muted-foreground">Time: {formatTime(timer)} • Hints: {hintsUsed}</p>
                      <p className="mb-4 text-lg font-semibold text-primary">
                        Score: {Math.max(tab === "daily" ? 500 : 1000 - timer * 5 - hintsUsed * 50, 100)}
                      </p>

                      {tab === "game" && currentLevel < MAX_LEVEL && (
                        <Button onClick={goToNextLevel} className="mb-3">
                          Next Level <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      )}

                      <div className="flex flex-wrap justify-center gap-2">
                        <Button size="sm" onClick={() => shareResult("whatsapp")} className="gap-1.5 bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)]">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          WhatsApp
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => shareResult("twitter")}>𝕏 Twitter</Button>
                        <Button size="sm" variant="outline" onClick={() => shareResult("linkedin")}>LinkedIn</Button>
                        <Button size="sm" variant="outline" onClick={() => shareResult("facebook")}>Facebook</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Player stats */}
                {user && progress && (
                  <Card className="border-border/50 bg-card/80 backdrop-blur">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm"><TrendingUp className="h-4 w-4 text-primary" /> Your Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3 text-center">
                      <div className="rounded-lg bg-muted/50 p-2">
                        <p className="text-lg font-bold text-foreground">{progress.current_level}</p>
                        <p className="text-[10px] text-muted-foreground">Current Level</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-2">
                        <p className="text-lg font-bold text-foreground">{progress.total_score.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">Total Score</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-2">
                        <p className="text-lg font-bold text-foreground">{progress.total_games_played}</p>
                        <p className="text-[10px] text-muted-foreground">Games Played</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-2">
                        <p className="text-lg font-bold text-foreground">{getDifficulty(progress.current_level)}</p>
                        <p className="text-[10px] text-muted-foreground">Difficulty</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Community stats */}
                <Card className="border-border/50 bg-card/80 backdrop-blur">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm"><Globe className="h-4 w-4 text-primary" /> Community Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Total Players</span><span className="font-semibold text-foreground">{communityStats.totalPlayers}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Puzzles Solved</span><span className="font-semibold text-foreground">{communityStats.totalSolved}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Highest Level</span><span className="font-semibold text-foreground">{communityStats.highestLevel}</span></div>
                  </CardContent>
                </Card>

                {/* How to play */}
                <Card className="border-border/50 bg-card/80 backdrop-blur">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">How to Play</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5 text-xs text-muted-foreground">
                    <p>1. Tap numbered dot <strong className="text-foreground">1</strong> to start</p>
                    <p>2. Draw a path through adjacent cells</p>
                    <p>3. Visit all numbers in order (1→2→3…)</p>
                    <p>4. Fill <strong className="text-foreground">every cell</strong> in the grid</p>
                    <p>5. Solve fast, use fewer hints for higher score!</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

// Leaderboard sub-component
function LeaderboardView({ leaderboard, communityStats, userId, period, setPeriod }: {
  leaderboard: any[]; communityStats: { totalPlayers: number; totalSolved: number; highestLevel: number };
  userId?: string; period: string; setPeriod: (p: any) => void;
}) {
  const userRank = userId ? leaderboard.findIndex((l: any) => l.user_id === userId) + 1 : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Community stats cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/50 bg-card/80 backdrop-blur text-center">
          <CardContent className="pt-6">
            <Users className="mx-auto mb-1 h-6 w-6 text-primary" />
            <p className="text-2xl font-bold text-foreground">{communityStats.totalPlayers}</p>
            <p className="text-xs text-muted-foreground">Total Players</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 backdrop-blur text-center">
          <CardContent className="pt-6">
            <Zap className="mx-auto mb-1 h-6 w-6 text-primary" />
            <p className="text-2xl font-bold text-foreground">{communityStats.totalSolved}</p>
            <p className="text-xs text-muted-foreground">Puzzles Solved</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 backdrop-blur text-center">
          <CardContent className="pt-6">
            <TrendingUp className="mx-auto mb-1 h-6 w-6 text-primary" />
            <p className="text-2xl font-bold text-foreground">{communityStats.highestLevel}</p>
            <p className="text-xs text-muted-foreground">Highest Level</p>
          </CardContent>
        </Card>
      </div>

      {/* Your rank */}
      {userRank > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center justify-between py-4">
            <span className="text-sm font-medium text-foreground">Your Rank</span>
            <Badge className="text-lg">#{userRank}</Badge>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard table */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Leaderboard</CardTitle>
            <Tabs value={period} onValueChange={setPeriod}>
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs px-2 h-6">All Time</TabsTrigger>
                <TabsTrigger value="weekly" className="text-xs px-2 h-6">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs px-2 h-6">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No players yet. Be the first!</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry: any, i: number) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                    entry.user_id === userId
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-background/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      i === 0 ? "bg-yellow-500/20 text-yellow-500" :
                      i === 1 ? "bg-gray-400/20 text-gray-400" :
                      i === 2 ? "bg-orange-500/20 text-orange-500" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{(entry.profiles as any)?.full_name || "Anonymous"}</p>
                      <p className="text-[10px] text-muted-foreground">{(entry.profiles as any)?.country || "—"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">Level {entry.current_level}</p>
                    <p className="text-[10px] text-muted-foreground">Score: {entry.total_score?.toLocaleString()} • {entry.total_games_played} games</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DailyZip;
