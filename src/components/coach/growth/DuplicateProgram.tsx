import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props { open: boolean; onClose: () => void; }

const DuplicateProgram = ({ open, onClose }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    supabase.from("courses").select("id, title, category, description, duration_hours, price_usd, price_inr, level, language, curriculum, thumbnail_url, intro_video_url")
      .eq("coach_id", user.id)
      .then(({ data }) => setCourses(data || []));
  }, [open, user]);

  const handleDuplicate = async () => {
    const course = courses.find((c) => c.id === selectedId);
    if (!course) { toast.error("Select a program"); return; }
    setLoading(true);
    const { id, ...rest } = course;
    const { data, error } = await supabase.from("courses").insert({
      ...rest,
      coach_id: user!.id,
      title: `${course.title} (Copy)`,
      is_published: false,
      approval_status: "pending",
      slug: null,
    }).select("id").single();

    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success("Program duplicated!");
    onClose();
    navigate(`/coach/courses/${data.id}/edit`);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Duplicate Program</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger><SelectValue placeholder="Select program to clone" /></SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleDuplicate} disabled={loading || !selectedId} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            Duplicate & Edit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateProgram;
