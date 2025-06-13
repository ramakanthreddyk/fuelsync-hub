// lib/api.ts

const SUPABASE_URL = "https://untzkhbbsowpkmwrxdws.supabase.co";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export class ApiClient {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const supabase = createClientComponentClient();
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      console.log("🔐 Getting session for API request...");

      if (error) {
        console.error("Auth session error:", error);
        throw new Error("Authentication failed");
      }

      if (!session?.access_token) {
        console.error("No valid session found");
        throw new Error("No valid session found");
      }

      return {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      };
    } catch (err) {
      console.error("Error getting auth headers:", err);
      throw err;
    }
  }

  async superadminRequest(endpoint: string, options: RequestInit = {}) {
    try {
      const headers = await this.getAuthHeaders();

      console.log("Making superadmin request to:", endpoint);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...(options.headers || {}),
        },
      });

      console.log("Response status:", response.status);

      const text = await response.text();

      try {
        const result = JSON.parse(text);

        if (!response.ok || result?.success === false) {
          throw new Error(result.error || `API Error: ${response.status}`);
        }

        console.log("API Result success:", result.success);
        return result.data ?? result;
      } catch (parseError) {
        throw new Error(`API Error: ${response.status} - ${text}`);
      }
    } catch (err) {
      console.error("Superadmin request error:", err);
      throw err;
    }
  }

  async confirmUser(email: string) {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/confirm-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to confirm user");
      }

      return result;
    } catch (err) {
      console.error("Error confirming user:", err);
      throw err;
    }
  }
}

export const apiClient = new ApiClient();
