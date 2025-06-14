
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

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Only POST allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    if (!serviceRoleKey || !supabaseUrl) {
      return new Response(JSON.stringify({ success: false, error: "Missing environment variables" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Create admin user
    const adminEmail = "admin@fuelsync.com";
    
    // Check if admin already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", adminEmail)
      .maybeSingle();

    if (existingUser) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Admin user already exists",
        email: adminEmail 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create in public.users with proper enum casting
    const { data: newUser, error: userError } = await supabase
      .rpc('create_admin_user', {
        user_email: adminEmail,
        user_name: "Super Admin"
      });

    if (userError) {
      console.error("Error creating admin user:", userError);
      return new Response(JSON.stringify({ success: false, error: "Database error creating new user" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: "admin123",
      email_confirm: true,
      user_metadata: {
        name: "Super Admin",
        role: "superadmin"
      }
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      return new Response(JSON.stringify({ success: false, error: "Failed to create auth user" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update with auth_uid
    const { error: updateError } = await supabase
      .from("users")
      .update({ auth_uid: authUser.user.id })
      .eq("email", adminEmail);

    if (updateError) {
      console.error("Error updating auth_uid:", updateError);
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: "Admin user created successfully",
      email: adminEmail,
      password: "admin123"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Setup admin error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
