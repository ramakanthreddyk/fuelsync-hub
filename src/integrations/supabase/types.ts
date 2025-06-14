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
      ocr_readings: {
        Row: {
          created_at: string | null
          created_by: number | null
          cumulative_vol: number
          id: number
          image_url: string | null
          nozzle_id: number
          pump_sno: string
          reading_date: string
          reading_time: string
          source: Database["public"]["Enums"]["ocr_source"]
          station_id: number
        }
        Insert: {
          created_at?: string | null
          created_by?: number | null
          cumulative_vol: number
          id?: number
          image_url?: string | null
          nozzle_id: number
          pump_sno?: string
          reading_date: string
          reading_time: string
          source: Database["public"]["Enums"]["ocr_source"]
          station_id: number
        }
        Update: {
          created_at?: string | null
          created_by?: number | null
          cumulative_vol?: number
          id?: number
          image_url?: string | null
          nozzle_id?: number
          pump_sno?: string
          reading_date?: string
          reading_time?: string
          source?: Database["public"]["Enums"]["ocr_source"]
          station_id?: number
        }
        Relationships: []
      }
      ocr_uploads: {
        Row: {
          file_url: string | null
          id: string
          uploaded_at: string | null
          user_id: string | null
        }
        Insert: {
          file_url?: string | null
          id?: string
          uploaded_at?: string | null
          user_id?: string | null
        }
        Update: {
          file_url?: string | null
          id?: string
          uploaded_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ocr_uploads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      station_plans: {
        Row: {
          effective_from: string
          id: number
          is_paid: boolean | null
          notes: string | null
          plan_id: number
          station_id: number
        }
        Insert: {
          effective_from?: string
          id?: number
          is_paid?: boolean | null
          notes?: string | null
          plan_id: number
          station_id: number
        }
        Update: {
          effective_from?: string
          id?: number
          is_paid?: boolean | null
          notes?: string | null
          plan_id?: number
          station_id?: number
        }
        Relationships: []
      }
      tank_inventory: {
        Row: {
          current_level_l: number
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          station_id: number
          updated_at: string | null
        }
        Insert: {
          current_level_l?: number
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          station_id: number
          updated_at?: string | null
        }
        Update: {
          current_level_l?: number
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          station_id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      tank_refills: {
        Row: {
          filled_at: string
          filled_by: number | null
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id: number
          quantity_l: number
          station_id: number
        }
        Insert: {
          filled_at?: string
          filled_by?: number | null
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id?: number
          quantity_l: number
          station_id: number
        }
        Update: {
          filled_at?: string
          filled_by?: number | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          id?: number
          quantity_l?: number
          station_id?: number
        }
        Relationships: []
      }
      user_activity_log: {
        Row: {
          activity_type: string
          details: Json | null
          id: number
          occurred_at: string
          station_id: number | null
          user_id: number
        }
        Insert: {
          activity_type: string
          details?: Json | null
          id?: number
          occurred_at?: string
          station_id?: number | null
          user_id: number
        }
        Update: {
          activity_type?: string
          details?: Json | null
          id?: number
          occurred_at?: string
          station_id?: number | null
          user_id?: number
        }
        Relationships: []
      }
      users: {
        Row: {
          auth_uid: string | null
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          auth_uid?: string | null
          created_at?: string | null
          email: string
          id?: string
        }
        Update: {
          auth_uid?: string | null
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      current_station_plans: {
        Row: {
          effective_from: string | null
          is_paid: boolean | null
          plan_id: number | null
          station_id: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      increment_ocr_usage: {
        Args: { p_station_id: number; p_month: string }
        Returns: undefined
      }
    }
    Enums: {
      fuel_brand: "IOCL" | "BPCL" | "HPCL"
      fuel_type: "PETROL" | "DIESEL" | "CNG" | "EV"
      ocr_source: "ocr" | "manual"
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
      fuel_brand: ["IOCL", "BPCL", "HPCL"],
      fuel_type: ["PETROL", "DIESEL", "CNG", "EV"],
      ocr_source: ["ocr", "manual"],
      tender_type: ["cash", "card", "upi", "credit"],
      user_role: ["superadmin", "owner", "employee"],
    },
  },
} as const
