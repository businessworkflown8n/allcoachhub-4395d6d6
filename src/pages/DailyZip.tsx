import { useState, useEffect, useCallback, useRef } from "react";
import { useEffect as useDocEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Clock, Share2, Zap, Brain, Target, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface PuzzleCell {
  row: number;
  col: number;
  value: number | null; // waypoint number or null for empty
  label?: string;
}

interface Puzzle {
  id: string;
  title: string;
  difficulty: string;
  grid_size: number;
  puzzle_data: {
    waypoints: { row: number; col: number; value: number; label: string }[];
  };
  solution_data: {
    path: { row: number; col: number }[];
  };
  scheduled_date: string;
}

interface Score {
  id: string;
  user_id: string;
  time_seconds: number;
  score: number;
  completed_at: string;
  profiles?: { full_name: string | null } | null;
}

const DIFFICULTY_CONFIG = {
  easy: { size: 4, label: "Easy", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  medium: { size: 5, label: "Medium", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  hard: { size: 6, label: "Hard", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

// Generate a sample puzzle if none exists for today
function generateSamplePuzzle(difficulty: string): Puzzle {
  const size = DIFFICULTY_CONFIG[difficulty as keyof typeof DIFFICULTY_CONFIG]?.size || 4;
  const labels: Record<string, string[]> = {
    easy: ["Topic", "Prompt", "AI Tool", "Result"],
    medium: ["Input", "Process", "AI Model", "Output", "Store"],
    hard: ["User Input", "Validate", "AI Process", "Automate", "Store", "Notify"],
  };
  const steps = labels[difficulty] || labels.easy;

  // Place waypoints along a solvable path
  const path: { row: number; col: number }[] = [];
  const visited = new Set<string>();
  let r = 0, c = 0;
  path.push({ row: r, col: c });
  visited.add(`${r},${c}`);

  // Simple snake path to fill grid
  for (let row = 0; row < size; row++) {
    if (row % 2 === 0) {
      for (let col = (row === 0 ? 1 : 0); col < size; col++) {
        path.push({ row, col });
        visited.add(`${row},${col}`);
      }
    } else {
      for (let col = size - 1; col >= 0; col--) {
        path.push({ row, col });
        visited.add(`${row},${col}`);
      }
    }
  }

  // Place waypoints evenly along the path
  const totalCells = size * size;
  const waypoints = steps.map((label, i) => {
    const pathIdx = Math.round((i / (steps.length - 1)) * (totalCells - 1));
    return { ...path[pathIdx], value: i + 1, label };
  });

  const today = new Date().toISOString().split("T")[0];
  return {
    id: `sample-${difficulty}-${today}`,
    title: `Daily ${DIFFICULTY_CONFIG[difficulty as keyof typeof DIFFICULTY_CONFIG]?.label} Puzzle`,
    difficulty,
    grid_size: size,
    puzzle_data: { waypoints },
    solution_data: { path },
    scheduled_date: today,
  };
}

const DailyZip = () => {
  const { user } = useAuth();
  const [difficulty, setDifficulty] = useState("easy");
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [playerPath, setPlayerPath] = useState<{ row: number; col: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [leaderboard, setLeaderboard] = useState<Score[]>([]);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Load puzzle
  useEffect(() => {
    const loadPuzzle = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("daily_zip_puzzles")
        .select("*")
        .eq("scheduled_date", today)
        .eq("difficulty", difficulty)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (data) {
        setPuzzle(data as unknown as Puzzle);
      } else {
        // Fallback: use any active puzzle for this difficulty, or generate sample
        const { data: fallback } = await supabase
          .from("daily_zip_puzzles")
          .select("*")
          .eq("difficulty", difficulty)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (fallback) {
          setPuzzle(fallback as unknown as Puzzle);
        } else {
          setPuzzle(generateSamplePuzzle(difficulty));
        }
      }
      resetGame();
    };
    loadPuzzle();
  }, [difficulty]);

  // Load leaderboard
  useEffect(() => {
    if (!puzzle) return;
    const loadLeaderboard = async () => {
      if (puzzle.id.startsWith("sample-")) return;
      const { data } = await supabase
        .from("daily_zip_scores")
        .select("*, profiles:user_id(full_name)")
        .eq("puzzle_id", puzzle.id)
        .order("score", { ascending: false })
        .limit(10);
      if (data) setLeaderboard(data as unknown as Score[]);
    };
    loadLeaderboard();
  }, [puzzle]);

  // Timer
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning]);

  const resetGame = () => {
    setPlayerPath([]);
    setIsCompleted(false);
    setTimer(0);
    setIsRunning(false);
    setBestScore(null);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const getWaypointAt = (row: number, col: number) => {
    if (!puzzle) return null;
    return puzzle.puzzle_data.waypoints.find((w) => w.row === row && w.col === col);
  };

  const isAdjacent = (a: { row: number; col: number }, b: { row: number; col: number }) => {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
  };

  const isInPath = (row: number, col: number) => {
    return playerPath.some((p) => p.row === row && p.col === col);
  };

  const getPathIndex = (row: number, col: number) => {
    return playerPath.findIndex((p) => p.row === row && p.col === col);
  };

  const checkCompletion = useCallback((path: { row: number; col: number }[]) => {
    if (!puzzle) return false;
    const totalCells = puzzle.grid_size * puzzle.grid_size;
    if (path.length !== totalCells) return false;

    // Check all waypoints are in correct order
    const waypoints = [...puzzle.puzzle_data.waypoints].sort((a, b) => a.value - b.value);
    for (const wp of waypoints) {
      const idx = path.findIndex((p) => p.row === wp.row && p.col === wp.col);
      if (idx === -1) return false;
    }

    // Verify waypoint order in path
    let lastIdx = -1;
    for (const wp of waypoints) {
      const idx = path.findIndex((p) => p.row === wp.row && p.col === wp.col);
      if (idx <= lastIdx) return false;
      lastIdx = idx;
    }

    return true;
  }, [puzzle]);

  const handleCellInteraction = (row: number, col: number) => {
    if (isCompleted || !puzzle) return;

    if (playerPath.length === 0) {
      // Must start at waypoint 1
      const wp = getWaypointAt(row, col);
      if (wp?.value === 1) {
        setPlayerPath([{ row, col }]);
        setIsRunning(true);
      } else {
        toast.error("Start from the first step!");
      }
      return;
    }

    const existingIdx = getPathIndex(row, col);
    if (existingIdx !== -1) {
      // Backtrack to this cell
      setPlayerPath(playerPath.slice(0, existingIdx + 1));
      return;
    }

    const last = playerPath[playerPath.length - 1];
    if (!isAdjacent(last, { row, col })) return;

    const newPath = [...playerPath, { row, col }];
    setPlayerPath(newPath);

    if (checkCompletion(newPath)) {
      setIsCompleted(true);
      setIsRunning(false);
      const score = Math.max(1000 - timer * 10, 100);
      setBestScore(score);
      saveScore(score);
      toast.success("🎉 Puzzle solved!");
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

  const saveScore = async (score: number) => {
    if (!user || !puzzle || puzzle.id.startsWith("sample-")) return;
    await supabase.from("daily_zip_scores").upsert({
      user_id: user.id,
      puzzle_id: puzzle.id,
      time_seconds: timer,
      score,
    }, { onConflict: "user_id,puzzle_id" });
  };

  const shareResult = (platform: string) => {
    const msg = `🧩 I solved today's Daily Zip puzzle in ${timer} seconds!\nCan you beat my score?\n\nPlay here: https://www.aicoachportal.com/daily-zip`;
    const encoded = encodeURIComponent(msg);
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encoded}`,
      twitter: `https://twitter.com/intent/tweet?text=${encoded}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://www.aicoachportal.com/daily-zip")}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?quote=${encoded}&u=${encodeURIComponent("https://www.aicoachportal.com/daily-zip")}`,
    };
    window.open(urls[platform], "_blank");
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (!puzzle) return null;

  const gridSize = puzzle.grid_size;

  return (
    <>
      <Helmet>
        <title>Daily Zip – AI Puzzle Game | AI Coach Portal</title>
        <meta name="description" content="Play Daily Zip, the AI puzzle game where you solve AI workflows, prompts, and automation challenges in a fun and interactive way." />
        <link rel="canonical" href="https://www.aicoachportal.com/daily-zip" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Daily Zip",
          "description": "AI puzzle game where you solve AI workflows and automation challenges",
          "url": "https://www.aicoachportal.com/daily-zip",
          "applicationCategory": "Game",
          "operatingSystem": "Web",
        })}</script>
      </Helmet>

      <Navbar />
      <main className="min-h-screen bg-background pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <Zap className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground md:text-4xl">Daily Zip</h1>
            </div>
            <p className="text-muted-foreground">Connect AI workflow steps in the correct order to fill the grid</p>
          </div>

          {/* Difficulty tabs */}
          <Tabs value={difficulty} onValueChange={setDifficulty} className="mx-auto mb-6 max-w-md">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="easy" className="gap-1"><Target className="h-3.5 w-3.5" /> Easy</TabsTrigger>
              <TabsTrigger value="medium" className="gap-1"><Brain className="h-3.5 w-3.5" /> Medium</TabsTrigger>
              <TabsTrigger value="hard" className="gap-1"><Zap className="h-3.5 w-3.5" /> Hard</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_320px]">
            {/* Game area */}
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader className="flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">{puzzle.title}</CardTitle>
                  <Badge variant="outline" className={DIFFICULTY_CONFIG[difficulty as keyof typeof DIFFICULTY_CONFIG]?.color}>
                    {DIFFICULTY_CONFIG[difficulty as keyof typeof DIFFICULTY_CONFIG]?.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-sm">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatTime(timer)}
                  </div>
                  <Button variant="outline" size="sm" onClick={resetGame}>
                    <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Waypoint legend */}
                <div className="mb-4 flex flex-wrap gap-2">
                  {puzzle.puzzle_data.waypoints
                    .sort((a, b) => a.value - b.value)
                    .map((wp) => (
                      <Badge key={wp.value} variant="secondary" className="gap-1 text-xs">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                          {wp.value}
                        </span>
                        {wp.label}
                      </Badge>
                    ))}
                </div>

                {/* Grid */}
                <div
                  ref={gridRef}
                  className="mx-auto select-none touch-none"
                  style={{ maxWidth: gridSize * 72 }}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                >
                  <div
                    className="grid gap-1"
                    style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
                  >
                    {Array.from({ length: gridSize }, (_, row) =>
                      Array.from({ length: gridSize }, (_, col) => {
                        const wp = getWaypointAt(row, col);
                        const inPath = isInPath(row, col);
                        const pathIdx = getPathIndex(row, col);
                        const isLast = pathIdx === playerPath.length - 1 && playerPath.length > 0;
                        const isFirst = pathIdx === 0;

                        return (
                          <div
                            key={`${row}-${col}`}
                            className={`flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 text-xs font-bold transition-all duration-150 ${
                              isCompleted && inPath
                                ? "scale-[0.97] border-primary bg-primary/30 text-primary"
                                : inPath
                                  ? isLast
                                    ? "border-primary bg-primary/20 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
                                    : "border-primary/50 bg-primary/10 text-primary"
                                  : wp
                                    ? "border-accent bg-accent/20 text-accent-foreground hover:bg-accent/30"
                                    : "border-border bg-muted/30 hover:bg-muted/50"
                            }`}
                            onPointerDown={() => handlePointerDown(row, col)}
                            onPointerEnter={() => handlePointerEnter(row, col)}
                          >
                            {wp ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                                  {wp.value}
                                </span>
                                <span className="hidden text-[9px] leading-tight sm:block">{wp.label}</span>
                              </div>
                            ) : inPath ? (
                              <span className="text-[10px] text-primary/60">{pathIdx + 1}</span>
                            ) : null}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Progress */}
                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                  <span>{playerPath.length} / {gridSize * gridSize} cells</span>
                  <span>{Math.round((playerPath.length / (gridSize * gridSize)) * 100)}% complete</span>
                </div>

                {/* Completion card */}
                {isCompleted && (
                  <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
                    <Trophy className="mx-auto mb-2 h-10 w-10 text-primary" />
                    <h3 className="mb-1 text-xl font-bold text-foreground">Puzzle Solved!</h3>
                    <p className="mb-1 text-muted-foreground">Time: {formatTime(timer)}</p>
                    {bestScore && <p className="mb-4 text-lg font-semibold text-primary">Score: {bestScore}</p>}
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

            {/* Sidebar: Leaderboard */}
            <div className="space-y-4">
              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Trophy className="h-4 w-4 text-primary" /> Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {leaderboard.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground">
                      {user ? "Be the first to complete this puzzle!" : "Sign in to compete on the leaderboard!"}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {leaderboard.map((s, i) => (
                        <div key={s.id} className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                              i === 0 ? "bg-yellow-500/20 text-yellow-500" :
                              i === 1 ? "bg-gray-400/20 text-gray-400" :
                              i === 2 ? "bg-orange-500/20 text-orange-500" :
                              "bg-muted text-muted-foreground"
                            }`}>
                              {i + 1}
                            </span>
                            <span className="text-sm font-medium text-foreground">
                              {(s.profiles as any)?.full_name || "Anonymous"}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-primary">{s.score}</p>
                            <p className="text-[10px] text-muted-foreground">{formatTime(s.time_seconds)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* How to play */}
              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">How to Play</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>1. Start from step <strong className="text-foreground">1</strong></p>
                  <p>2. Draw a path through adjacent cells</p>
                  <p>3. Pass through all numbered steps in order</p>
                  <p>4. Fill <strong className="text-foreground">every cell</strong> in the grid</p>
                  <p>5. Solve it fast for a higher score!</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default DailyZip;
