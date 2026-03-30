import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CoachCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export const useCoachCategories = (activeOnly = true) => {
  const [categories, setCategories] = useState<CoachCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      let query = supabase
        .from("coach_categories")
        .select("id, name, slug, icon, sort_order, is_active")
        .order("sort_order", { ascending: true });

      if (activeOnly) {
        query = query.eq("is_active", true);
      }

      const { data } = await query;
      setCategories((data as CoachCategory[]) || []);
      setLoading(false);
    };
    fetch();
  }, [activeOnly]);

  return { categories, loading };
};
