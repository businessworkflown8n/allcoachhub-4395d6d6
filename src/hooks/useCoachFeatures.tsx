import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface CoachFeatures {
  workshops_access: boolean;
  courses_access: boolean;
  feed_access: boolean;
  messaging_access: boolean;
  paid_content_access: boolean;
  contact_access: boolean;
  profile_picture_access: boolean;
  status: string;
}

const DEFAULT_FEATURES: CoachFeatures = {
  workshops_access: false,
  courses_access: false,
  feed_access: false,
  messaging_access: false,
  paid_content_access: false,
  contact_access: false,
  profile_picture_access: true,
  status: "pending",
};

export const useCoachFeatures = () => {
  const { user } = useAuth();
  const [features, setFeatures] = useState<CoachFeatures>(DEFAULT_FEATURES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from("coach_feature_flags")
      .select("workshops_access, courses_access, feed_access, messaging_access, paid_content_access, contact_access, profile_picture_access, status")
      .eq("coach_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setFeatures({ ...DEFAULT_FEATURES, ...(data as any) });
        setLoading(false);
      });
  }, [user]);

  return { ...features, loading, isApproved: features.status === "approved" };
};
