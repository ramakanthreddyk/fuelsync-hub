
/**
 * Utility: Handle station assignment for employee/owner
 * Only applies station assignment/removal for employee or owner roles.
 */
export async function handleStationAssignment(supabaseAdmin: any, userId: string, role: string, station_id: any) {
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
