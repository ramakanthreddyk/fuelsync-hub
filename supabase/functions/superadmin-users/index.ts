import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// --- Utility: Superadmin Authorization ---
async function authorizeSuperadmin(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Missing or invalid authorization header', status: 401 };
  }
  const token = authHeader.split(' ')[1];
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data: authResp, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authResp?.user) {
    return { error: 'Authentication failed', status: 401 };
  }
  const authUser = authResp.user;
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('role, is_active')
    .eq('email', authUser.email)
    .single();

  if (userError || !userData || userData.role !== 'superadmin') {
    return { error: 'Insufficient permissions', status: 403 };
  }
  return { supabase, supabaseAdmin, authUser };
}

// --- Utility: Handle station assignment for employee/owner ---
async function handleStationAssignment(supabaseAdmin: any, userId: string, role: string, station_id: any) {
  if (role === 'employee' || role === 'owner') {
    // Remove old assignments
    const { error: deleteError } = await supabaseAdmin
      .from('user_stations')
      .delete()
      .eq('user_id', userId);
    if (deleteError) {
      console.error('[handleStationAssignment] Failed to remove old assignments:', deleteError);
    }
    // Add new assignment if provided
    if (station_id && station_id !== '' && station_id !== 'undefined') {
      const { error: insertError } = await supabaseAdmin
        .from('user_stations')
        .insert({ 
          user_id: userId, 
          station_id: parseInt(station_id.toString(), 10) 
        });
      if (insertError) {
        return { error: `Failed to assign station: ${insertError.message}` };
      }
    }
  }
  return {};
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth and Superadmin check ---
    const authResult = await authorizeSuperadmin(req);
    if (authResult.error) {
      return new Response(JSON.stringify({ success: false, error: authResult.error }), {
        status: authResult.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const { supabase, supabaseAdmin } = authResult;

    // Parse RESTful subpaths
    const url = new URL(req.url);
    const pathname = url.pathname.replace('/functions/v1/superadmin-users', '');
    const pathParts = pathname.split('/').filter(Boolean);

    // --- Put/Edit User ---
    if (pathParts.length === 2 && pathParts[1] === 'edit' && req.method === 'PUT') {
      const userId = pathParts[0];
      let body;
      try { body = await req.json(); } catch {
        return new Response(JSON.stringify({ success: false, error: 'Invalid request body' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      const { name, email, phone, role, is_active, station_id } = body;

      // Build up update fields
      const updateFields: Record<string, any> = {};
      if (name !== undefined) updateFields.name = name;
      if (email !== undefined) updateFields.email = email;
      if (phone !== undefined) updateFields.phone = phone;
      if (role !== undefined) updateFields.role = role;
      if (typeof is_active === 'boolean') updateFields.is_active = is_active;

      // Update user record
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('users')
        .update(updateFields)
        .eq('id', userId)
        .select()
        .single();
      if (updateError) {
        return new Response(JSON.stringify({ success: false, error: `Failed to update user: ${updateError.message}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Only assign station for employee/owner, not superadmin
      const stationResult = await handleStationAssignment(supabaseAdmin, userId, role, station_id);
      if (stationResult.error) {
        return new Response(JSON.stringify({ success: false, error: stationResult.error }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ success: true, data: updated }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // /superadmin-users/{id}/role, /superadmin-users/{id}/status
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

          const { data, error } = await supabaseAdmin
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

          const { data, error } = await supabaseAdmin
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

    // DELETE /superadmin-users/{userId}
    if (pathParts.length === 1 && req.method === 'DELETE') {
      const userId = pathParts[0];
      console.log('Delete user request for userId:', userId);

      // First, get user details
      const { data: userToDelete, error: userFetchError } = await supabaseAdmin
        .from('users')
        .select('id, auth_uid')
        .eq('id', userId)
        .single();

      if (userFetchError || !userToDelete) {
        console.error('User not found:', userFetchError);
        return new Response(JSON.stringify({
          success: false,
          error: 'User not found'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Delete user-station assignments first
      const { error: deleteUserStationsError } = await supabaseAdmin
        .from('user_stations')
        .delete()
        .eq('user_id', userId);

      if (deleteUserStationsError) {
        console.error('Error deleting user-station assignments:', deleteUserStationsError);
      }

      // Delete from users table
      const { error: deleteUserError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId);

      if (deleteUserError) {
        console.error('Error deleting user:', deleteUserError);
        return new Response(JSON.stringify({
          success: false,
          error: `Failed to delete user: ${deleteUserError.message}`
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Try to delete from Auth (optional, may fail if no auth_uid)
      if (userToDelete.auth_uid) {
        const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userToDelete.auth_uid);
        if (deleteAuthError) {
          console.error('Failed to delete from auth, but user deleted from users table:', deleteAuthError);
        }
      }

      console.log('User deleted successfully');
      return new Response(JSON.stringify({
        success: true,
        message: 'User deleted successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'GET') {
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select(`
          *,
          user_stations (
            station_id,
            stations (
              id,
              name
            )
          ),
          stations!stations_owner_id_fkey (
            id,
            name
          )
        `)
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
      const { name, email, phone, role, password = 'defaultpass123', station_id, station_name, brand, address } = await req.json();

      if (!name || !email || !role) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Missing required fields'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // owner/employee assignment
      let newUser, userCreateError, stationCreated = null;
      if (role === 'owner') {
        // create new station for every new owner (always create even for existing)
        if (!station_name || !brand || !address) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Missing station_name, brand, or address for owner creation'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Create owner user
        const { data: user, error: userErr } = await supabaseAdmin
          .from('users')
          .insert({ name, email, phone, role, password, is_active: true })
          .select()
          .single();
        newUser = user;
        userCreateError = userErr;

        if (userCreateError) {
          return new Response(JSON.stringify({ success: false, error: 'Failed to create owner user (users table)' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Add Auth User for new owner (if not already exists)
        const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name }
        });

        if (authErr) {
          // Cleanup users row
          await supabaseAdmin.from('users').delete().eq('id', newUser.id);
          return new Response(JSON.stringify({ success: false, error: 'Failed to create authentication user' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Now create a new station for this owner
        const { data: newStation, error: stationErr } = await supabaseAdmin
          .from('stations')
          .insert({
            name: station_name,
            brand: brand,
            address: address,
            owner_id: newUser.id,
            is_active: true
          })
          .select()
          .single();

        if (stationErr) {
          await supabaseAdmin.from('users').delete().eq('id', newUser.id);
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          return new Response(JSON.stringify({
            success: false,
            error: 'Failed to create station for owner'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        stationCreated = newStation;

        return new Response(JSON.stringify({
          success: true,
          data: { owner: newUser, station: stationCreated }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else if (role === 'employee') {
        // Must assign to existing station
        if (!station_id) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Missing station_id for employee creation'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { data: user, error: userErr } = await supabaseAdmin
          .from('users')
          .insert({ name, email, phone, role, password, is_active: true })
          .select()
          .single();
        newUser = user;
        userCreateError = userErr;

        if (userCreateError) {
          return new Response(JSON.stringify({ success: false, error: 'Failed to create employee user (users table)' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Create Auth user for employee
        const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name }
        });

        if (authErr) {
          await supabaseAdmin.from('users').delete().eq('id', newUser.id);
          return new Response(JSON.stringify({ success: false, error: 'Failed to create authentication user' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Create user_stations link
        const { error: userStationErr } = await supabaseAdmin
          .from('user_stations')
          .insert({ user_id: newUser.id, station_id: station_id });

        if (userStationErr) {
          await supabaseAdmin.from('users').delete().eq('id', newUser.id);
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          return new Response(JSON.stringify({ success: false, error: 'Failed to assign employee to station' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({
          success: true,
          data: newUser
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } else {
        // For superadmin or other roles: old flow
        const { data: user, error: userErr } = await supabaseAdmin
          .from('users')
          .insert({ name, email, phone, role, password, is_active: true })
          .select()
          .single();
        newUser = user;
        userCreateError = userErr;

        if (userCreateError) {
          return new Response(JSON.stringify({ success: false, error: 'Failed to create user (users table)' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name }
        });

        if (authErr) {
          await supabaseAdmin.from('users').delete().eq('id', newUser.id);
          return new Response(JSON.stringify({ success: false, error: 'Failed to create authentication user' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({
          success: true,
          data: newUser
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
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
