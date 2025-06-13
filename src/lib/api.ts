
import { supabase } from "@/integrations/supabase/client";

export class ApiClient {
  private async getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  async superadminRequest(endpoint: string, options: RequestInit = {}) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `https://untzkhbbsowpkmwrxdws.supabase.co/functions/v1/${endpoint}`,
      {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'API request failed');
    }

    return result.data;
  }
}

export const apiClient = new ApiClient();
