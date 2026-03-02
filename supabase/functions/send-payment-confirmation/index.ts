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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate JWT token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { enrollmentId } = await req.json();
    if (!enrollmentId) {
      return new Response(JSON.stringify({ error: "enrollmentId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch enrollment details with course title
    const { data: enrollment, error: fetchError } = await supabase
      .from("enrollments")
      .select("*, courses(title, coach_id)")
      .eq("id", enrollmentId)
      .single();

    if (fetchError || !enrollment) {
      return new Response(JSON.stringify({ error: "Enrollment not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user is the coach or admin for this enrollment
    const isCoach = enrollment.coach_id === user.id;
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    const isAdmin = roles?.role === "admin";

    if (!isCoach && !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch coach profile to get coach name and email
    const coachId = enrollment.coach_id;
    const { data: coachProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", coachId)
      .single();

    const coachName = coachProfile?.full_name || "Your Coach";
    const coachEmail = coachProfile?.email || "noreply@allcoachhub.lovable.app";
    const courseTitle = (enrollment.courses as any)?.title || "your course";
    const learnerName = enrollment.full_name || "Learner";
    const learnerEmail = enrollment.email;

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #1a1a1a; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; color: #ffffff;">🎉 Thank You for Your Payment!</h1>
        </div>
        <div style="padding: 32px;">
          <p style="font-size: 18px; margin-bottom: 8px; color: #1a1a1a;">Hi <strong>${learnerName}</strong>,</p>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
            Thank you for your payment! We will send you all the details soon.
          </p>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #6366f1;">
            <p style="margin: 0; color: #4f46e5; font-size: 16px; font-weight: 600;">
              🎓 Thank you for choosing the course: ${courseTitle}
            </p>
            <p style="margin: 8px 0 0; color: #6b7280; font-size: 14px;">
              We truly appreciate your trust in us. Your learning journey is about to begin!
            </p>
          </div>
          <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
            Your course materials will be shared with you shortly. Stay tuned!
          </p>
          <div style="text-align: center; margin-top: 28px;">
            <a href="https://allcoachhub.lovable.app/learner/courses" 
               style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
              Go to My Courses →
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 13px; margin-top: 32px; text-align: center;">
            Warm regards,<br/>
            <strong>${coachName}</strong><br/>
            AI Coach Portal
          </p>
        </div>
      </div>
    `;

    // Send email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${coachName} <${coachEmail}>`,
        to: [learnerEmail],
        subject: `Thank you for your payment – ${courseTitle}`,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API error:", resendData);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: resendData }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Payment confirmation email sent to ${learnerEmail} from ${coachEmail}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Payment confirmation sent to ${learnerEmail}`,
        email: learnerEmail,
        courseName: courseTitle,
        learnerName,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
