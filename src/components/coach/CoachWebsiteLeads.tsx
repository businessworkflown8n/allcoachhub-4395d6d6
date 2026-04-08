import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useContactAccess } from "@/hooks/useContactAccess";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Lock, Clock, XCircle, Send, Users } from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  created_at: string;
  user_type: string;
}

const CoachWebsiteLeads = () => {
  const { user } = useAuth();
  const { hasAccess, isPending, requestAccess, loading: accessLoading } = useContactAccess();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [purpose, setPurpose] = useState("follow_up");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("chatbot_leads")
      .select("id, name, email, whatsapp, created_at, user_type")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setLeads(data || []);
        setLoading(false);
      });
  }, [user]);

  const getStatus = useCallback(
    (leadId: string) => {
      if (hasAccess(leadId)) return "approved";
      if (isPending(leadId)) return "requested";
      return "hidden";
    },
    [hasAccess, isPending]
  );

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1"><ShieldCheck className="h-3 w-3" /> Approved</Badge>;
      case "requested":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 gap-1"><Clock className="h-3 w-3" /> Requested</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground border-border gap-1"><Lock className="h-3 w-3" /> Contact Hidden</Badge>;
    }
  };

  const openRequestModal = (lead: Lead) => {
    setSelectedLead(lead);
    setPurpose("follow_up");
    setModalOpen(true);
  };

  const handleSubmitRequest = async () => {
    if (!selectedLead) return;
    setSubmitting(true);
    const result = await requestAccess(selectedLead.id, selectedLead.user_type || "learner");
    if (result?.error) {
      toast({ title: "Request failed", description: result.error.message, variant: "destructive" });
    } else {
      toast({ title: "Request sent", description: "Admin will review your contact access request." });
      setModalOpen(false);
    }
    setSubmitting(false);
  };

  if (loading || accessLoading) return null;
  if (leads.length === 0) return null;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Website Leads (Contact Access Control)
          </CardTitle>
          <p className="text-xs text-muted-foreground">Request admin approval to view lead contact details</p>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Contact Status</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => {
                  const status = getStatus(lead.id);
                  return (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium text-foreground whitespace-nowrap">{lead.name}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{statusBadge(status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {status === "approved" ? (
                          <div className="space-y-0.5 text-xs">
                            <p>{lead.email}</p>
                            <p>{lead.whatsapp}</p>
                          </div>
                        ) : (
                          <span className="text-xs">••••••••</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {status === "hidden" ? (
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => openRequestModal(lead)}>
                            <Send className="h-3.5 w-3.5" /> Request Contact
                          </Button>
                        ) : status === "requested" ? (
                          <span className="text-xs text-yellow-400">Pending review</span>
                        ) : (
                          <span className="text-xs text-green-400">Access granted</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Contact Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Lead Name</Label>
              <p className="text-sm font-medium text-foreground">{selectedLead?.name}</p>
            </div>
            <div className="space-y-2">
              <Label>Purpose</Label>
              <Select value={purpose} onValueChange={setPurpose}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="enrollment">Enrollment Discussion</SelectItem>
                  <SelectItem value="support">Support / Query</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitRequest} disabled={submitting}>
              {submitting ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CoachWebsiteLeads;
