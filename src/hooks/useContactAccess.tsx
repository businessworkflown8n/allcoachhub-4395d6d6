import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface AccessRequest {
  id: string;
  coach_id: string;
  user_id: string;
  user_type: string;
  status: string;
  created_at: string;
}

export const useContactAccess = () => {
  const { user } = useAuth();
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from("contact_access_requests")
      .select("user_id, status")
      .eq("coach_id", user.id)
      .then(({ data }) => {
        const approved = new Set<string>();
        const pending = new Set<string>();
        (data || []).forEach((r: any) => {
          if (r.status === "approved") approved.add(r.user_id);
          else if (r.status === "pending") pending.add(r.user_id);
        });
        setApprovedIds(approved);
        setPendingIds(pending);
        setLoading(false);
      });
  }, [user]);

  const hasAccess = useCallback((userId: string) => approvedIds.has(userId), [approvedIds]);
  const isPending = useCallback((userId: string) => pendingIds.has(userId), [pendingIds]);

  const requestAccess = useCallback(async (userId: string, userType: string = "learner") => {
    if (!user) return;
    const { error } = await supabase.from("contact_access_requests").insert({
      coach_id: user.id,
      user_id: userId,
      user_type: userType,
    });
    if (!error) {
      setPendingIds((prev) => new Set(prev).add(userId));
    }
    return { error };
  }, [user]);

  return { hasAccess, isPending, requestAccess, loading };
};
