import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useThumbnailAccess = () => {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const check = async () => {
      const { data } = await supabase
        .from("thumbnail_access" as any)
        .select("is_active")
        .eq("coach_id", user.id)
        .eq("is_active", true)
        .maybeSingle();
      setHasAccess(!!data);
      setLoading(false);
    };
    check();
  }, [user]);

  return { hasAccess, loading };
};
