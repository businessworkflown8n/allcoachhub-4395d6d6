import { supabase } from "@/integrations/supabase/client";

/**
 * Captures the full email signup form payload into the isolated `signup_submissions` table.
 * Non-blocking: failures are logged but never interrupt the signup flow.
 *
 * Pass the entire `formData` object — every field is stored dynamically (future-proof).
 */
export async function captureEmailSignupSubmission(params: {
  userType: "coach" | "learner";
  email: string;
  formData: Record<string, unknown>;
  userId?: string | null;
}) {
  try {
    // Strip sensitive fields (passwords) before storing
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(params.formData ?? {})) {
      const k = key.toLowerCase();
      if (k.includes("password")) continue;
      sanitized[key] = value;
    }

    const fieldCount = Object.values(sanitized).filter(
      (v) => v !== undefined && v !== null && v !== ""
    ).length;

    // Pull UTM params + source from current URL
    const urlParams =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams();

    const payload = {
      user_id: params.userId ?? null,
      user_type: params.userType,
      signup_method: "email",
      email: params.email,
      form_data: sanitized as never,
      field_count: fieldCount,
      source_url: typeof window !== "undefined" ? window.location.href : null,
      utm_source: urlParams.get("utm_source"),
      utm_medium: urlParams.get("utm_medium"),
      utm_campaign: urlParams.get("utm_campaign"),
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    };

    const { error } = await supabase
      .from("signup_submissions")
      .insert(payload as never);

    if (error) {
      console.warn("[signupCapture] insert failed:", error.message);
    } else {
      // Optional analytics event
      try {
        const w = window as unknown as { gtag?: (...args: unknown[]) => void };
        w.gtag?.("event", "email_signup_completed", {
          user_type: params.userType,
          number_of_fields_filled: fieldCount,
        });
      } catch {
        /* noop */
      }
    }
  } catch (err) {
    console.warn("[signupCapture] unexpected error:", err);
  }
}
