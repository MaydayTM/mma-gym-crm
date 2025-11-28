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
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          id: string
          lead_id: string | null
          member_id: string | null
          metadata: Json | null
          performed_by: string | null
          source: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          member_id?: string | null
          metadata?: Json | null
          performed_by?: string | null
          source?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          member_id?: string | null
          metadata?: Json | null
          performed_by?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_retention_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "member_retention_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      checkins: {
        Row: {
          checkin_at: string
          checkout_at: string | null
          class_name: string | null
          coach_id: string | null
          created_at: string | null
          id: string
          location: string | null
          member_id: string
          method: string | null
        }
        Insert: {
          checkin_at?: string
          checkout_at?: string | null
          class_name?: string | null
          coach_id?: string | null
          created_at?: string | null
          id?: string
          location?: string | null
          member_id: string
          method?: string | null
        }
        Update: {
          checkin_at?: string
          checkout_at?: string | null
          class_name?: string | null
          coach_id?: string | null
          created_at?: string | null
          id?: string
          location?: string | null
          member_id?: string
          method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkins_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "member_retention_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_retention_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      import_field_mapping: {
        Row: {
          created_at: string | null
          id: number
          source_field: string
          source_system: string
          target_field: string
          transform_notes: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          source_field: string
          source_system: string
          target_field: string
          transform_notes?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          source_field?: string
          source_system?: string
          target_field?: string
          transform_notes?: string | null
        }
        Relationships: []
      }
      integrations: {
        Row: {
          config: Json | null
          created_at: string | null
          description: string | null
          display_name: string | null
          enabled: boolean | null
          health_status: string | null
          id: string
          last_health_check_at: string | null
          last_synced_at: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          enabled?: boolean | null
          health_status?: string | null
          id?: string
          last_health_check_at?: string | null
          last_synced_at?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          enabled?: boolean | null
          health_status?: string | null
          id?: string
          last_health_check_at?: string | null
          last_synced_at?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          converted_at: string | null
          converted_member_id: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          follow_up_date: string | null
          id: string
          interested_in: string[] | null
          last_name: string | null
          lost_reason: string | null
          notes: string | null
          phone: string | null
          source: string | null
          source_detail: string | null
          status: string | null
          trial_date: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          converted_at?: string | null
          converted_member_id?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          follow_up_date?: string | null
          id?: string
          interested_in?: string[] | null
          last_name?: string | null
          lost_reason?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          source_detail?: string | null
          status?: string | null
          trial_date?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          converted_at?: string | null
          converted_member_id?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          follow_up_date?: string | null
          id?: string
          interested_in?: string[] | null
          last_name?: string | null
          lost_reason?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          source_detail?: string | null
          status?: string | null
          trial_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "member_retention_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_converted_member_id_fkey"
            columns: ["converted_member_id"]
            isOneToOne: false
            referencedRelation: "member_retention_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_converted_member_id_fkey"
            columns: ["converted_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          access_card_id: string | null
          access_enabled: boolean | null
          auth_user_id: string | null
          bank_account_iban: string | null
          bank_bic: string | null
          belt_color: string | null
          belt_stripes: number | null
          belt_updated_at: string | null
          birth_date: string | null
          city: string | null
          club_balance: number | null
          clubplanner_id: string | null
          clubplanner_member_nr: number | null
          country: string | null
          created_at: string | null
          disciplines: string[] | null
          email: string
          first_name: string
          gender: string | null
          id: string
          insurance_active: boolean | null
          insurance_expires_at: string | null
          last_checkin_at: string | null
          last_name: string
          latitude: number | null
          longitude: number | null
          loyalty_points: number | null
          member_since: string | null
          national_id: string | null
          notes: string | null
          phone: string | null
          phone_landline: string | null
          phone_mobile: string | null
          profile_picture_url: string | null
          retention_status: string | null
          role: string
          status: string | null
          street: string | null
          stripe_customer_id: string | null
          total_checkins: number | null
          updated_at: string | null
          vat_number: string | null
          zip_code: string | null
        }
        Insert: {
          access_card_id?: string | null
          access_enabled?: boolean | null
          auth_user_id?: string | null
          bank_account_iban?: string | null
          bank_bic?: string | null
          belt_color?: string | null
          belt_stripes?: number | null
          belt_updated_at?: string | null
          birth_date?: string | null
          city?: string | null
          club_balance?: number | null
          clubplanner_id?: string | null
          clubplanner_member_nr?: number | null
          country?: string | null
          created_at?: string | null
          disciplines?: string[] | null
          email: string
          first_name: string
          gender?: string | null
          id?: string
          insurance_active?: boolean | null
          insurance_expires_at?: string | null
          last_checkin_at?: string | null
          last_name: string
          latitude?: number | null
          longitude?: number | null
          loyalty_points?: number | null
          member_since?: string | null
          national_id?: string | null
          notes?: string | null
          phone?: string | null
          phone_landline?: string | null
          phone_mobile?: string | null
          profile_picture_url?: string | null
          retention_status?: string | null
          role?: string
          status?: string | null
          street?: string | null
          stripe_customer_id?: string | null
          total_checkins?: number | null
          updated_at?: string | null
          vat_number?: string | null
          zip_code?: string | null
        }
        Update: {
          access_card_id?: string | null
          access_enabled?: boolean | null
          auth_user_id?: string | null
          bank_account_iban?: string | null
          bank_bic?: string | null
          belt_color?: string | null
          belt_stripes?: number | null
          belt_updated_at?: string | null
          birth_date?: string | null
          city?: string | null
          club_balance?: number | null
          clubplanner_id?: string | null
          clubplanner_member_nr?: number | null
          country?: string | null
          created_at?: string | null
          disciplines?: string[] | null
          email?: string
          first_name?: string
          gender?: string | null
          id?: string
          insurance_active?: boolean | null
          insurance_expires_at?: string | null
          last_checkin_at?: string | null
          last_name?: string
          latitude?: number | null
          longitude?: number | null
          loyalty_points?: number | null
          member_since?: string | null
          national_id?: string | null
          notes?: string | null
          phone?: string | null
          phone_landline?: string | null
          phone_mobile?: string | null
          profile_picture_url?: string | null
          retention_status?: string | null
          role?: string
          status?: string | null
          street?: string | null
          stripe_customer_id?: string | null
          total_checkins?: number | null
          updated_at?: string | null
          vat_number?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      revenue: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          member_id: string | null
          paid_at: string
          period_end: string | null
          period_start: string | null
          status: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          subscription_id: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          member_id?: string | null
          paid_at?: string
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          member_id?: string | null
          paid_at?: string
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_retention_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_interval: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          created_at: string | null
          currency: string | null
          end_date: string | null
          frozen_until: string | null
          id: string
          member_id: string
          name: string
          price: number
          remaining_sessions: number | null
          start_date: string
          status: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          total_sessions: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          billing_interval?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          currency?: string | null
          end_date?: string | null
          frozen_until?: string | null
          id?: string
          member_id: string
          name: string
          price: number
          remaining_sessions?: number | null
          start_date: string
          status?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          total_sessions?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          billing_interval?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          currency?: string | null
          end_date?: string | null
          frozen_until?: string | null
          id?: string
          member_id?: string
          name?: string
          price?: number
          remaining_sessions?: number | null
          start_date?: string
          status?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          total_sessions?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_retention_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          member_id: string | null
          priority: string | null
          result_notes: string | null
          snoozed_until: string | null
          status: string | null
          subscription_id: string | null
          task_type: string
          title: string
          triggered_by: string | null
          updated_at: string | null
          workflow_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          member_id?: string | null
          priority?: string | null
          result_notes?: string | null
          snoozed_until?: string | null
          status?: string | null
          subscription_id?: string | null
          task_type: string
          title: string
          triggered_by?: string | null
          updated_at?: string | null
          workflow_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          member_id?: string | null
          priority?: string | null
          result_notes?: string | null
          snoozed_until?: string | null
          status?: string | null
          subscription_id?: string | null
          task_type?: string
          title?: string
          triggered_by?: string | null
          updated_at?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "member_retention_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "member_retention_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_retention_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          attempts: number | null
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          last_attempt_at: string | null
          max_attempts: number | null
          next_retry_at: string | null
          payload: Json
          response_body: string | null
          response_status: number | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          last_attempt_at?: string | null
          max_attempts?: number | null
          next_retry_at?: string | null
          payload: Json
          response_body?: string | null
          response_status?: number | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          last_attempt_at?: string | null
          max_attempts?: number | null
          next_retry_at?: string | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      dashboard_stats: {
        Row: {
          active_members: number | null
          cancellations_30d: number | null
          checkins_7d: number | null
          new_members_30d: number | null
          open_leads: number | null
          revenue_30d: number | null
        }
        Relationships: []
      }
      member_retention_status: {
        Row: {
          days_since_visit: number | null
          email: string | null
          first_name: string | null
          id: string | null
          last_checkin_at: string | null
          last_name: string | null
          retention_status: string | null
          status: string | null
        }
        Insert: {
          days_since_visit?: never
          email?: string | null
          first_name?: string | null
          id?: string | null
          last_checkin_at?: string | null
          last_name?: string | null
          retention_status?: never
          status?: string | null
        }
        Update: {
          days_since_visit?: never
          email?: string | null
          first_name?: string | null
          id?: string | null
          last_checkin_at?: string | null
          last_name?: string | null
          retention_status?: never
          status?: string | null
        }
        Relationships: []
      }
      pending_tasks_summary: {
        Row: {
          assigned_to: string | null
          earliest_due: string | null
          high_count: number | null
          low_count: number | null
          normal_count: number | null
          total_count: number | null
          urgent_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "member_retention_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      recent_activity: {
        Row: {
          action: string | null
          created_at: string | null
          description: string | null
          id: string | null
          metadata: Json | null
          performed_by_name: string | null
          source: string | null
          subject_id: string | null
          subject_name: string | null
          subject_type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_my_role: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
