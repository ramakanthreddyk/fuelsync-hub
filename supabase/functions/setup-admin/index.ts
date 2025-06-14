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
      console.error("[setup-admin] Missing env vars", { serviceRoleKey, supabaseUrl });
      return new Response(JSON.stringify({ success: false, error: "Missing environment variables" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Admin details
    const adminEmail = "admin@fuelsync.com";
    const adminPassword = "admin123";

    // Step 1: Check for admin in public.users
    const { data: existingUser, error: userCheckErr } = await supabase
      .from("users")
      .select("id, auth_uid")
      .eq("email", adminEmail)
      .maybeSingle();

    console.log("[setup-admin] existingUser in public.users:", existingUser, "error:", userCheckErr);

    // Check for admin in auth.users if auth_uid exists
    let authUserExists = false;
    let authUserId: string | undefined = undefined;
    if (existingUser?.auth_uid) {
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(existingUser.auth_uid);
        authUserExists = !!authUser?.user;
        authUserId = authUser?.user?.id;
        console.log("[setup-admin] existingUser has auth_uid, authUserExists:", authUserExists, "authUserId:", authUserId);
      } catch (error) {
        console.warn("[setup-admin] Could not find user in Auth for existing public user:", error);
      }
    }

    if (authUserExists && existingUser) {
      console.log("[setup-admin] Admin exists in both places.");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Admin user already exists in both auth and public tables",
        email: adminEmail 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let publicUserId: string | undefined = existingUser?.id;

    // Step 2: Create admin in public.users if missing
    if (!existingUser) {
      const { data: newUser, error: userError } = await supabase
        .rpc('create_admin_user', {
          user_email: adminEmail,
          user_name: "Super Admin"
        });

      console.log("[setup-admin] create_admin_user RPC newUser:", newUser, "error:", userError);

      if (userError) {
        return new Response(JSON.stringify({ success: false, error: "Database error creating new user (public)" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      publicUserId = newUser[0]?.id;
    }

    // Step 3: Create admin in auth.users if missing
    if (!authUserExists) {
      // Compose payload WITHOUT email_confirm
      const payload = {
        email: adminEmail,
        password: adminPassword,
        user_metadata: {
          name: "Super Admin"
        },
        app_metadata: {
          role: "superadmin"
        }
      };
      console.log("[setup-admin] About to call supabase.auth.admin.createUser with payload:", JSON.stringify(payload));

      let createUserErrorMessage: string | undefined = undefined;
      let createdAuthUserId: string | undefined = undefined;

      try {
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser(payload);

        console.log("[setup-admin] Result from supabase.auth.admin.createUser:", authUser, "Error:", authError);

        if (authError) {
          createUserErrorMessage = authError.message;
        }
        if (authUser?.user?.id) {
          createdAuthUserId = authUser.user.id;
          authUserId = createdAuthUserId;
        }
      } catch (err) {
        createUserErrorMessage = "[EXCEPTION] " + (err?.message || err);
        console.error("[setup-admin] EXCEPTION calling createUser:", err);
      }

      // If failed: Try to find the user if it's a duplicate
      if (createUserErrorMessage) {
        if (createUserErrorMessage.includes("already registered")) {
          try {
            const { data: usersList, error: listErr } = await supabase.auth.admin.listUsers();
            const existingAuthUser = usersList?.users?.find(u => u.email === adminEmail);
            console.log("[setup-admin] Found existing auth user in listUsers", existingAuthUser);
            if (existingAuthUser?.id) {
              authUserId = existingAuthUser.id;
            }
          } catch (err) {
            console.error("[setup-admin] Error running listUsers after duplicate:", err);
          }
        }
        if (!authUserId) {
          return new Response(JSON.stringify({ 
            success: false,
            error: `Failed to create auth user: ${createUserErrorMessage}`
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      }
      // If we have both publicUserId and authUserId, update linking field
      if (publicUserId && authUserId) {
        const { error: updateErr } = await supabase
          .from("users")
          .update({ auth_uid: authUserId })
          .eq("id", publicUserId);

        console.log("[setup-admin] Updated public.users with auth_uid:", updateErr);
      }
    }

    // Return results
    return new Response(JSON.stringify({ 
      success: true,
      message: "Admin user setup completed successfully",
      email: adminEmail,
      password: adminPassword,
      publicUserId,
      authUserId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    // General exception handling
    console.error("[setup-admin] Unexpected setup admin error:", err);
    return new Response(JSON.stringify({ success: false, error: `[UNEXPECTED ERROR]: ${err?.message || err}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
