import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface WorkshopPermissions {
  hasAccess: boolean;
  meetingCreation: boolean;
  emailSending: boolean;
  recordingAccess: boolean;
  analyticsAccess: boolean;
  loading: boolean;
}

export const useWorkshopAccess = (): WorkshopPermissions => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<WorkshopPermissions>({
    hasAccess: false,
    meetingCreation: false,
    emailSending: false,
    recordingAccess: false,
    analyticsAccess: false,
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setPermissions((p) => ({ ...p, loading: false }));
      return;
    }
    const check = async () => {
      const { data } = await supabase
        .from("workshop_access")
        .select("is_active, meeting_creation, email_sending, recording_access, analytics_access")
        .eq("coach_id", user.id)
        .maybeSingle();
      setPermissions({
        hasAccess: !!data?.is_active,
        meetingCreation: data?.meeting_creation ?? false,
        emailSending: data?.email_sending ?? false,
        recordingAccess: data?.recording_access ?? false,
        analyticsAccess: data?.analytics_access ?? false,
        loading: false,
      });
    };
    check();
  }, [user]);

  return permissions;
};
