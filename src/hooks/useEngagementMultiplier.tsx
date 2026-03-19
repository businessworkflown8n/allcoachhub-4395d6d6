import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Multipliers {
  viewMultiplier: number;
  downloadMultiplier: number;
}

export const useEngagementMultiplier = () => {
  const [multipliers, setMultipliers] = useState<Multipliers>({
    viewMultiplier: 10,
    downloadMultiplier: 5,
  });

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("key, value")
        .in("key", ["material_view_multiplier", "material_download_multiplier"]);
      if (data) {
        const m = { ...multipliers };
        data.forEach((r: any) => {
          const v = parseInt(r.value, 10);
          if (isNaN(v) || v < 1) return;
          if (r.key === "material_view_multiplier") m.viewMultiplier = v;
          if (r.key === "material_download_multiplier") m.downloadMultiplier = v;
        });
        setMultipliers(m);
      }
    };
    fetch();
  }, []);

  const displayViews = (actual: number) => actual === 0 ? 0 : Math.round(actual * multipliers.viewMultiplier);
  const displayDownloads = (actual: number) => actual === 0 ? 0 : Math.round(actual * multipliers.downloadMultiplier);
  const isTrending = (actual: number) => displayViews(actual) > 100;
  const isPopular = (actual: number) => displayDownloads(actual) > 50;

  return { displayViews, displayDownloads, isTrending, isPopular, multipliers };
};
