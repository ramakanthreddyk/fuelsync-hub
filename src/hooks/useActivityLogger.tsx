
import { useAuth } from "./useAuth";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * useActivityLogger - Hook to log user activity to Supabase
 * @returns logActivity: (activityType: string, details?: Record<string, any>) => Promise<void>
 */
export function useActivityLogger() {
  const { user } = useAuth();

  /**
   * Logs a user activity event to Supabase (user_activity_log table).
   * @param activityType - The type of activity, e.g. 'dashboard_view'
   * @param details - (Optional) Extra details as a JSON object. Device, browser, page params, etc.
   * @param stationId - (Optional) For station accounts, log against the station (defaults to user's first station)
   */
  const logActivity = useCallback(
    async (
      activityType: string,
      details?: Record<string, any>,
      stationId?: number
    ) => {
      try {
        if (!user) return;
        // Try to find a station context
        let station_id = stationId;
        if (!station_id && user.stations && user.stations.length > 0) {
          station_id = user.stations[0]?.id;
        }
        const { error } = await supabase.from("user_activity_log").insert([
          {
            user_id: user.id,
            activity_type: activityType,
            station_id: station_id ?? null,
            details: details ? JSON.stringify(details) : null,
          },
        ]);
        if (error) {
          // You may want to warn here iff desired for debugging
          // console.warn("Failed to log activity:", error.message);
        }
      } catch (e) {
        // You may want to warn here iff desired for debugging
        // console.warn("Error logging activity:", e);
      }
    },
    [user]
  );

  return logActivity;
}

