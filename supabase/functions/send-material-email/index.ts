import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { recipientEmail, materialTitle, materialDescription, materialLink, senderName } = await req.json();

    if (!recipientEmail || !materialTitle || !materialLink) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Email service not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a2e;">📚 Shared Learning Material</h2>
        <p style="color: #555;">${senderName} shared a learning material with you:</p>
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1a1a2e; margin-top: 0;">${materialTitle}</h3>
          ${materialDescription ? `<p style="color: #666;">${materialDescription}</p>` : ""}
        </div>
        <a href="${materialLink}" style="display: inline-block; background: #84cc16; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">View Material</a>
        <p style="color: #999; margin-top: 20px; font-size: 12px;">Sent from AI Coach Portal</p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "AI Coach Portal <hello@aicoachportal.com>",
        to: [recipientEmail],
        subject: `${senderName} shared: ${materialTitle}`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
