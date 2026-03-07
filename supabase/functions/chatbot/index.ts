import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch website knowledge from DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [coursesRes, coachesRes, blogsRes, webinarsRes] = await Promise.all([
      supabase.from("courses").select("title, category, description, level, language, price_inr, price_usd, duration_hours").eq("is_published", true).eq("approval_status", "approved").limit(50),
      supabase.from("coach_profiles_public").select("full_name, category, bio, experience, country, certifications").limit(50),
      supabase.from("ai_blogs").select("title, excerpt, category").eq("is_published", true).limit(30),
      supabase.from("webinars").select("title, description, webinar_date, webinar_time, duration_minutes").eq("is_published", true).limit(20),
    ]);

    const knowledgeBase = `
## AI Coach Portal Knowledge Base

### Available Courses (${coursesRes.data?.length || 0}):
${coursesRes.data?.map(c => `- ${c.title} (${c.category}, ${c.level}) - ₹${c.price_inr} / $${c.price_usd} - ${c.duration_hours}h - ${c.description?.slice(0, 100) || ''}`).join('\n') || 'No courses available'}

### Our Coaches (${coachesRes.data?.length || 0}):
${coachesRes.data?.map(c => `- ${c.full_name} - ${c.category || 'AI'} expert from ${c.country || 'India'}. ${c.bio?.slice(0, 80) || ''}`).join('\n') || 'No coaches listed'}

### Blog Articles (${blogsRes.data?.length || 0}):
${blogsRes.data?.map(b => `- ${b.title} (${b.category}): ${b.excerpt?.slice(0, 80)}`).join('\n') || 'No blogs'}

### Upcoming Webinars (${webinarsRes.data?.length || 0}):
${webinarsRes.data?.map(w => `- ${w.title} on ${w.webinar_date} at ${w.webinar_time} (${w.duration_minutes}min) - ${w.description?.slice(0, 80) || ''}`).join('\n') || 'No upcoming webinars'}
`;

    const systemPrompt = `You are the AI Coach Portal assistant. You help visitors learn about AI courses, coaches, webinars, and blogs on the platform.

${knowledgeBase}

Guidelines:
- Be friendly, concise, and helpful
- Recommend relevant courses, coaches, or webinars based on user interests
- If asked about pricing, mention both INR and USD prices
- Encourage users to enroll in courses or register for webinars
- If the user asks for a contact number, wants to discuss something, or needs personal assistance, provide this WhatsApp number: +91 9852411280. Mention that they can directly send a message on WhatsApp to this number.
- If you don't know something specific, say so and suggest contacting us on WhatsApp at +91 9852411280
- Keep responses under 150 words`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chatbot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
