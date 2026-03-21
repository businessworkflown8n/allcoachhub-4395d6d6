import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, Video, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const LiveEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("community_events").select("*").order("start_time", { ascending: tab === "upcoming" });
      setEvents(data || []);
      if (user) {
        const { data: regs } = await supabase.from("community_event_registrations").select("event_id").eq("user_id", user.id);
        setRegistrations(new Set((regs || []).map((r: any) => r.event_id)));
      }
      setLoading(false);
    };
    load();
  }, [user, tab]);

  const toggleRegister = async (eventId: string) => {
    if (!user) return;
    if (registrations.has(eventId)) {
      await supabase.from("community_event_registrations").delete().eq("event_id", eventId).eq("user_id", user.id);
      setRegistrations(prev => { const n = new Set(prev); n.delete(eventId); return n; });
      toast.success("Registration cancelled");
    } else {
      const { error } = await supabase.from("community_event_registrations").insert({ event_id: eventId, user_id: user.id });
      if (error) { toast.error("Failed to register"); return; }
      setRegistrations(prev => new Set(prev).add(eventId));
      toast.success("Registered successfully!");
    }
  };

  const now = new Date();
  const filtered = events.filter(e => tab === "upcoming" ? new Date(e.start_time) >= now : new Date(e.start_time) < now);

  const accessColors: Record<string, string> = { public: "bg-green-500/20 text-green-400", private: "bg-yellow-500/20 text-yellow-400", premium: "bg-purple-500/20 text-purple-400" };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Live Events & Office Hours</h2>
          <p className="text-sm text-muted-foreground">Join live sessions, workshops, and office hours with AI experts.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={tab === "upcoming" ? "default" : "outline"} onClick={() => setTab("upcoming")}>Upcoming</Button>
          <Button size="sm" variant={tab === "past" ? "default" : "outline"} onClick={() => setTab("past")}>Past Events</Button>
        </div>
      </div>

      {filtered.length === 0 && <Card><CardContent className="p-8 text-center text-muted-foreground">{tab === "upcoming" ? "No upcoming events. Check back soon!" : "No past events yet."}</CardContent></Card>}

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map(event => (
          <Card key={event.id} className="transition-all hover:border-primary/30">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="outline" className="text-xs capitalize">{event.event_type.replace("_", " ")}</Badge>
                <Badge className={`text-xs border-0 capitalize ${accessColors[event.access_type] || ""}`}>{event.access_type}</Badge>
              </div>
              <h3 className="text-lg font-semibold text-foreground">{event.title}</h3>
              {event.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{event.description}</p>}
              {event.host_name && <p className="mt-2 text-sm text-foreground">Hosted by <span className="font-medium text-primary">{event.host_name}</span></p>}
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4" />{new Date(event.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                <div className="flex items-center gap-2"><Clock className="h-4 w-4" />{new Date(event.start_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
                <div className="flex items-center gap-2"><Users className="h-4 w-4" />{event.registered_count}/{event.capacity || "∞"} registered</div>
              </div>
              <div className="mt-4 flex gap-2">
                {tab === "upcoming" ? (
                  <Button size="sm" variant={registrations.has(event.id) ? "outline" : "default"} onClick={() => toggleRegister(event.id)} className="flex-1">
                    {registrations.has(event.id) ? "Cancel Registration" : "Register"}
                  </Button>
                ) : event.replay_url ? (
                  <Button size="sm" variant="outline" className="flex-1" asChild><a href={event.replay_url} target="_blank" rel="noopener noreferrer"><Video className="mr-2 h-4 w-4" />Watch Replay</a></Button>
                ) : (
                  <Button size="sm" variant="outline" className="flex-1" disabled>No replay available</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LiveEvents;
