import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Lock } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  featureKey: string;
  featureLabel: string;
  description?: string;
}

const RequestFeatureAccessModal = ({ open, onOpenChange, featureKey, featureLabel, description }: Props) => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("feature_access_requests").insert({
      coach_id: user.id, feature_key: featureKey, message: message || null,
    });
    setSubmitting(false);
    if (error) { toast({ title: "Could not submit request", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Request sent", description: "Admin will review and notify you." });
    setMessage(""); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-primary" />Request access: {featureLabel}</DialogTitle>
          <DialogDescription>{description || "This feature is currently locked on your account. Tell admin why you need it and they'll review your request."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Message (optional)</Label>
          <Textarea rows={4} placeholder="Briefly explain how you'll use this feature..." value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>{submitting ? "Sending..." : "Send Request"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequestFeatureAccessModal;
