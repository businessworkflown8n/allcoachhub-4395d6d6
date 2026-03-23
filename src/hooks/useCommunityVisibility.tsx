import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useCommunityVisibility = () => {
  const [showForLearners, setShowForLearners] = useState(true);
  const [showForCoaches, setShowForCoaches] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("key, value")
        .in("key", ["show_ai_community_learners", "show_ai_community_coaches"]);
      if (data) {
        data.forEach((r) => {
          if (r.key === "show_ai_community_learners") setShowForLearners(r.value === "true");
          if (r.key === "show_ai_community_coaches") setShowForCoaches(r.value === "true");
        });
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return { showForLearners, showForCoaches, loading };
};
