import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface NotificationPermissionState {
  loading: boolean;
  globalEnabled: boolean;
  coachEnabled: boolean;
  isBlocked: boolean;
  canSubmit: boolean;
}

export const useNotificationPermissions = (): NotificationPermissionState => {
  const { user } = useAuth();
  const [state, setState] = useState<NotificationPermissionState>({
    loading: true,
    globalEnabled: true,
    coachEnabled: true,
    isBlocked: false,
    canSubmit: false,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [{ data: settings }, { data: perm }] = await Promise.all([
        supabase.from("notification_settings" as any).select("key, enabled"),
        user
          ? supabase
              .from("coach_notification_permissions" as any)
              .select("is_blocked")
              .eq("coach_id", user.id)
              .maybeSingle()
          : Promise.resolve({ data: null } as any),
      ]);
      if (cancelled) return;
      const map = new Map<string, boolean>((settings || []).map((s: any) => [s.key, s.enabled]));
      const globalEnabled = map.get("global_notifications_enabled") ?? true;
      const coachEnabled = map.get("coach_notifications_enabled") ?? true;
      const isBlocked = !!(perm as any)?.is_blocked;
      setState({
        loading: false,
        globalEnabled,
        coachEnabled,
        isBlocked,
        canSubmit: globalEnabled && coachEnabled && !isBlocked,
      });
    };
    load();
    return () => { cancelled = true; };
  }, [user]);

  return state;
};
