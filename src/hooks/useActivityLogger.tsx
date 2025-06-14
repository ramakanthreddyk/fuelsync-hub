
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
      if (!user?.id) return;
      // Use provided stationId or user's first (if available)
      let station_id = stationId;
      if (!station_id && user.stations && user.stations.length > 0) {
        station_id = user.stations[0]?.id;
      }
      // Insert new row in user_activity_log using correct types
      const { error } = await supabase.from("user_activity_log").insert({
        user_id: user.id, // uuid string
        station_id: station_id ?? null,
        activity_type: activityType,
        details: details ?? null,
      });
      if (error) {
        // For debug, warn in dev
        // console.warn("Failed to log activity:", error.message);
      }
    },
    [user]
  );

  return logActivity;
}
