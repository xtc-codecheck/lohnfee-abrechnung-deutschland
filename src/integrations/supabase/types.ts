export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          bank_name: string | null
          betriebsnummer: string | null
          bic: string | null
          city: string | null
          company_name: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          iban: string | null
          id: string
          street: string | null
          tax_number: string | null
          tax_office: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          bank_name?: string | null
          betriebsnummer?: string | null
          bic?: string | null
          city?: string | null
          company_name: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          iban?: string | null
          id?: string
          street?: string | null
          tax_number?: string | null
          tax_office?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          bank_name?: string | null
          betriebsnummer?: string | null
          bic?: string | null
          city?: string | null
          company_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          iban?: string | null
          id?: string
          street?: string | null
          tax_number?: string | null
          tax_office?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          bav_monthly_amount: number | null
          bic: string | null
          children_allowance: number | null
          church_tax: boolean | null
          church_tax_rate: number | null
          city: string | null
          company_car_distance_km: number | null
          company_car_list_price: number | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          department: string | null
          employment_type: string | null
          entry_date: string | null
          exit_date: string | null
          first_name: string
          gender: string | null
          gross_salary: number
          has_bav: boolean | null
          has_company_car: boolean | null
          health_insurance: string | null
          health_insurance_number: string | null
          iban: string | null
          id: string
          is_active: boolean | null
          last_name: string
          personal_number: string | null
          position: string | null
          street: string | null
          sv_number: string | null
          tax_class: number | null
          tax_id: string | null
          updated_at: string
          weekly_hours: number | null
          zip_code: string | null
        }
        Insert: {
          bav_monthly_amount?: number | null
          bic?: string | null
          children_allowance?: number | null
          church_tax?: boolean | null
          church_tax_rate?: number | null
          city?: string | null
          company_car_distance_km?: number | null
          company_car_list_price?: number | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          department?: string | null
          employment_type?: string | null
          entry_date?: string | null
          exit_date?: string | null
          first_name: string
          gender?: string | null
          gross_salary?: number
          has_bav?: boolean | null
          has_company_car?: boolean | null
          health_insurance?: string | null
          health_insurance_number?: string | null
          iban?: string | null
          id?: string
          is_active?: boolean | null
          last_name: string
          personal_number?: string | null
          position?: string | null
          street?: string | null
          sv_number?: string | null
          tax_class?: number | null
          tax_id?: string | null
          updated_at?: string
          weekly_hours?: number | null
          zip_code?: string | null
        }
        Update: {
          bav_monthly_amount?: number | null
          bic?: string | null
          children_allowance?: number | null
          church_tax?: boolean | null
          church_tax_rate?: number | null
          city?: string | null
          company_car_distance_km?: number | null
          company_car_list_price?: number | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          department?: string | null
          employment_type?: string | null
          entry_date?: string | null
          exit_date?: string | null
          first_name?: string
          gender?: string | null
          gross_salary?: number
          has_bav?: boolean | null
          has_company_car?: boolean | null
          health_insurance?: string | null
          health_insurance_number?: string | null
          iban?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string
          personal_number?: string | null
          position?: string | null
          street?: string | null
          sv_number?: string | null
          tax_class?: number | null
          tax_id?: string | null
          updated_at?: string
          weekly_hours?: number | null
          zip_code?: string | null
        }
        Relationships: []
      }
      payroll_entries: {
        Row: {
          audit_data: Json | null
          bonus: number | null
          created_at: string
          deduction_description: string | null
          deductions: number | null
          employee_id: string
          employer_costs: number | null
          final_net_salary: number
          gross_salary: number
          id: string
          net_salary: number
          notes: string | null
          overtime_hours: number | null
          overtime_pay: number | null
          payroll_period_id: string
          sv_care_employee: number | null
          sv_care_employer: number | null
          sv_health_employee: number | null
          sv_health_employer: number | null
          sv_pension_employee: number | null
          sv_pension_employer: number | null
          sv_total_employee: number | null
          sv_total_employer: number | null
          sv_unemployment_employee: number | null
          sv_unemployment_employer: number | null
          tax_church: number | null
          tax_income_tax: number | null
          tax_solidarity: number | null
          tax_total: number | null
          updated_at: string
        }
        Insert: {
          audit_data?: Json | null
          bonus?: number | null
          created_at?: string
          deduction_description?: string | null
          deductions?: number | null
          employee_id: string
          employer_costs?: number | null
          final_net_salary: number
          gross_salary: number
          id?: string
          net_salary: number
          notes?: string | null
          overtime_hours?: number | null
          overtime_pay?: number | null
          payroll_period_id: string
          sv_care_employee?: number | null
          sv_care_employer?: number | null
          sv_health_employee?: number | null
          sv_health_employer?: number | null
          sv_pension_employee?: number | null
          sv_pension_employer?: number | null
          sv_total_employee?: number | null
          sv_total_employer?: number | null
          sv_unemployment_employee?: number | null
          sv_unemployment_employer?: number | null
          tax_church?: number | null
          tax_income_tax?: number | null
          tax_solidarity?: number | null
          tax_total?: number | null
          updated_at?: string
        }
        Update: {
          audit_data?: Json | null
          bonus?: number | null
          created_at?: string
          deduction_description?: string | null
          deductions?: number | null
          employee_id?: string
          employer_costs?: number | null
          final_net_salary?: number
          gross_salary?: number
          id?: string
          net_salary?: number
          notes?: string | null
          overtime_hours?: number | null
          overtime_pay?: number | null
          payroll_period_id?: string
          sv_care_employee?: number | null
          sv_care_employer?: number | null
          sv_health_employee?: number | null
          sv_health_employer?: number | null
          sv_pension_employee?: number | null
          sv_pension_employer?: number | null
          sv_total_employee?: number | null
          sv_total_employer?: number | null
          sv_unemployment_employee?: number | null
          sv_unemployment_employer?: number | null
          tax_church?: number | null
          tax_income_tax?: number | null
          tax_solidarity?: number | null
          tax_total?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_entries_payroll_period_id_fkey"
            columns: ["payroll_period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_periods: {
        Row: {
          created_at: string
          end_date: string
          id: string
          month: number
          processed_at: string | null
          processed_by: string | null
          start_date: string
          status: string
          year: number
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          month: number
          processed_at?: string | null
          processed_by?: string | null
          start_date: string
          status?: string
          year: number
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          month?: number
          processed_at?: string | null
          processed_by?: string | null
          start_date?: string
          status?: string
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "sachbearbeiter" | "leserecht"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "sachbearbeiter", "leserecht"],
    },
  },
} as const
