import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Check if admin already exists
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existing = existingUsers?.users?.find((u: any) => u.email === "admin@aicoachportal.com");
  
  if (existing) {
    // Check if role exists
    const { data: roleData } = await supabaseAdmin.from("user_roles").select("*").eq("user_id", existing.id).single();
    if (!roleData) {
      await supabaseAdmin.from("user_roles").insert({ user_id: existing.id, role: "admin" });
    }
    const { data: profileData } = await supabaseAdmin.from("profiles").select("*").eq("user_id", existing.id).single();
    if (!profileData) {
      await supabaseAdmin.from("profiles").insert({ user_id: existing.id, full_name: "Platform Admin" });
    }
    return new Response(JSON.stringify({ success: true, message: "Admin already exists, ensured role and profile", userId: existing.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Create admin user
  const { data: user, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
    email: "admin@aicoachportal.com",
    password: "Admin@123",
    email_confirm: true,
  });

  if (signUpError) {
    return new Response(JSON.stringify({ error: signUpError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Create profile and role
  await supabaseAdmin.from("profiles").insert({ user_id: user.user.id, full_name: "Platform Admin" });
  await supabaseAdmin.from("user_roles").insert({ user_id: user.user.id, role: "admin" });

  return new Response(JSON.stringify({ success: true, userId: user.user.id }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
