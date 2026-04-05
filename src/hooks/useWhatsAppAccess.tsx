import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useWhatsAppAccess = () => {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const check = async () => {
      const { data } = await supabase
        .from("whatsapp_access")
        .select("is_active")
        .eq("coach_id", user.id)
        .maybeSingle();
      setHasAccess(!!data?.is_active);
      setLoading(false);
    };
    check();
  }, [user]);

  return { hasAccess, loading };
};
