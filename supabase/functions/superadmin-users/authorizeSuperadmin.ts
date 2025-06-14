
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/**
 * Utility: Superadmin Authorization
 * Verifies user token, checks for role=superadmin in users table, and passes back SDK instances.
 */
export async function authorizeSuperadmin(req: Request) {
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
