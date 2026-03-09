import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userId = claims.claims.sub as string;

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: corsHeaders });
    }

    const { campaignId, recipients } = await req.json();

    if (!campaignId || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return new Response(JSON.stringify({ error: "campaignId and recipients array required" }), { status: 400, headers: corsHeaders });
    }

    // Fetch campaign
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: campaign, error: campError } = await adminClient
      .from("email_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campError || !campaign) {
      return new Response(JSON.stringify({ error: "Campaign not found" }), { status: 404, headers: corsHeaders });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "Email service not configured" }), { status: 500, headers: corsHeaders });
    }

    let sent = 0;
    const errors: string[] = [];
    const batchSize = 10;
    const unsubscribeBase = "https://www.aicoachportal.com/unsubscribe";

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const promises = batch.map(async (recipient: { email: string; name?: string }) => {
        try {
          // Personalize content
          let personalizedContent = campaign.content
            .replace(/\{Name\}/g, recipient.name || "there")
            .replace(/\{Email\}/g, recipient.email);

          // Build HTML email
          const ctaHtml = campaign.cta_text
            ? `<div style="text-align:center;margin:24px 0"><a href="https://www.aicoachportal.com${campaign.cta_link || "/courses"}" style="background-color:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">${campaign.cta_text}</a></div>`
            : "";

          const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:32px 24px">
  <div style="text-align:center;margin-bottom:24px">
    <h2 style="color:#1a1a2e;margin:0">AI Coach Portal</h2>
  </div>
  <div style="color:#333;font-size:16px;line-height:1.6;white-space:pre-wrap">${personalizedContent}</div>
  ${ctaHtml}
  <hr style="border:none;border-top:1px solid #eee;margin:32px 0">
  <div style="text-align:center;font-size:12px;color:#999">
    <p>© ${new Date().getFullYear()} AI Coach Portal. All rights reserved.</p>
    <p><a href="${unsubscribeBase}?email=${encodeURIComponent(recipient.email)}" style="color:#999">Unsubscribe</a></p>
  </div>
</div>
</body>
</html>`;

          const personalizedSubject = campaign.subject
            .replace(/\{Name\}/g, recipient.name || "there")
            .replace(/\{Email\}/g, recipient.email);

          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: `${campaign.sender_name} <${campaign.sender_email}>`,
              to: [recipient.email],
              subject: personalizedSubject,
              html: htmlBody,
            }),
          });

          if (res.ok) {
            sent++;
          } else {
            const errText = await res.text();
            errors.push(`${recipient.email}: ${errText}`);
          }
        } catch (e) {
          errors.push(`${recipient.email}: ${e.message}`);
        }
      });

      await Promise.all(promises);

      // Rate limiting: wait between batches
      if (i + batchSize < recipients.length) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    // Update campaign
    await adminClient
      .from("email_campaigns")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        total_recipients: recipients.length,
        total_sent: sent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaignId);

    return new Response(
      JSON.stringify({ success: true, sent, total: recipients.length, errors: errors.slice(0, 10) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
