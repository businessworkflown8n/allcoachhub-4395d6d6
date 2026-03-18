import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { Shield, Check, X, Eye, Clock, Users } from "lucide-react";

type SharingRequest = {
  id: string;
  coach_id: string;
  recipient_name: string;
  recipient_email: string;
  recipient_role: string;
  status: string;
  admin_notes: string | null;
  access_token: string | null;
  created_at: string;
  approved_at: string | null;
  rejected_at: string | null;
};

const AdminSharingRequests = () => {
  const [requests, setRequests] = useState<SharingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [coachNames, setCoachNames] = useState<Map<string, string>>(new Map());
  const [notesDialog, setNotesDialog] = useState<{ open: boolean; id: string; notes: string }>({ open: false, id: "", notes: "" });

  const fetchRequests = async () => {
    const { data } = await supabase.from("report_sharing_requests").select("*").order("created_at", { ascending: false });
    if (data) {
      setRequests(data as unknown as SharingRequest[]);
      // Fetch coach names
      const coachIds = [...new Set(data.map((r: any) => r.coach_id))];
      if (coachIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", coachIds);
        const map = new Map<string, string>();
        profiles?.forEach((p: any) => map.set(p.user_id, p.full_name || "Unknown"));
        setCoachNames(map);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleApprove = async (id: string) => {
    const token = crypto.randomUUID();
    const { error } = await supabase.from("report_sharing_requests").update({
      status: "approved",
      access_token: token,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) { toast.error("Failed to approve"); return; }
    toast.success("Request approved. Access token generated.");
    fetchRequests();
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase.from("report_sharing_requests").update({
      status: "rejected",
      rejected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      admin_notes: notesDialog.notes || "Request rejected by admin",
    }).eq("id", id);
    if (error) { toast.error("Failed to reject"); return; }
    toast.success("Request rejected. Coach will be notified.");
    setNotesDialog({ open: false, id: "", notes: "" });
    fetchRequests();
  };

  const getStatusBadge = (status: string) => {
    if (status === "approved") return <Badge className="bg-green-500/20 text-green-400">Approved</Badge>;
    if (status === "rejected") return <Badge variant="destructive">Rejected</Badge>;
    return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
  };

  const pending = requests.filter(r => r.status === "pending").length;
  const approved = requests.filter(r => r.status === "approved").length;

  if (loading) return <div className="flex justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /> Sharing Requests</h2>
        <p className="text-muted-foreground text-sm mt-1">Review and approve coach report sharing requests</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-yellow-400">{pending}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-400">{approved}</p><p className="text-xs text-muted-foreground">Approved</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">{requests.length}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coach</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No sharing requests</TableCell></TableRow>
              )}
              {requests.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{coachNames.get(r.coach_id) || "Unknown"}</TableCell>
                  <TableCell>{r.recipient_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.recipient_email}</TableCell>
                  <TableCell><Badge variant="outline">{r.recipient_role}</Badge></TableCell>
                  <TableCell>{getStatusBadge(r.status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(r.created_at), "dd MMM yyyy")}</TableCell>
                  <TableCell>
                    {r.status === "pending" && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="gap-1 text-green-400" onClick={() => handleApprove(r.id)}>
                          <Check className="h-3 w-3" /> Approve
                        </Button>
                        <Button size="sm" variant="ghost" className="gap-1 text-destructive" onClick={() => setNotesDialog({ open: true, id: r.id, notes: "" })}>
                          <X className="h-3 w-3" /> Reject
                        </Button>
                      </div>
                    )}
                    {r.status === "approved" && r.access_token && (
                      <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(r.access_token!); toast.success("Token copied"); }}>
                        Copy Token
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={notesDialog.open} onOpenChange={open => setNotesDialog({ ...notesDialog, open })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Request</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Rejection Reason (optional)</label>
              <Input value={notesDialog.notes} onChange={e => setNotesDialog({ ...notesDialog, notes: e.target.value })} placeholder="Reason for rejection..." />
            </div>
            <Button variant="destructive" onClick={() => handleReject(notesDialog.id)} className="w-full">Confirm Rejection</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSharingRequests;
