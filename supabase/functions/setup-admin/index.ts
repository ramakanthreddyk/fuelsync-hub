
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
    const adminPassword = "admin123";
    
    // Check if admin already exists in auth
    const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
    const authUserExists = existingAuthUser?.users?.some(user => user.email === adminEmail);

    // Check if admin already exists in public.users
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", adminEmail)
      .maybeSingle();

    if (authUserExists && existingUser) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Admin user already exists in both auth and public tables",
        email: adminEmail 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let publicUserId = existingUser?.id;
    let authUserId;

    // Create in public.users if it doesn't exist
    if (!existingUser) {
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

      publicUserId = newUser[0]?.id;
    }

    // Create in auth.users if it doesn't exist
    if (!authUserExists) {
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          name: "Super Admin",
          role: "superadmin"
        }
      });

      if (authError) {
        console.error("Error creating auth user:", authError);
        return new Response(JSON.stringify({ success: false, error: `Failed to create auth user: ${authError.message}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      authUserId = authUser.user.id;

      // Update public.users with auth_uid if we have both IDs
      if (publicUserId && authUserId) {
        const { error: updateError } = await supabase
          .from("users")
          .update({ auth_uid: authUserId })
          .eq("id", publicUserId);

        if (updateError) {
          console.error("Error updating auth_uid:", updateError);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: "Admin user created successfully",
      email: adminEmail,
      password: adminPassword,
      publicUserId,
      authUserId
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
