import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ApprovedCategory {
  id: string;
  category_id: string;
  category_name: string;
  category_icon: string | null;
  is_primary: boolean;
}

interface CategoryRequest {
  id: string;
  requested_category_id: string;
  category_name: string;
  category_icon: string | null;
  reason: string | null;
  status: string;
  admin_response_note: string | null;
  created_at: string;
}

export const useCoachCategoryPermissions = (userId: string | undefined) => {
  const [approvedCategories, setApprovedCategories] = useState<ApprovedCategory[]>([]);
  const [requests, setRequests] = useState<CategoryRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    if (!userId) return;
    setLoading(true);

    const [permRes, reqRes] = await Promise.all([
      supabase
        .from("coach_category_permissions")
        .select("id, category_id, is_primary, status")
        .eq("coach_id", userId)
        .eq("status", "approved"),
      supabase
        .from("coach_category_requests")
        .select("id, requested_category_id, reason, status, admin_response_note, created_at")
        .eq("coach_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    // Fetch category details
    const categoryIds = [
      ...(permRes.data || []).map((p: any) => p.category_id),
      ...(reqRes.data || []).map((r: any) => r.requested_category_id),
    ];
    const uniqueIds = [...new Set(categoryIds)];

    let catMap: Record<string, { name: string; icon: string | null }> = {};
    if (uniqueIds.length > 0) {
      const { data: cats } = await supabase
        .from("coach_categories")
        .select("id, name, icon")
        .in("id", uniqueIds);
      (cats || []).forEach((c: any) => {
        catMap[c.id] = { name: c.name, icon: c.icon };
      });
    }

    setApprovedCategories(
      (permRes.data || []).map((p: any) => ({
        id: p.id,
        category_id: p.category_id,
        category_name: catMap[p.category_id]?.name || "Unknown",
        category_icon: catMap[p.category_id]?.icon || null,
        is_primary: p.is_primary,
      }))
    );

    setRequests(
      (reqRes.data || []).map((r: any) => ({
        id: r.id,
        requested_category_id: r.requested_category_id,
        category_name: catMap[r.requested_category_id]?.name || "Unknown",
        category_icon: catMap[r.requested_category_id]?.icon || null,
        reason: r.reason,
        status: r.status,
        admin_response_note: r.admin_response_note,
        created_at: r.created_at,
      }))
    );

    setLoading(false);
  };

  useEffect(() => {
    fetch();
  }, [userId]);

  return { approvedCategories, requests, loading, refetch: fetch };
};
