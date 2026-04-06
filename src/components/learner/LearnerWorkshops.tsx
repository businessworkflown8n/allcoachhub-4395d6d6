import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Video, Calendar, Clock, ExternalLink, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface WorkshopWithReg {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  meeting_url: string | null;
  meeting_provider: string | null;
  status: string;
  recording_url: string | null;
  coach_name?: string;
  is_registered: boolean;
  registration_status?: string;
}

const LearnerWorkshops = () => {
  const { user } = useAuth();
  const [workshops, setWorkshops] = useState<WorkshopWithReg[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkshops = async () => {
    if (!user) return;
    setLoading(true);

    const { data: ws } = await supabase
      .from("workshops")
      .select("*")
      .in("status", ["scheduled", "live", "completed"])
      .order("scheduled_at", { ascending: false });

    if (!ws) { setLoading(false); return; }

    const coachIds = [...new Set(ws.map((w) => w.coach_id))];
    const { data: profiles } = coachIds.length > 0
      ? await supabase.from("profiles").select("user_id, full_name").in("user_id", coachIds)
      : { data: [] };
    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));

    const { data: myRegs } = await supabase
      .from("workshop_registrations")
      .select("workshop_id, status")
      .eq("user_id", user.id);
    const regMap = new Map((myRegs || []).map((r) => [r.workshop_id, r.status]));

    setWorkshops(ws.map((w) => ({
      ...w,
      coach_name: profileMap.get(w.coach_id) || "Unknown Coach",
      is_registered: regMap.has(w.id),
      registration_status: regMap.get(w.id),
    })));
    setLoading(false);
  };

  useEffect(() => { fetchWorkshops(); }, [user]);

  const handleRegister = async (workshopId: string) => {
    if (!user) return;
    const { error } = await supabase.from("workshop_registrations").insert({ workshop_id: workshopId, user_id: user.id });
    if (error) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Registered successfully!" });
      fetchWorkshops();
    }
  };

  const addToCalendar = (w: WorkshopWithReg) => {
    const start = new Date(w.scheduled_at);
    const end = new Date(start.getTime() + w.duration_minutes * 60000);
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(w.title)}&dates=${start.toISOString().replace(/[-:]/g, "").split(".")[0]}Z/${end.toISOString().replace(/[-:]/g, "").split(".")[0]}Z&details=${encodeURIComponent(w.description || "")}`;
    window.open(url, "_blank");
  };

  const upcoming = workshops.filter((w) => w.status === "scheduled" || w.status === "live");
  const completed = workshops.filter((w) => w.status === "completed");

  const WorkshopCard = ({ w }: { w: WorkshopWithReg }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-foreground">{w.title}</h3>
              <p className="text-sm text-muted-foreground">by {w.coach_name}</p>
            </div>
            <Badge variant={w.status === "live" ? "default" : w.status === "completed" ? "secondary" : "outline"}>
              {w.status === "live" ? "🔴 LIVE" : w.status}
            </Badge>
          </div>
          {w.description && <p className="text-sm text-muted-foreground line-clamp-2">{w.description}</p>}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{format(new Date(w.scheduled_at), "MMM dd, yyyy")}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{format(new Date(w.scheduled_at), "HH:mm")} · {w.duration_minutes}m</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {w.is_registered ? (
              <>
                <Badge variant="secondary" className="gap-1"><CheckCircle className="h-3 w-3" />Registered</Badge>
                {(w.status === "scheduled" || w.status === "live") && w.meeting_url && (
                  <Button size="sm" asChild><a href={w.meeting_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 mr-1" />Join Session</a></Button>
                )}
                {w.status !== "completed" && <Button size="sm" variant="outline" onClick={() => addToCalendar(w)}>📅 Add to Calendar</Button>}
              </>
            ) : (
              w.status !== "completed" && <Button size="sm" onClick={() => handleRegister(w.id)}>Register Now</Button>
            )}
            {w.status === "completed" && w.recording_url && (
              <Button size="sm" variant="outline" asChild><a href={w.recording_url} target="_blank" rel="noopener noreferrer"><Video className="h-4 w-4 mr-1" />Watch Recording</a></Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Video className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold text-foreground">Workshops & Live Sessions</h2>
          <p className="text-sm text-muted-foreground">Browse, register and join live sessions</p>
        </div>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : upcoming.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No upcoming workshops</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{upcoming.map((w) => <WorkshopCard key={w.id} w={w} />)}</div>
          )}
        </TabsContent>
        <TabsContent value="completed">
          {completed.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No completed workshops yet</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{completed.map((w) => <WorkshopCard key={w.id} w={w} />)}</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LearnerWorkshops;
