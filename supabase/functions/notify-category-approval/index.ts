import { corsHeaders } from '@supabase/supabase-js/cors';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { coach_name, coach_email, category_name, course_titles } = await req.json();

    if (!coach_email || !category_name) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const courseList = (course_titles || []).length > 0
      ? `<p style="margin:16px 0;font-size:14px;color:#374151;">Your saved course(s) are now ready to be completed and published:</p>
         <ul style="margin:8px 0;padding-left:20px;">${(course_titles as string[]).map((t: string) => `<li style="font-size:14px;color:#374151;margin-bottom:4px;">${t}</li>`).join("")}</ul>`
      : "";

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family:Arial,sans-serif;background:#f9fafb;padding:40px 0;">
        <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <h1 style="font-size:22px;color:#111827;margin:0 0 8px;">Your Course Category is Approved 🎉</h1>
          <p style="font-size:14px;color:#6b7280;margin:0 0 24px;">Great news, ${coach_name || "Coach"}!</p>
          
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:20px;">
            <p style="font-size:14px;color:#166534;margin:0;font-weight:600;">
              ✅ Category "${category_name}" has been approved for you.
            </p>
          </div>

          ${courseList}

          <p style="font-size:14px;color:#374151;margin:16px 0;">
            Your course is saved as a draft. Complete any final details and publish it to make it live for learners.
          </p>

          <div style="text-align:center;margin:32px 0;">
            <a href="https://www.aicoachportal.com/coach/courses?utm_source=email&utm_medium=notification&utm_campaign=category_approval" 
               style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:14px;">
              Complete & Publish Course →
            </a>
          </div>

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
          <p style="font-size:12px;color:#9ca3af;text-align:center;margin:0;">
            AI Coach Portal · <a href="https://www.aicoachportal.com" style="color:#6366f1;">www.aicoachportal.com</a>
          </p>
        </div>
      </body>
      </html>
    `;

    if (RESEND_API_KEY) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "AI Coach Portal <hello@notify.www.aicoachportal.com>",
          to: [coach_email],
          subject: "Your Course Category is Approved 🎉",
          html,
        }),
      });

      const emailData = await emailRes.json();
      console.log("Email sent:", emailData);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
