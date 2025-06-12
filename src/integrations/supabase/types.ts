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
      discrepancies: {
        Row: {
          actual: number
          created_at: string
          date: string
          difference: number
          expected: number
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          actual: number
          created_at?: string
          date?: string
          difference: number
          expected: number
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          actual?: number
          created_at?: string
          date?: string
          difference?: number
          expected?: number
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          avatar: string | null
          created_at: string
          email: string
          id: string
          joining_date: string
          name: string
          petrol_pump_id: string | null
          phone: string
          role: Database["public"]["Enums"]["employee_role"]
          status: Database["public"]["Enums"]["employee_status"]
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          email: string
          id?: string
          joining_date: string
          name: string
          petrol_pump_id?: string | null
          phone: string
          role: Database["public"]["Enums"]["employee_role"]
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          email?: string
          id?: string
          joining_date?: string
          name?: string
          petrol_pump_id?: string | null
          phone?: string
          role?: Database["public"]["Enums"]["employee_role"]
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_petrol_pump_id_fkey"
            columns: ["petrol_pump_id"]
            isOneToOne: false
            referencedRelation: "petrol_pumps"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_stocks: {
        Row: {
          capacity: number
          created_at: string
          current: number
          id: string
          last_refill: string | null
          price: number
          status: string
          type: Database["public"]["Enums"]["fuel_type"]
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          current?: number
          id?: string
          last_refill?: string | null
          price?: number
          status?: string
          type: Database["public"]["Enums"]["fuel_type"]
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          current?: number
          id?: string
          last_refill?: string | null
          price?: number
          status?: string
          type?: Database["public"]["Enums"]["fuel_type"]
          updated_at?: string
        }
        Relationships: []
      }
      petrol_pumps: {
        Row: {
          address: string | null
          created_at: string | null
          id: string
          manager_id: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string
          manager_id?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["employee_role"]
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          role?: Database["public"]["Enums"]["employee_role"]
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["employee_role"]
          updated_at?: string
        }
        Relationships: []
      }
      refills: {
        Row: {
          created_at: string
          date: string
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id: string
          invoice_number: string
          price: number
          quantity: number
          supplier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date?: string
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id?: string
          invoice_number: string
          price: number
          quantity: number
          supplier: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          id?: string
          invoice_number?: string
          price?: number
          quantity?: number
          supplier?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          amount: number
          created_at: string
          date: string
          employee_id: string | null
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          pump_number: number | null
          quantity: number
          receipt_number: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          employee_id?: string | null
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          pump_number?: number | null
          quantity: number
          receipt_number?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          employee_id?: string | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          pump_number?: number | null
          quantity?: number
          receipt_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
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
      employee_role: "Manager" | "Attendant" | "Cashier" | "Owner"
      employee_status: "active" | "inactive"
      fuel_type: "Petrol" | "Diesel" | "Premium"
      payment_method: "cash" | "card" | "mobile"
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
      employee_role: ["Manager", "Attendant", "Cashier", "Owner"],
      employee_status: ["active", "inactive"],
      fuel_type: ["Petrol", "Diesel", "Premium"],
      payment_method: ["cash", "card", "mobile"],
    },
  },
} as const
