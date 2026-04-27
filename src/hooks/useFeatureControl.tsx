import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PlanTier = "free" | "pro" | "premium";

export interface EffectiveFeature {
  enabled: boolean;
  usage_limit: number | null;
  reason: string;
  dependency?: string;
}

/**
 * Resolves an effective feature flag for a coach (global + plan + override + deps).
 * Subscribes to realtime changes so toggles reflect without logout.
 */
export function useFeatureControl(featureKey: string, plan: PlanTier = "free", coachId?: string) {
  const [data, setData] = useState<EffectiveFeature | null>(null);
  const [loading, setLoading] = useState(true);

  const resolve = useCallback(async () => {
    let uid = coachId;
    if (!uid) {
      const { data: u } = await supabase.auth.getUser();
      uid = u.user?.id;
    }
    if (!uid) {
      setData({ enabled: false, usage_limit: null, reason: "no_user" });
      setLoading(false);
      return;
    }
    const { data: res, error } = await supabase.rpc("get_effective_feature", {
      _coach_id: uid,
      _feature_key: featureKey,
      _plan: plan,
    });
    if (error) {
      setData({ enabled: false, usage_limit: null, reason: "error" });
    } else {
      setData(res as unknown as EffectiveFeature);
    }
    setLoading(false);
  }, [featureKey, plan, coachId]);

  useEffect(() => {
    resolve();
    const channel = supabase
      .channel(`feature-control-${featureKey}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "feature_controls", filter: `feature_key=eq.${featureKey}` }, resolve)
      .on("postgres_changes", { event: "*", schema: "public", table: "coach_feature_override", filter: `feature_key=eq.${featureKey}` }, resolve)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [resolve, featureKey]);

  return { data, loading, refresh: resolve };
}
