import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Gamepad2, Users, Trophy } from "lucide-react";
import { toast } from "sonner";

interface Puzzle {
  id: string;
  title: string;
  difficulty: string;
  grid_size: number;
  puzzle_data: any;
  solution_data: any;
  scheduled_date: string | null;
  is_active: boolean;
  created_at: string;
}

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy (4×4)", size: 4 },
  { value: "medium", label: "Medium (5×5)", size: 5 },
  { value: "hard", label: "Hard (6×6)", size: 6 },
];

const AdminDailyZip = () => {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Puzzle | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [scheduledDate, setScheduledDate] = useState("");
  const [waypointsJson, setWaypointsJson] = useState("");
  const [solutionJson, setSolutionJson] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from("daily_zip_puzzles").select("*").order("created_at", { ascending: false }),
      supabase.from("daily_zip_scores").select("*, profiles:user_id(full_name)").order("score", { ascending: false }).limit(50),
    ]);
    setPuzzles((p as unknown as Puzzle[]) || []);
    setScores(s || []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setTitle("");
    setDifficulty("easy");
    setScheduledDate("");
    const defaultWaypoints = [
      { row: 0, col: 0, value: 1, label: "Topic" },
      { row: 0, col: 3, value: 2, label: "Prompt" },
      { row: 3, col: 3, value: 3, label: "AI Tool" },
      { row: 3, col: 0, value: 4, label: "Result" },
    ];
    setWaypointsJson(JSON.stringify(defaultWaypoints, null, 2));
    setSolutionJson("[]");
    setDialogOpen(true);
  };

  const openEdit = (p: Puzzle) => {
    setEditing(p);
    setTitle(p.title);
    setDifficulty(p.difficulty);
    setScheduledDate(p.scheduled_date || "");
    setWaypointsJson(JSON.stringify(p.puzzle_data?.waypoints || [], null, 2));
    setSolutionJson(JSON.stringify(p.solution_data?.path || [], null, 2));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const gridSize = DIFFICULTY_OPTIONS.find((d) => d.value === difficulty)?.size || 4;
      const waypoints = JSON.parse(waypointsJson);
      const path = JSON.parse(solutionJson);

      const record = {
        title,
        difficulty,
        grid_size: gridSize,
        puzzle_data: { waypoints },
        solution_data: { path },
        scheduled_date: scheduledDate || null,
      };

      if (editing) {
        await supabase.from("daily_zip_puzzles").update(record).eq("id", editing.id);
        toast.success("Puzzle updated");
      } else {
        await supabase.from("daily_zip_puzzles").insert(record);
        toast.success("Puzzle created");
      }
      setDialogOpen(false);
      loadData();
    } catch (e: any) {
      toast.error("Invalid JSON: " + e.message);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("daily_zip_puzzles").update({ is_active: !active }).eq("id", id);
    loadData();
  };

  const deletePuzzle = async (id: string) => {
    if (!confirm("Delete this puzzle?")) return;
    await supabase.from("daily_zip_puzzles").delete().eq("id", id);
    toast.success("Puzzle deleted");
    loadData();
  };

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Daily Zip Puzzles</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Create Puzzle</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Puzzle" : "Create Puzzle"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Daily Easy Puzzle" />
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_OPTIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Scheduled Date</Label>
                <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
              </div>
              <div>
                <Label>Waypoints JSON</Label>
                <Textarea rows={6} value={waypointsJson} onChange={(e) => setWaypointsJson(e.target.value)} className="font-mono text-xs" />
                <p className="mt-1 text-xs text-muted-foreground">Array of {`{row, col, value, label}`}</p>
              </div>
              <div>
                <Label>Solution Path JSON</Label>
                <Textarea rows={4} value={solutionJson} onChange={(e) => setSolutionJson(e.target.value)} className="font-mono text-xs" />
                <p className="mt-1 text-xs text-muted-foreground">Array of {`{row, col}`} in order</p>
              </div>
              <Button onClick={handleSave} className="w-full">{editing ? "Update" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="flex items-center gap-3 pt-6"><Gamepad2 className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{puzzles.length}</p><p className="text-sm text-muted-foreground">Total Puzzles</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><Users className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{scores.length}</p><p className="text-sm text-muted-foreground">Total Plays</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><Trophy className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{scores.length > 0 ? Math.max(...scores.map((s: any) => s.score)) : 0}</p><p className="text-sm text-muted-foreground">Highest Score</p></div></CardContent></Card>
      </div>

      {/* Puzzles table */}
      <Card>
        <CardHeader><CardTitle>Puzzles</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {puzzles.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell><Badge variant="outline">{p.difficulty}</Badge></TableCell>
                  <TableCell>{p.scheduled_date || "—"}</TableCell>
                  <TableCell>
                    <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p.id, p.is_active)} />
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => openEdit(p)}><Edit className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => deletePuzzle(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top Scores */}
      <Card>
        <CardHeader><CardTitle>Top Scores</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scores.slice(0, 20).map((s: any, i: number) => (
                <TableRow key={s.id}>
                  <TableCell>#{i + 1}</TableCell>
                  <TableCell>{s.profiles?.full_name || "Anonymous"}</TableCell>
                  <TableCell className="font-semibold">{s.score}</TableCell>
                  <TableCell>{Math.floor(s.time_seconds / 60)}:{(s.time_seconds % 60).toString().padStart(2, "0")}</TableCell>
                  <TableCell>{new Date(s.completed_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDailyZip;
