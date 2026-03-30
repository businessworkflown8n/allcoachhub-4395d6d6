import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface CategoryOption {
  id: string;
  name: string;
  icon: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coachId: string;
  availableCategories: CategoryOption[];
  onSuccess: () => void;
}

const CategoryRequestModal = ({ open, onOpenChange, coachId, availableCategories, onSuccess }: Props) => {
  const [categoryId, setCategoryId] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!categoryId) {
      toast({ title: "Please select a category", variant: "destructive" });
      return;
    }
    setSubmitting(true);

    const { error } = await supabase.from("coach_category_requests").insert({
      coach_id: coachId,
      requested_category_id: categoryId,
      reason: reason.trim() || null,
      status: "pending",
    });

    setSubmitting(false);
    if (error) {
      if (error.message.includes("duplicate") || error.code === "23505") {
        toast({ title: "You already have a pending request for this category", variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Request submitted!", description: "Your category request has been submitted for admin approval." });
      setCategoryId("");
      setReason("");
      onOpenChange(false);
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request New Category</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Select the category you'd like to teach in. Your request will be reviewed by an admin.
        </p>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-foreground">Category *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.length === 0 ? (
                  <SelectItem value="none" disabled>No categories available</SelectItem>
                ) : (
                  availableCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon ? `${cat.icon} ${cat.name}` : cat.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Why do you want to teach in this category? (optional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Share your experience or reason..."
              rows={3}
              className="bg-secondary border-border resize-none"
            />
          </div>

          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryRequestModal;
