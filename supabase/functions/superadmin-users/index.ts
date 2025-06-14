import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing or invalid authorization header'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.split(' ')[1];

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: `Bearer ${token}` }
        }
      }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: authResp, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authResp?.user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication failed'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const authUser = authResp.user;
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role, is_active')
      .eq('email', authUser.email)
      .single();

    if (userError || !userData || userData.role !== 'superadmin') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Insufficient permissions'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse the URL to support RESTful subpaths for role/status updates
    const url = new URL(req.url);
    const pathname = url.pathname.replace('/functions/v1/superadmin-users', '');
    const pathParts = pathname.split('/').filter(Boolean);

    // /superadmin-users/{id}/role or /superadmin-users/{id}/status
    if (pathParts.length === 2 && (pathParts[1] === 'role' || pathParts[1] === 'status')) {
      const userId = pathParts[0];

      if (req.method === 'PUT') {
        const body = await req.json();

        if (pathParts[1] === 'role') {
          // Update role only
          const { role } = body;
          if (!role) {
            return new Response(JSON.stringify({
              success: false,
              error: 'Missing role field'
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const { data, error } = await supabase
            .from('users')
            .update({ role })
            .eq('id', userId)
            .select()
            .single();

          if (error) {
            return new Response(JSON.stringify({
              success: false,
              error: 'Failed to update user role'
            }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          return new Response(JSON.stringify({
            success: true,
            data
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (pathParts[1] === 'status') {
          // Update is_active status
          const { is_active } = body;
          if (typeof is_active !== 'boolean') {
            return new Response(JSON.stringify({
              success: false,
              error: 'Missing or invalid is_active (must be boolean)'
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const { data, error } = await supabase
            .from('users')
            .update({ is_active })
            .eq('id', userId)
            .select()
            .single();

          if (error) {
            return new Response(JSON.stringify({
              success: false,
              error: 'Failed to update user status'
            }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          return new Response(JSON.stringify({
            success: true,
            data
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: 'Method not allowed'
        }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (req.method === 'GET') {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to fetch users'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        data: users
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'POST') {
      const { name, email, phone, role, password = 'defaultpass123', station_id } = await req.json();

      if (!name || !email || !role) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Missing required fields'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({ name, email, phone, role, password, is_active: true })
        .select()
        .single();

      if (createError) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to create user'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: authUserData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name }
      });

      if (authCreateError) {
        await supabase.from('users').delete().eq('id', newUser.id);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to create authentication user'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (role === 'employee' && station_id) {
        const { error: stationLinkError } = await supabase.from('user_stations').insert({
          user_id: newUser.id,
          station_id: station_id
        });

        if (stationLinkError) {
          await supabase.from('users').delete().eq('id', newUser.id);
          await supabaseAdmin.auth.admin.deleteUser(authUserData.user.id);
          return new Response(JSON.stringify({
            success: false,
            error: 'Failed to assign employee to station'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        data: newUser
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'PUT') {
      const { id, name, email, phone, role, is_active } = await req.json();
      if (!id) {
        return new Response(JSON.stringify({
          success: false,
          error: 'User ID is required'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      const { data: updatedUser, error } = await supabase.from('users').update({
        name, email, phone, role, is_active
      }).eq('id', id).select().single();
      if (error) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to update user'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({
        success: true,
        data: updatedUser
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');
      if (!id) {
        return new Response(JSON.stringify({
          success: false,
          error: 'User ID is required'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to delete user'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({
        success: true,
        message: 'User deleted successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Superadmin users error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
