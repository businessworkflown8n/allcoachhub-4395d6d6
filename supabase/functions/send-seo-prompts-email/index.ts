import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, name } = await req.json();
    const recipientEmail = email || user.email;
    const recipientName = name || user.user_metadata?.full_name || "Learner";

    const documentUrl = "https://docs.google.com/document/d/1YST8WemQag2Qu8Kqivrg3KEzTXQDvMXkQ_Uh-7uPXsc/edit";

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:12px;padding:40px 32px;border:1px solid #e5e7eb;">
      <h1 style="margin:0 0 16px;font-size:24px;color:#111827;">Access Your AI SEO Prompts</h1>
      <p style="margin:0 0 16px;font-size:16px;color:#4b5563;line-height:1.6;">
        Hello ${recipientName},
      </p>
      <p style="margin:0 0 16px;font-size:16px;color:#4b5563;line-height:1.6;">
        Thank you for registering on AI Coach Portal.
      </p>
      <p style="margin:0 0 24px;font-size:16px;color:#4b5563;line-height:1.6;">
        You can now access the AI SEO Prompts document using the link below:
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${documentUrl}" target="_blank" style="display:inline-block;background:#84cc16;color:#000000;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
          Get 100+ AI SEO Prompts
        </a>
      </div>
      <p style="margin:24px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
        Stay tuned for more AI learning resources.
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="margin:0;font-size:14px;color:#9ca3af;">
        AI Coach Portal Team
      </p>
    </div>
  </div>
</body>
</html>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "AI Coach Portal <hello@aicoachportal.com>",
        to: [recipientEmail],
        subject: "Access Your AI SEO Prompts",
        html: emailHtml,
      }),
    });

    const resendData = await resendRes.json();

    return new Response(JSON.stringify({ success: true, data: resendData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
