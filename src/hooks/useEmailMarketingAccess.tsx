import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useEmailMarketingAccess = () => {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    const checkAccess = async () => {
      const { data } = await supabase
        .from("email_marketing_access")
        .select("is_active")
        .eq("coach_id", user.id)
        .maybeSingle();

      setHasAccess(data?.is_active === true);
      setLoading(false);
    };

    checkAccess();
  }, [user]);

  return { hasAccess, loading };
};
