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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_audit_log_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      autolohn_settings: {
        Row: {
          created_at: string
          id: string
          settings: Json
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          settings?: Json
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          settings?: Json
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      beitragsnachweise: {
        Row: {
          anzahl_versicherte: number | null
          av_ag: number | null
          av_an: number | null
          betriebsnummer_kk: string | null
          created_at: string
          created_by: string | null
          faelligkeitsdatum: string | null
          gesamtbetrag: number | null
          id: string
          insolvenzgeldumlage: number | null
          krankenkasse: string
          kv_ag: number | null
          kv_an: number | null
          kv_zusatzbeitrag_ag: number | null
          kv_zusatzbeitrag_an: number | null
          month: number
          pv_ag: number | null
          pv_an: number | null
          pv_kinderlose_zuschlag: number | null
          rv_ag: number | null
          rv_an: number | null
          status: string
          tenant_id: string | null
          uebermittelt_am: string | null
          umlage_u1: number | null
          umlage_u2: number | null
          updated_at: string
          year: number
        }
        Insert: {
          anzahl_versicherte?: number | null
          av_ag?: number | null
          av_an?: number | null
          betriebsnummer_kk?: string | null
          created_at?: string
          created_by?: string | null
          faelligkeitsdatum?: string | null
          gesamtbetrag?: number | null
          id?: string
          insolvenzgeldumlage?: number | null
          krankenkasse: string
          kv_ag?: number | null
          kv_an?: number | null
          kv_zusatzbeitrag_ag?: number | null
          kv_zusatzbeitrag_an?: number | null
          month: number
          pv_ag?: number | null
          pv_an?: number | null
          pv_kinderlose_zuschlag?: number | null
          rv_ag?: number | null
          rv_an?: number | null
          status?: string
          tenant_id?: string | null
          uebermittelt_am?: string | null
          umlage_u1?: number | null
          umlage_u2?: number | null
          updated_at?: string
          year: number
        }
        Update: {
          anzahl_versicherte?: number | null
          av_ag?: number | null
          av_an?: number | null
          betriebsnummer_kk?: string | null
          created_at?: string
          created_by?: string | null
          faelligkeitsdatum?: string | null
          gesamtbetrag?: number | null
          id?: string
          insolvenzgeldumlage?: number | null
          krankenkasse?: string
          kv_ag?: number | null
          kv_an?: number | null
          kv_zusatzbeitrag_ag?: number | null
          kv_zusatzbeitrag_an?: number | null
          month?: number
          pv_ag?: number | null
          pv_an?: number | null
          pv_kinderlose_zuschlag?: number | null
          rv_ag?: number | null
          rv_an?: number | null
          status?: string
          tenant_id?: string | null
          uebermittelt_am?: string | null
          umlage_u1?: number | null
          umlage_u2?: number | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "beitragsnachweise_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_beitragsnachweise_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          bank_name: string | null
          besonderheiten: string | null
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
          tenant_id: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          bank_name?: string | null
          besonderheiten?: string | null
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
          tenant_id?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          bank_name?: string | null
          besonderheiten?: string | null
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
          tenant_id?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_company_settings_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_alerts: {
        Row: {
          created_at: string
          due_date: string | null
          employee_id: string | null
          id: string
          is_read: boolean
          is_resolved: boolean
          message: string
          severity: string
          tenant_id: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          employee_id?: string | null
          id?: string
          is_read?: boolean
          is_resolved?: boolean
          message: string
          severity?: string
          tenant_id: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          employee_id?: string | null
          id?: string
          is_read?: boolean
          is_resolved?: boolean
          message?: string
          severity?: string
          tenant_id?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_compliance_alerts_employee_cascade"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_compliance_alerts_tenant_cascade"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string
        }
        Relationships: []
      }
      eau_records: {
        Row: {
          abruf_datum: string | null
          abruf_status: string
          arbeitgeber_kenntnis_datum: string | null
          arzt_name: string | null
          au_bis: string
          au_von: string
          created_at: string
          created_by: string | null
          diagnose_vorhanden: boolean | null
          employee_id: string
          id: string
          ist_folge_au: boolean | null
          notes: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          abruf_datum?: string | null
          abruf_status?: string
          arbeitgeber_kenntnis_datum?: string | null
          arzt_name?: string | null
          au_bis: string
          au_von: string
          created_at?: string
          created_by?: string | null
          diagnose_vorhanden?: boolean | null
          employee_id: string
          id?: string
          ist_folge_au?: boolean | null
          notes?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          abruf_datum?: string | null
          abruf_status?: string
          arbeitgeber_kenntnis_datum?: string | null
          arzt_name?: string | null
          au_bis?: string
          au_von?: string
          created_at?: string
          created_by?: string | null
          diagnose_vorhanden?: boolean | null
          employee_id?: string
          id?: string
          ist_folge_au?: boolean | null
          notes?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_wage_types: {
        Row: {
          amount: number
          created_at: string
          employee_id: string
          id: string
          is_active: boolean
          notes: string | null
          tenant_id: string
          updated_at: string
          valid_from: string
          valid_to: string | null
          wage_type_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          employee_id: string
          id?: string
          is_active?: boolean
          notes?: string | null
          tenant_id: string
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
          wage_type_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          employee_id?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          tenant_id?: string
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
          wage_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_wage_types_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_wage_types_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_wage_types_wage_type_id_fkey"
            columns: ["wage_type_id"]
            isOneToOne: false
            referencedRelation: "wage_types"
            referencedColumns: ["id"]
          },
        ]
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
          number_of_children: number | null
          personal_number: string | null
          position: string | null
          rv_befreit: boolean | null
          state: string | null
          street: string | null
          sv_number: string | null
          tax_class: number | null
          tax_id: string | null
          tenant_id: string | null
          updated_at: string
          versorgungswerk_beitragssatz: number | null
          versorgungswerk_mitgliedsnummer: string | null
          versorgungswerk_name: string | null
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
          number_of_children?: number | null
          personal_number?: string | null
          position?: string | null
          rv_befreit?: boolean | null
          state?: string | null
          street?: string | null
          sv_number?: string | null
          tax_class?: number | null
          tax_id?: string | null
          tenant_id?: string | null
          updated_at?: string
          versorgungswerk_beitragssatz?: number | null
          versorgungswerk_mitgliedsnummer?: string | null
          versorgungswerk_name?: string | null
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
          number_of_children?: number | null
          personal_number?: string | null
          position?: string | null
          rv_befreit?: boolean | null
          state?: string | null
          street?: string | null
          sv_number?: string | null
          tax_class?: number | null
          tax_id?: string | null
          tenant_id?: string | null
          updated_at?: string
          versorgungswerk_beitragssatz?: number | null
          versorgungswerk_mitgliedsnummer?: string | null
          versorgungswerk_name?: string | null
          weekly_hours?: number | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_employees_tenant_cascade"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gdpr_requests: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          request_type: string
          requested_by: string
          retention_end_date: string | null
          status: string
          subject_id: string
          subject_name: string | null
          subject_type: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          request_type: string
          requested_by: string
          retention_end_date?: string | null
          status?: string
          subject_id: string
          subject_name?: string | null
          subject_type: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          request_type?: string
          requested_by?: string
          retention_end_date?: string | null
          status?: string
          subject_id?: string
          subject_name?: string | null
          subject_type?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_gdpr_requests_tenant_cascade"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lohnsteueranmeldungen: {
        Row: {
          anmeldezeitraum: string
          anzahl_arbeitnehmer: number
          created_at: string
          created_by: string | null
          finanzamt: string | null
          gesamtbetrag: number
          id: string
          korrektur_von: string | null
          month: number
          status: string
          steuernummer: string | null
          summe_kirchensteuer_ev: number
          summe_kirchensteuer_rk: number
          summe_lohnsteuer: number
          summe_pauschale_lohnsteuer: number
          summe_solidaritaetszuschlag: number
          tenant_id: string | null
          transfer_ticket: string | null
          uebermittelt_am: string | null
          updated_at: string
          year: number
        }
        Insert: {
          anmeldezeitraum?: string
          anzahl_arbeitnehmer?: number
          created_at?: string
          created_by?: string | null
          finanzamt?: string | null
          gesamtbetrag?: number
          id?: string
          korrektur_von?: string | null
          month: number
          status?: string
          steuernummer?: string | null
          summe_kirchensteuer_ev?: number
          summe_kirchensteuer_rk?: number
          summe_lohnsteuer?: number
          summe_pauschale_lohnsteuer?: number
          summe_solidaritaetszuschlag?: number
          tenant_id?: string | null
          transfer_ticket?: string | null
          uebermittelt_am?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          anmeldezeitraum?: string
          anzahl_arbeitnehmer?: number
          created_at?: string
          created_by?: string | null
          finanzamt?: string | null
          gesamtbetrag?: number
          id?: string
          korrektur_von?: string | null
          month?: number
          status?: string
          steuernummer?: string | null
          summe_kirchensteuer_ev?: number
          summe_kirchensteuer_rk?: number
          summe_lohnsteuer?: number
          summe_pauschale_lohnsteuer?: number
          summe_solidaritaetszuschlag?: number
          tenant_id?: string | null
          transfer_ticket?: string | null
          uebermittelt_am?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_lsta_tenant_cascade"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lohnsteueranmeldungen_korrektur_von_fkey"
            columns: ["korrektur_von"]
            isOneToOne: false
            referencedRelation: "lohnsteueranmeldungen"
            referencedColumns: ["id"]
          },
        ]
      }
      lohnsteuerbescheinigungen: {
        Row: {
          created_at: string
          created_by: string | null
          employee_id: string
          id: string
          kinderfreibetraege: number | null
          religion: string | null
          status: string
          steuerklasse: string | null
          tenant_id: string | null
          transfer_ticket: string | null
          uebermittelt_am: string | null
          updated_at: string
          year: number
          zeile_22a_arbeitnehmeranteil_rv: number | null
          zeile_22b_arbeitgeberanteil_rv: number | null
          zeile_23a_arbeitnehmeranteil_kv: number | null
          zeile_23b_arbeitgeberanteil_kv: number | null
          zeile_24a_arbeitnehmeranteil_av: number | null
          zeile_24b_arbeitgeberanteil_av: number | null
          zeile_25_arbeitnehmeranteil_pv: number | null
          zeile_26_arbeitgeberanteil_pv: number | null
          zeile_3_bruttolohn: number | null
          zeile_4_lst: number | null
          zeile_5_soli: number | null
          zeile_6_kist: number | null
          zeile_7_kist_ehegatte: number | null
          zeitraum_bis: string | null
          zeitraum_von: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          employee_id: string
          id?: string
          kinderfreibetraege?: number | null
          religion?: string | null
          status?: string
          steuerklasse?: string | null
          tenant_id?: string | null
          transfer_ticket?: string | null
          uebermittelt_am?: string | null
          updated_at?: string
          year: number
          zeile_22a_arbeitnehmeranteil_rv?: number | null
          zeile_22b_arbeitgeberanteil_rv?: number | null
          zeile_23a_arbeitnehmeranteil_kv?: number | null
          zeile_23b_arbeitgeberanteil_kv?: number | null
          zeile_24a_arbeitnehmeranteil_av?: number | null
          zeile_24b_arbeitgeberanteil_av?: number | null
          zeile_25_arbeitnehmeranteil_pv?: number | null
          zeile_26_arbeitgeberanteil_pv?: number | null
          zeile_3_bruttolohn?: number | null
          zeile_4_lst?: number | null
          zeile_5_soli?: number | null
          zeile_6_kist?: number | null
          zeile_7_kist_ehegatte?: number | null
          zeitraum_bis?: string | null
          zeitraum_von?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          employee_id?: string
          id?: string
          kinderfreibetraege?: number | null
          religion?: string | null
          status?: string
          steuerklasse?: string | null
          tenant_id?: string | null
          transfer_ticket?: string | null
          uebermittelt_am?: string | null
          updated_at?: string
          year?: number
          zeile_22a_arbeitnehmeranteil_rv?: number | null
          zeile_22b_arbeitgeberanteil_rv?: number | null
          zeile_23a_arbeitnehmeranteil_kv?: number | null
          zeile_23b_arbeitgeberanteil_kv?: number | null
          zeile_24a_arbeitnehmeranteil_av?: number | null
          zeile_24b_arbeitgeberanteil_av?: number | null
          zeile_25_arbeitnehmeranteil_pv?: number | null
          zeile_26_arbeitgeberanteil_pv?: number | null
          zeile_3_bruttolohn?: number | null
          zeile_4_lst?: number | null
          zeile_5_soli?: number | null
          zeile_6_kist?: number | null
          zeile_7_kist_ehegatte?: number | null
          zeitraum_bis?: string | null
          zeitraum_von?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_lstb_employee_cascade"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lstb_tenant_cascade"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_payroll_entries_employee_cascade"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_payroll_entries_period_cascade"
            columns: ["payroll_period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_payroll_entries_tenant_cascade"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_guardian_anomalies: {
        Row: {
          current_value: number
          description: string
          detected_at: string
          deviation: number | null
          employee_id: string
          employee_name: string
          expected_value: number | null
          id: string
          is_resolved: boolean
          period: string
          resolution: string | null
          severity: string
          tenant_id: string
          title: string
          type: string
        }
        Insert: {
          current_value?: number
          description: string
          detected_at?: string
          deviation?: number | null
          employee_id: string
          employee_name: string
          expected_value?: number | null
          id?: string
          is_resolved?: boolean
          period: string
          resolution?: string | null
          severity?: string
          tenant_id: string
          title: string
          type: string
        }
        Update: {
          current_value?: number
          description?: string
          detected_at?: string
          deviation?: number | null
          employee_id?: string
          employee_name?: string
          expected_value?: number | null
          id?: string
          is_resolved?: boolean
          period?: string
          resolution?: string | null
          severity?: string
          tenant_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_guardian_anomalies_employee_cascade"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_guardian_anomalies_tenant_cascade"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_guardian_history: {
        Row: {
          bonuses: number
          created_at: string
          deductions: number
          employee_id: string
          gross_salary: number
          id: string
          net_salary: number
          overtime: number
          period: string
          tenant_id: string
        }
        Insert: {
          bonuses?: number
          created_at?: string
          deductions?: number
          employee_id: string
          gross_salary?: number
          id?: string
          net_salary?: number
          overtime?: number
          period: string
          tenant_id: string
        }
        Update: {
          bonuses?: number
          created_at?: string
          deductions?: number
          employee_id?: string
          gross_salary?: number
          id?: string
          net_salary?: number
          overtime?: number
          period?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_guardian_history_employee_cascade"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_guardian_history_tenant_cascade"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_payroll_periods_tenant_cascade"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
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
      special_payments: {
        Row: {
          created_at: string
          details: Json
          employee_id: string
          end_date: string
          id: string
          payment_type: string
          start_date: string
          status: string
          tenant_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: Json
          employee_id: string
          end_date: string
          id?: string
          payment_type: string
          start_date: string
          status?: string
          tenant_id: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: Json
          employee_id?: string
          end_date?: string
          id?: string
          payment_type?: string
          start_date?: string
          status?: string
          tenant_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_special_payments_employee_cascade"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_special_payments_tenant_cascade"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sv_meldungen: {
        Row: {
          beitragsgruppe: string | null
          betriebsnummer_kk: string | null
          created_at: string
          created_by: string | null
          employee_id: string
          id: string
          krankenkasse: string
          meldedatum: string | null
          meldegrund: string
          meldegrund_schluessel: string | null
          notes: string | null
          personengruppe: string | null
          status: string
          storniert_am: string | null
          storno_grund: string | null
          sv_brutto: number | null
          tenant_id: string | null
          updated_at: string
          zeitraum_bis: string
          zeitraum_von: string
        }
        Insert: {
          beitragsgruppe?: string | null
          betriebsnummer_kk?: string | null
          created_at?: string
          created_by?: string | null
          employee_id: string
          id?: string
          krankenkasse: string
          meldedatum?: string | null
          meldegrund: string
          meldegrund_schluessel?: string | null
          notes?: string | null
          personengruppe?: string | null
          status?: string
          storniert_am?: string | null
          storno_grund?: string | null
          sv_brutto?: number | null
          tenant_id?: string | null
          updated_at?: string
          zeitraum_bis: string
          zeitraum_von: string
        }
        Update: {
          beitragsgruppe?: string | null
          betriebsnummer_kk?: string | null
          created_at?: string
          created_by?: string | null
          employee_id?: string
          id?: string
          krankenkasse?: string
          meldedatum?: string | null
          meldegrund?: string
          meldegrund_schluessel?: string | null
          notes?: string | null
          personengruppe?: string | null
          status?: string
          storniert_am?: string | null
          storno_grund?: string | null
          sv_brutto?: number | null
          tenant_id?: string | null
          updated_at?: string
          zeitraum_bis?: string
          zeitraum_von?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sv_meldungen_employee_cascade"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sv_meldungen_tenant_cascade"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_tenant_members_tenant_cascade"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          betriebsnummer: string | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          street: string | null
          tax_number: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          betriebsnummer?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          street?: string | null
          tax_number?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          betriebsnummer?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          street?: string | null
          tax_number?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          break_time: number | null
          created_at: string
          date: string
          employee_id: string
          end_time: string | null
          hours_worked: number | null
          id: string
          notes: string | null
          start_time: string | null
          tenant_id: string
          type: string
          updated_at: string
        }
        Insert: {
          break_time?: number | null
          created_at?: string
          date: string
          employee_id: string
          end_time?: string | null
          hours_worked?: number | null
          id?: string
          notes?: string | null
          start_time?: string | null
          tenant_id: string
          type?: string
          updated_at?: string
        }
        Update: {
          break_time?: number | null
          created_at?: string
          date?: string
          employee_id?: string
          end_time?: string | null
          hours_worked?: number | null
          id?: string
          notes?: string | null
          start_time?: string | null
          tenant_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_time_entries_employee_cascade"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_time_entries_tenant_cascade"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_roles_tenant_cascade"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      wage_types: {
        Row: {
          account_skr03: string | null
          account_skr04: string | null
          amount_type: string
          category: string
          code: string
          created_at: string
          default_amount: number | null
          description: string | null
          id: string
          is_active: boolean
          is_sv_relevant: boolean
          is_system: boolean
          is_taxable: boolean
          name: string
          pauschal_tax_rate: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_skr03?: string | null
          account_skr04?: string | null
          amount_type?: string
          category: string
          code: string
          created_at?: string
          default_amount?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_sv_relevant?: boolean
          is_system?: boolean
          is_taxable?: boolean
          name: string
          pauschal_tax_rate?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_skr03?: string | null
          account_skr04?: string | null
          amount_type?: string
          category?: string
          code?: string
          created_at?: string
          default_amount?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_sv_relevant?: boolean
          is_system?: boolean
          is_taxable?: boolean
          name?: string
          pauschal_tax_rate?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wage_types_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_default_tenant: { Args: { _user_id: string }; Returns: string }
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_in_tenant: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _tenant_id: string
          _user_id: string
        }
        Returns: boolean
      }
      is_primary_admin: { Args: { _user_id: string }; Returns: boolean }
      is_tenant_member: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      shares_tenant: {
        Args: { _user_a: string; _user_b: string }
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
