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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Authorization header required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: userData, error: roleError } = await supabase
      .from("users")
      .select("role")
      .eq("email", user.email)
      .single();

    if (roleError || userData?.role !== "superadmin") {
      return new Response(JSON.stringify({ success: false, error: "Superadmin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ----- GET all stations -----
    if (req.method === "GET") {
      const { data, error } = await supabase.from("stations").select("*").order("created_at", { ascending: false });
      if (error) {
        console.error("GET stations error:", error);
        return new Response(JSON.stringify({ success: false, error: "Failed to fetch stations" }), {
          status: 500,
          headers: corsHeaders,
        });
      }
      return new Response(JSON.stringify({ success: true, data }), {
        headers: corsHeaders,
      });
    }

    // ----- POST create station -----
    if (req.method === "POST") {
      const body = await req.json();
      const { name, brand, address, owner_id, current_plan_id } = body;
      if (!name || !brand || !owner_id) {
        return new Response(JSON.stringify({ success: false, error: "Missing required fields" }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      const { data, error } = await supabase
        .from("stations")
        .insert({ name, brand, address, owner_id, current_plan_id, is_active: true })
        .select()
        .single();

      if (error) {
        console.error("POST station error:", error);
        return new Response(JSON.stringify({ success: false, error: "Failed to create station" }), {
          status: 500,
          headers: corsHeaders,
        });
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: corsHeaders,
      });
    }

    // ----- PUT update station -----
    if (req.method === "PUT") {
      const body = await req.json();
      const { id, name, brand, address, owner_id, current_plan_id, is_active } = body;

      if (!id) {
        return new Response(JSON.stringify({ success: false, error: "Station ID required" }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      const { data, error } = await supabase
        .from("stations")
        .update({ name, brand, address, owner_id, current_plan_id, is_active })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("PUT station error:", error);
        return new Response(JSON.stringify({ success: false, error: "Failed to update station" }), {
          status: 500,
          headers: corsHeaders,
        });
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: corsHeaders,
      });
    }

    // ----- DELETE station -----
    if (req.method === "DELETE") {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");

      if (!id) {
        return new Response(JSON.stringify({ success: false, error: "Station ID required" }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      const { error } = await supabase.from("stations").delete().eq("id", id);
      if (error) {
        console.error("DELETE station error:", error);
        return new Response(JSON.stringify({ success: false, error: "Failed to delete station" }), {
          status: 500,
          headers: corsHeaders,
        });
      }

      return new Response(JSON.stringify({ success: true, message: "Station deleted" }), {
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("Stations error:", err);
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
