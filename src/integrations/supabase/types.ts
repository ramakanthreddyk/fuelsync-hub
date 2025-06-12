export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      daily_closure: {
        Row: {
          closed_at: string | null
          closed_by: number | null
          date: string
          difference: number | null
          sales_total: number | null
          station_id: number
          tender_total: number | null
        }
        Insert: {
          closed_at?: string | null
          closed_by?: number | null
          date: string
          difference?: number | null
          sales_total?: number | null
          station_id: number
          tender_total?: number | null
        }
        Update: {
          closed_at?: string | null
          closed_by?: number | null
          date?: string
          difference?: number | null
          sales_total?: number | null
          station_id?: number
          tender_total?: number | null
        }
        Relationships: []
      }
      event_log: {
        Row: {
          event_type: string
          id: number
          occurred_at: string | null
          payload: Json | null
          station_id: number | null
          user_id: number | null
        }
        Insert: {
          event_type: string
          id?: number
          occurred_at?: string | null
          payload?: Json | null
          station_id?: number | null
          user_id?: number | null
        }
        Update: {
          event_type?: string
          id?: number
          occurred_at?: string | null
          payload?: Json | null
          station_id?: number | null
          user_id?: number | null
        }
        Relationships: []
      }
      fuel_prices: {
        Row: {
          created_at: string | null
          created_by: number | null
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id: number
          price_per_litre: number
          station_id: number | null
          valid_from: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: number | null
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id?: number
          price_per_litre: number
          station_id?: number | null
          valid_from?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: number | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          id?: number
          price_per_litre?: number
          station_id?: number | null
          valid_from?: string | null
        }
        Relationships: []
      }
      nozzles: {
        Row: {
          created_at: string | null
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id: number
          is_active: boolean | null
          nozzle_number: number
          pump_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id?: number
          is_active?: boolean | null
          nozzle_number: number
          pump_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          id?: number
          is_active?: boolean | null
          nozzle_number?: number
          pump_id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      ocr_readings: {
        Row: {
          created_at: string | null
          created_by: number | null
          cumulative_vol: number
          id: number
          image_url: string | null
          nozzle_id: number
          reading_date: string
          reading_time: string
          source: Database["public"]["Enums"]["reading_source"]
          station_id: number
        }
        Insert: {
          created_at?: string | null
          created_by?: number | null
          cumulative_vol: number
          id?: number
          image_url?: string | null
          nozzle_id: number
          reading_date: string
          reading_time: string
          source: Database["public"]["Enums"]["reading_source"]
          station_id: number
        }
        Update: {
          created_at?: string | null
          created_by?: number | null
          cumulative_vol?: number
          id?: number
          image_url?: string | null
          nozzle_id?: number
          reading_date?: string
          reading_time?: string
          source?: Database["public"]["Enums"]["reading_source"]
          station_id?: number
        }
        Relationships: []
      }
      plan_usage: {
        Row: {
          employees_count: number | null
          month: string
          nozzles_used: number | null
          ocr_count: number | null
          pumps_used: number | null
          station_id: number
        }
        Insert: {
          employees_count?: number | null
          month: string
          nozzles_used?: number | null
          ocr_count?: number | null
          pumps_used?: number | null
          station_id: number
        }
        Update: {
          employees_count?: number | null
          month?: string
          nozzles_used?: number | null
          ocr_count?: number | null
          pumps_used?: number | null
          station_id?: number
        }
        Relationships: []
      }
      plans: {
        Row: {
          allow_manual_entry: boolean | null
          created_at: string | null
          edit_fuel_type: boolean | null
          export_reports: boolean | null
          features: Json | null
          id: number
          is_active: boolean | null
          max_employees: number | null
          max_nozzles: number | null
          max_ocr_monthly: number | null
          max_pumps: number | null
          name: string
          price_monthly: number | null
        }
        Insert: {
          allow_manual_entry?: boolean | null
          created_at?: string | null
          edit_fuel_type?: boolean | null
          export_reports?: boolean | null
          features?: Json | null
          id?: number
          is_active?: boolean | null
          max_employees?: number | null
          max_nozzles?: number | null
          max_ocr_monthly?: number | null
          max_pumps?: number | null
          name: string
          price_monthly?: number | null
        }
        Update: {
          allow_manual_entry?: boolean | null
          created_at?: string | null
          edit_fuel_type?: boolean | null
          export_reports?: boolean | null
          features?: Json | null
          id?: number
          is_active?: boolean | null
          max_employees?: number | null
          max_nozzles?: number | null
          max_ocr_monthly?: number | null
          max_pumps?: number | null
          name?: string
          price_monthly?: number | null
        }
        Relationships: []
      }
      pumps: {
        Row: {
          created_at: string | null
          id: number
          is_active: boolean | null
          name: string | null
          pump_sno: string
          station_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          name?: string | null
          pump_sno: string
          station_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          name?: string | null
          pump_sno?: string
          station_id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          created_at: string | null
          delta_volume_l: number | null
          id: number
          nozzle_id: number | null
          price_per_litre: number | null
          reading_id: number | null
          station_id: number | null
          total_amount: number | null
        }
        Insert: {
          created_at?: string | null
          delta_volume_l?: number | null
          id?: number
          nozzle_id?: number | null
          price_per_litre?: number | null
          reading_id?: number | null
          station_id?: number | null
          total_amount?: number | null
        }
        Update: {
          created_at?: string | null
          delta_volume_l?: number | null
          id?: number
          nozzle_id?: number | null
          price_per_litre?: number | null
          reading_id?: number | null
          station_id?: number | null
          total_amount?: number | null
        }
        Relationships: []
      }
      stations: {
        Row: {
          address: string | null
          brand: Database["public"]["Enums"]["brand"]
          created_at: string | null
          current_plan_id: number | null
          id: number
          name: string
          owner_id: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          brand: Database["public"]["Enums"]["brand"]
          created_at?: string | null
          current_plan_id?: number | null
          id?: number
          name: string
          owner_id?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          brand?: Database["public"]["Enums"]["brand"]
          created_at?: string | null
          current_plan_id?: number | null
          id?: number
          name?: string
          owner_id?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tender_entries: {
        Row: {
          amount: number | null
          created_at: string | null
          entry_date: string
          id: number
          payer: string | null
          station_id: number | null
          type: Database["public"]["Enums"]["tender_type"] | null
          user_id: number | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          entry_date: string
          id?: number
          payer?: string | null
          station_id?: number | null
          type?: Database["public"]["Enums"]["tender_type"] | null
          user_id?: number | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          entry_date?: string
          id?: number
          payer?: string | null
          station_id?: number | null
          type?: Database["public"]["Enums"]["tender_type"] | null
          user_id?: number | null
        }
        Relationships: []
      }
      user_stations: {
        Row: {
          created_at: string | null
          station_id: number
          user_id: number
        }
        Insert: {
          created_at?: string | null
          station_id: number
          user_id: number
        }
        Update: {
          created_at?: string | null
          station_id?: number
          user_id?: number
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: number
          is_active: boolean | null
          name: string | null
          password: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: number
          is_active?: boolean | null
          name?: string | null
          password: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: number
          is_active?: boolean | null
          name?: string | null
          password?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_ocr_usage: {
        Args: {
          p_month: string
          p_station_id: number
        }
        Returns: undefined
      }
    }
    Enums: {
      brand: "IOCL" | "BPCL" | "HPCL"
      fuel_type: "PETROL" | "DIESEL" | "CNG"
      reading_source: "ocr" | "manual"
      tender_type: "cash" | "card" | "upi" | "credit"
      user_role: "superadmin" | "owner" | "employee"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never
