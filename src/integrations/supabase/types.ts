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
        Relationships: [
          {
            foreignKeyName: "daily_closure_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_closure_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_prices: {
        Row: {
          created_at: string | null
          created_by: number | null
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id: number
          price_per_litre: number
          station_id: number | null
          valid_from: string
        }
        Insert: {
          created_at?: string | null
          created_by?: number | null
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id?: number
          price_per_litre: number
          station_id?: number | null
          valid_from: string
        }
        Update: {
          created_at?: string | null
          created_by?: number | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          id?: number
          price_per_litre?: number
          station_id?: number | null
          valid_from?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_prices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_prices_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "nozzles_pump_id_fkey"
            columns: ["pump_id"]
            isOneToOne: false
            referencedRelation: "pumps"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "ocr_readings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocr_readings_nozzle_id_fkey"
            columns: ["nozzle_id"]
            isOneToOne: false
            referencedRelation: "nozzles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocr_readings_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "plan_usage_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "pumps_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "sales_nozzle_id_fkey"
            columns: ["nozzle_id"]
            isOneToOne: false
            referencedRelation: "nozzles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_reading_id_fkey"
            columns: ["reading_id"]
            isOneToOne: false
            referencedRelation: "ocr_readings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      station_plans: {
        Row: {
          effective_from: string
          effective_to: string | null
          is_paid: boolean | null
          plan_id: number | null
          station_id: number
        }
        Insert: {
          effective_from: string
          effective_to?: string | null
          is_paid?: boolean | null
          plan_id?: number | null
          station_id: number
        }
        Update: {
          effective_from?: string
          effective_to?: string | null
          is_paid?: boolean | null
          plan_id?: number | null
          station_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "station_plans_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "station_plans_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      stations: {
        Row: {
          address: string | null
          brand: Database["public"]["Enums"]["station_brand"]
          created_at: string | null
          current_plan_id: number | null
          id: number
          name: string
          owner_id: number
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          brand: Database["public"]["Enums"]["station_brand"]
          created_at?: string | null
          current_plan_id?: number | null
          id?: number
          name: string
          owner_id: number
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          brand?: Database["public"]["Enums"]["station_brand"]
          created_at?: string | null
          current_plan_id?: number | null
          id?: number
          name?: string
          owner_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stations_current_plan_id_fkey"
            columns: ["current_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "tender_entries_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
          station_id: number | null
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
          role: Database["public"]["Enums"]["user_role"]
          station_id?: number | null
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
          station_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_users_station"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      fuel_type: "PETROL" | "DIESEL" | "CNG" | "EV"
      reading_source: "ocr" | "manual"
      station_brand: "IOCL" | "BPCL" | "HPCL"
      tender_type: "cash" | "card" | "upi" | "credit"
      user_role: "superadmin" | "owner" | "employee"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      fuel_type: ["PETROL", "DIESEL", "CNG", "EV"],
      reading_source: ["ocr", "manual"],
      station_brand: ["IOCL", "BPCL", "HPCL"],
      tender_type: ["cash", "card", "upi", "credit"],
      user_role: ["superadmin", "owner", "employee"],
    },
  },
} as const
