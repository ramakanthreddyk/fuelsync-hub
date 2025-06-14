
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    if (!serviceRoleKey || !supabaseUrl) {
      return new Response(JSON.stringify({ success: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL in env" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "Missing or invalid Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!authHeader.includes(serviceRoleKey)) {
      return new Response(JSON.stringify({ success: false, error: "Not authorized. This endpoint requires your Supabase service_role key." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ success: false, error: "Only POST allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { email, name, phone, role = "employee", is_active = true } = body;

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ success: false, error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check for existing user in public.users
    const { data: existing, error: readError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ success: false, error: "User already exists" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Create user in public.users table
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert([{ email, name, phone, role, is_active }])
      .select()
      .single();

    if (userError) {
      return new Response(JSON.stringify({ success: false, error: userError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Create corresponding auth user
    const defaultPassword = role === 'superadmin' ? 'admin123' : 
                           role === 'owner' ? 'owner123' : 'emp123';

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: {
        name: name || email.split('@')[0],
        phone: phone || null,
        role: role
      }
    });

    if (authError) {
      // If auth user creation fails, clean up the public.users entry
      await supabase.from("users").delete().eq("id", newUser.id);
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Failed to create auth user: ${authError.message}` 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 3: Update the public.users record with the auth_uid
    const { error: updateError } = await supabase
      .from("users")
      .update({ auth_uid: authUser.user.id })
      .eq("id", newUser.id);

    if (updateError) {
      console.warn("Failed to update auth_uid, but user created successfully:", updateError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      user: newUser,
      auth_user: authUser.user,
      default_password: defaultPassword,
      message: "User created successfully in both public.users and auth.users"
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
