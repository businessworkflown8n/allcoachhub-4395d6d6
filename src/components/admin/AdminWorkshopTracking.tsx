import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Calendar, Users, Video, Clock, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface Workshop {
  id: string;
  title: string;
  coach_id: string;
  coach_name?: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_url: string | null;
  status: string;
  registrations: number;
  attended: number;
  avg_duration: number;
}

const AdminWorkshopTracking = () => {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: ws } = await supabase.from("workshops").select("*").order("scheduled_at", { ascending: false });
      if (!ws) { setLoading(false); return; }

      const coachIds = [...new Set(ws.map((w) => w.coach_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", coachIds);
      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));

      const { data: regs } = await supabase.from("workshop_registrations").select("workshop_id, status, watch_duration_seconds");

      const regMap = new Map<string, { total: number; attended: number; totalDuration: number }>();
      (regs || []).forEach((r) => {
        const entry = regMap.get(r.workshop_id) || { total: 0, attended: 0, totalDuration: 0 };
        entry.total++;
        if (r.status === "attended" || r.status === "completed") {
          entry.attended++;
          entry.totalDuration += r.watch_duration_seconds || 0;
        }
        regMap.set(r.workshop_id, entry);
      });

      setWorkshops(ws.map((w) => {
        const stats = regMap.get(w.id) || { total: 0, attended: 0, totalDuration: 0 };
        return {
          ...w,
          coach_name: profileMap.get(w.coach_id) || "Unknown",
          registrations: stats.total,
          attended: stats.attended,
          avg_duration: stats.attended > 0 ? Math.round(stats.totalDuration / stats.attended / 60) : 0,
        };
      }));
      setLoading(false);
    };
    fetch();
  }, []);

  const totalWorkshops = workshops.length;
  const totalRegistrations = workshops.reduce((s, w) => s + w.registrations, 0);
  const totalAttended = workshops.reduce((s, w) => s + w.attended, 0);
  const avgJoinRate = totalRegistrations > 0 ? Math.round((totalAttended / totalRegistrations) * 100) : 0;

  const statusColor = (s: string) => {
    if (s === "live") return "default";
    if (s === "completed") return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Video className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold text-foreground">Workshop Tracking</h2>
          <p className="text-sm text-muted-foreground">Monitor all workshop sessions and attendance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Calendar className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold text-foreground">{totalWorkshops}</p><p className="text-sm text-muted-foreground">Total Workshops</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Users className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold text-foreground">{totalRegistrations}</p><p className="text-sm text-muted-foreground">Total Registrations</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><BarChart3 className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold text-foreground">{totalAttended}</p><p className="text-sm text-muted-foreground">Total Attended</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Clock className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold text-foreground">{avgJoinRate}%</p><p className="text-sm text-muted-foreground">Avg Join Rate</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-foreground">All Workshops</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Coach</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Registrations</TableHead>
                    <TableHead>Attended</TableHead>
                    <TableHead>Join Rate</TableHead>
                    <TableHead>Avg Watch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workshops.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium text-foreground">{w.title}</TableCell>
                      <TableCell className="text-muted-foreground">{w.coach_name}</TableCell>
                      <TableCell className="text-muted-foreground">{format(new Date(w.scheduled_at), "MMM dd, yyyy HH:mm")}</TableCell>
                      <TableCell className="text-muted-foreground">{w.duration_minutes}m</TableCell>
                      <TableCell className="text-foreground">{w.registrations}</TableCell>
                      <TableCell className="text-foreground">{w.attended}</TableCell>
                      <TableCell className="text-foreground">{w.registrations > 0 ? Math.round((w.attended / w.registrations) * 100) : 0}%</TableCell>
                      <TableCell className="text-muted-foreground">{w.avg_duration}m</TableCell>
                      <TableCell><Badge variant={statusColor(w.status)}>{w.status}</Badge></TableCell>
                      <TableCell>
                        {w.meeting_url && (
                          <a href={w.meeting_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {workshops.length === 0 && (
                    <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No workshops found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWorkshopTracking;
