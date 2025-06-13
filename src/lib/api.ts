
import { supabase } from "@/integrations/supabase/client";

export class ApiClient {
  private async getAuthHeaders() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('🔐 Supabase session:', session);
      console.log('🔐 Supabase session error:', error);
      
      if (error) {
        console.error('Auth session error:', error);
        throw new Error('Authentication failed');
      }

      if (!session?.access_token) {
        console.error('No valid session found');
        throw new Error('No valid session found');
      }

      return {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      };
    } catch (error) {
      console.error('Error getting auth headers:', error);
      throw error;
    }
  }

  async superadminRequest(endpoint: string, options: RequestInit = {}) {
    try {
      const headers = await this.getAuthHeaders();
      
      console.log('Making superadmin request to:', endpoint);
      
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

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('API Result:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }

      return result.data;
    } catch (error) {
      console.error('Superadmin request error:', error);
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
