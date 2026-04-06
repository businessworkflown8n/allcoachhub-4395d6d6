import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { coachName, expertise, bio, coachUserId } = await req.json();

    if (!coachName) {
      return new Response(JSON.stringify({ error: "coachName is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all learner profiles
    const { data: learnerRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "learner");

    if (rolesError) {
      console.error("Error fetching learner roles:", rolesError);
      return new Response(JSON.stringify({ error: "Failed to fetch learners" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!learnerRoles || learnerRoles.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No learners to notify" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const learnerIds = learnerRoles.map((r: any) => r.user_id);

    // Create in-app notifications for all learners (batch insert)
    const notifications = learnerIds.map((learnerId: string) => ({
      learner_id: learnerId,
      title: `🎉 New Coach Alert!`,
      message: `A new coach ${coachName} has joined${expertise ? ` in ${expertise}` : ""}. Click here to view profile and book your session.`,
      coach_id: coachUserId || null,
      is_read: false,
    }));

    // Insert in batches of 500
    for (let i = 0; i < notifications.length; i += 500) {
      const batch = notifications.slice(i, i + 500);
      const { error: insertError } = await supabase
        .from("learner_notifications")
        .insert(batch);
      if (insertError) {
        console.error(`Batch insert error at ${i}:`, insertError);
      }
    }

    console.log(`Created ${notifications.length} in-app notifications`);

    // Send emails to learners (fetch profiles with emails)
    if (resendApiKey) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", learnerIds);

      if (profiles && profiles.length > 0) {
        const coachProfileLink = coachUserId
          ? `https://www.aicoachportal.com/browse-coaches`
          : `https://www.aicoachportal.com/browse-coaches`;

        // Send emails in batches of 50 with delays
        const emailBatchSize = 50;
        let emailsSent = 0;

        for (let i = 0; i < profiles.length; i += emailBatchSize) {
          const batch = profiles.slice(i, i + emailBatchSize);

          const emailPromises = batch
            .filter((p: any) => p.email)
            .map((profile: any) => {
              const learnerName = profile.full_name || "Learner";
              const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;margin-top:32px;margin-bottom:32px;">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 32px;text-align:center;">
      <h1 style="margin:0;font-size:22px;color:#ffffff;">🎯 New Coach Joined AI Coach Portal!</h1>
    </div>
    <div style="padding:28px 32px;">
      <p style="font-size:15px;color:#1f2937;line-height:1.6;">Hi ${learnerName},</p>
      <p style="font-size:15px;color:#1f2937;line-height:1.6;">A new coach has just joined AI Coach Portal!</p>
      <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #e5e7eb;">
        <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>👨‍🏫 Coach Name:</strong> ${coachName}</p>
        ${expertise ? `<p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>📚 Expertise:</strong> ${expertise}</p>` : ""}
        ${bio ? `<p style="margin:0;font-size:14px;color:#374151;"><strong>📝 Bio:</strong> ${bio}</p>` : ""}
      </div>
      <div style="text-align:center;margin-top:24px;">
        <a href="${coachProfileLink}"
           style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">
          👉 Explore & Book a Session Now
        </a>
      </div>
      <p style="font-size:14px;color:#6b7280;margin-top:24px;line-height:1.6;">Stay ahead in your learning journey!</p>
      <p style="font-size:14px;color:#6b7280;line-height:1.6;">Regards,<br/>AI Coach Portal Team</p>
    </div>
  </div>
</body>
</html>`;

              return fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${resendApiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  from: "AI Coach Portal <onboarding@resend.dev>",
                  to: [profile.email],
                  subject: `🎯 New Coach Joined – Explore Now on AI Coach Portal`,
                  html: emailHtml,
                  tags: [{ name: "category", value: "new-coach-notification" }],
                }),
              }).catch((err) => console.error(`Email failed for ${profile.email}:`, err));
            });

          await Promise.allSettled(emailPromises);
          emailsSent += batch.filter((p: any) => p.email).length;

          // Rate limit: wait 1 second between batches
          if (i + emailBatchSize < profiles.length) {
            await new Promise((r) => setTimeout(r, 1000));
          }
        }

        console.log(`Sent ${emailsSent} notification emails to learners`);
      }
    } else {
      console.warn("RESEND_API_KEY not configured, skipping emails");
    }

    return new Response(
      JSON.stringify({ success: true, notificationsCreated: notifications.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
