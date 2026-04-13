import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch pending jobs that are due
    const { data: jobs, error: fetchError } = await supabase
      .from("funnel_jobs")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at")
      .limit(20);

    if (fetchError || !jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let processed = 0;
    let skipped = 0;

    for (const job of jobs) {
      // Mark as processing
      await supabase.from("funnel_jobs").update({ status: "processing" }).eq("id", job.id);

      // Check if lead has registered (stop funnel)
      const { data: lead } = await supabase
        .from("landing_page_leads")
        .select("lead_status, name, email")
        .eq("id", job.lead_id)
        .single();

      if (!lead || lead.lead_status === "registered") {
        await supabase.from("funnel_jobs").update({ status: "skipped", processed_at: new Date().toISOString() }).eq("id", job.id);
        if (lead?.lead_status === "registered") {
          await supabase.from("funnel_events").insert({
            lead_id: job.lead_id, landing_page_id: job.landing_page_id,
            event_type: "funnel_stopped", metadata: { reason: "lead_registered", job_type: job.job_type },
          });
        }
        skipped++;
        continue;
      }

      // Get funnel config for template content
      const { data: config } = await supabase
        .from("funnel_config")
        .select("*")
        .eq("landing_page_id", job.landing_page_id)
        .single();

      if (!config) {
        await supabase.from("funnel_jobs").update({ status: "failed", error_message: "No funnel config", processed_at: new Date().toISOString() }).eq("id", job.id);
        continue;
      }

      // Get landing page for link generation
      const { data: lp } = await supabase
        .from("landing_pages")
        .select("slug, category")
        .eq("id", job.landing_page_id)
        .single();

      const link = `https://www.aicoachportal.com/lp/${lp?.slug || ""}`;
      const replaceTpl = (text: string) => text
        .replace(/\{\{name\}\}/g, lead.name || "Coach")
        .replace(/\{\{link\}\}/g, link)
        .replace(/\{\{category\}\}/g, lp?.category || "");

      try {
        if (job.job_type.endsWith("_email")) {
          // Determine which template to use
          let subject = "", body = "";
          switch (job.job_type) {
            case "welcome_email":
              subject = config.welcome_email_subject;
              body = config.welcome_email_body;
              break;
            case "day1_email":
              subject = config.day1_email_subject;
              body = config.day1_email_body;
              break;
            case "day2_email":
              subject = config.day2_email_subject;
              body = config.day2_email_body;
              break;
            case "day3_email":
              subject = config.day3_email_subject;
              body = config.day3_email_body;
              break;
          }

          subject = replaceTpl(subject);
          body = replaceTpl(body);

          // Send email via Resend
          if (resendKey && lead.email) {
            const emailRes = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
              body: JSON.stringify({
                from: "AI Coach Portal <noreply@notify.www.aicoachportal.com>",
                to: [lead.email],
                subject,
                html: `
                  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                    <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:30px;border-radius:12px;color:#fff;">
                      <h1 style="color:#84cc16;margin-bottom:10px;">${subject}</h1>
                      <div style="color:#e0e0e0;line-height:1.6;white-space:pre-line;">${body}</div>
                      <a href="${link}" style="display:inline-block;margin-top:20px;background:#84cc16;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Join Now →</a>
                    </div>
                    <p style="text-align:center;color:#888;font-size:12px;margin-top:15px;">AI Coach Portal | You received this because you signed up on our platform</p>
                  </div>
                `,
              }),
            });

            const emailResult = await emailRes.json();
            
            // Log email
            await supabase.from("funnel_email_logs").insert({
              lead_id: job.lead_id, email_type: job.job_type,
              subject, recipient_email: lead.email,
              status: emailRes.ok ? "sent" : "failed",
              error_message: emailRes.ok ? null : JSON.stringify(emailResult),
            });

            if (!emailRes.ok) throw new Error(`Email send failed: ${JSON.stringify(emailResult)}`);
          }

          // Log event
          await supabase.from("funnel_events").insert({
            lead_id: job.lead_id, landing_page_id: job.landing_page_id,
            event_type: `${job.job_type}_sent`, metadata: { subject },
          });

          await supabase.from("funnel_jobs").update({ status: "sent", processed_at: new Date().toISOString() }).eq("id", job.id);
          processed++;

        } else if (job.job_type === "welcome_whatsapp") {
          // WhatsApp placeholder - log as skipped until Twilio is configured
          await supabase.from("funnel_events").insert({
            lead_id: job.lead_id, landing_page_id: job.landing_page_id,
            event_type: "whatsapp_skipped", metadata: { reason: "twilio_not_configured" },
          });
          await supabase.from("funnel_jobs").update({ status: "skipped", processed_at: new Date().toISOString(), error_message: "WhatsApp not configured" }).eq("id", job.id);
          skipped++;
        }
      } catch (err) {
        console.error(`Job ${job.id} failed:`, err);
        const retryCount = (job.retry_count || 0) + 1;
        if (retryCount >= (job.max_retries || 3)) {
          await supabase.from("funnel_jobs").update({ status: "failed", processed_at: new Date().toISOString(), error_message: String(err), retry_count: retryCount }).eq("id", job.id);
        } else {
          // Retry with 5 min delay
          const retryAt = new Date(Date.now() + 300000);
          await supabase.from("funnel_jobs").update({ status: "pending", scheduled_at: retryAt.toISOString(), retry_count: retryCount, error_message: String(err) }).eq("id", job.id);
        }
      }
    }

    return new Response(JSON.stringify({ processed, skipped, total: jobs.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Funnel processor error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
