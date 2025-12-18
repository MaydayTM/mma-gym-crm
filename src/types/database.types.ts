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
      age_groups: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          max_age: number | null
          min_age: number | null
          name: string
          slug: string
          sort_order: number | null
          starting_price: number | null
          subtitle: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_age?: number | null
          min_age?: number | null
          name: string
          slug: string
          sort_order?: number | null
          starting_price?: number | null
          subtitle?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_age?: number | null
          min_age?: number | null
          name?: string
          slug?: string
          sort_order?: number | null
          starting_price?: number | null
          subtitle?: string | null
        }
        Relationships: []
      }
      belt_history: {
        Row: {
          created_at: string | null
          discipline_id: string
          from_belt: string | null
          from_stripes: number | null
          id: string
          member_id: string
          notes: string | null
          promoted_at: string | null
          promoted_by: string | null
          to_belt: string
          to_dan: number | null
          to_stripes: number | null
          trainings_at_promotion: number
        }
        Insert: {
          created_at?: string | null
          discipline_id: string
          from_belt?: string | null
          from_stripes?: number | null
          id?: string
          member_id: string
          notes?: string | null
          promoted_at?: string | null
          promoted_by?: string | null
          to_belt: string
          to_dan?: number | null
          to_stripes?: number | null
          trainings_at_promotion?: number
        }
        Update: {
          created_at?: string | null
          discipline_id?: string
          from_belt?: string | null
          from_stripes?: number | null
          id?: string
          member_id?: string
          notes?: string | null
          promoted_at?: string | null
          promoted_by?: string | null
          to_belt?: string
          to_dan?: number | null
          to_stripes?: number | null
          trainings_at_promotion?: number
        }
        Relationships: [
          {
            foreignKeyName: "belt_history_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "belt_history_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_retention_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "belt_history_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "belt_history_promoted_by_fkey"
            columns: ["promoted_by"]
            isOneToOne: false
            referencedRelation: "member_retention_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "belt_history_promoted_by_fkey"
            columns: ["promoted_by"]
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
          class_id: string | null
          class_name: string | null
          coach_id: string | null
          created_at: string | null
          discipline_id: string | null
          id: string
          location: string | null
          member_id: string
          method: string | null
          reservation_id: string | null
        }
        Insert: {
          checkin_at?: string
          checkout_at?: string | null
          class_id?: string | null
          class_name?: string | null
          coach_id?: string | null
          created_at?: string | null
          discipline_id?: string | null
          id?: string
          location?: string | null
          member_id: string
          method?: string | null
          reservation_id?: string | null
        }
        Update: {
          checkin_at?: string
          checkout_at?: string | null
          class_id?: string | null
          class_name?: string | null
          coach_id?: string | null
          created_at?: string | null
          discipline_id?: string | null
          id?: string
          location?: string | null
          member_id?: string
          method?: string | null
          reservation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkins_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "checkins_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
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
          {
            foreignKeyName: "checkins_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_sessions: {
        Row: {
          addon_total: number | null
          age_group_id: string | null
          birth_date: string | null
          checkout_type: string
          completed_at: string | null
          created_at: string | null
          created_member_id: string | null
          created_subscription_id: string | null
          discount_total: number | null
          duration_months: number | null
          email: string | null
          expires_at: string | null
          external_checkout_id: string | null
          family_discount: number | null
          family_group_id: string | null
          family_position: number | null
          final_total: number | null
          first_name: string | null
          id: string
          last_name: string | null
          one_time_product_id: string | null
          payment_provider: string | null
          payment_status: string | null
          phone: string | null
          plan_type_id: string | null
          referrer_url: string | null
          selected_addons: Json | null
          selected_discipline_id: string | null
          subtotal: number | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          addon_total?: number | null
          age_group_id?: string | null
          birth_date?: string | null
          checkout_type: string
          completed_at?: string | null
          created_at?: string | null
          created_member_id?: string | null
          created_subscription_id?: string | null
          discount_total?: number | null
          duration_months?: number | null
          email?: string | null
          expires_at?: string | null
          external_checkout_id?: string | null
          family_discount?: number | null
          family_group_id?: string | null
          family_position?: number | null
          final_total?: number | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          one_time_product_id?: string | null
          payment_provider?: string | null
          payment_status?: string | null
          phone?: string | null
          plan_type_id?: string | null
          referrer_url?: string | null
          selected_addons?: Json | null
          selected_discipline_id?: string | null
          subtotal?: number | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          addon_total?: number | null
          age_group_id?: string | null
          birth_date?: string | null
          checkout_type?: string
          completed_at?: string | null
          created_at?: string | null
          created_member_id?: string | null
          created_subscription_id?: string | null
          discount_total?: number | null
          duration_months?: number | null
          email?: string | null
          expires_at?: string | null
          external_checkout_id?: string | null
          family_discount?: number | null
          family_group_id?: string | null
          family_position?: number | null
          final_total?: number | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          one_time_product_id?: string | null
          payment_provider?: string | null
          payment_status?: string | null
          phone?: string | null
          plan_type_id?: string | null
          referrer_url?: string | null
          selected_addons?: Json | null
          selected_discipline_id?: string | null
          subtotal?: number | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkout_sessions_age_group_id_fkey"
            columns: ["age_group_id"]
            isOneToOne: false
            referencedRelation: "age_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_sessions_created_member_id_fkey"
            columns: ["created_member_id"]
            isOneToOne: false
            referencedRelation: "member_retention_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_sessions_created_member_id_fkey"
            columns: ["created_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_sessions_created_subscription_id_fkey"
            columns: ["created_subscription_id"]
            isOneToOne: false
            referencedRelation: "member_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_sessions_family_group_id_fkey"
            columns: ["family_group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_sessions_one_time_product_id_fkey"
            columns: ["one_time_product_id"]
            isOneToOne: false
            referencedRelation: "one_time_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_sessions_plan_type_id_fkey"
            columns: ["plan_type_id"]
            isOneToOne: false
            referencedRelation: "plan_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_sessions_selected_discipline_id_fkey"
            columns: ["selected_discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
        ]
      }
      class_instances: {
        Row: {
          cancellation_reason: string | null
          class_id: string
          coach_id: string | null
          created_at: string | null
          date: string
          end_time: string
          id: string
          is_cancelled: boolean | null
          start_time: string
        }
        Insert: {
          cancellation_reason?: string | null
          class_id: string
          coach_id?: string | null
          created_at?: string | null
          date: string
          end_time: string
          id?: string
          is_cancelled?: boolean | null
          start_time: string
        }
        Update: {
          cancellation_reason?: string | null
          class_id?: string
          coach_id?: string | null
          created_at?: string | null
          date?: string
          end_time?: string
          id?: string
          is_cancelled?: boolean | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_instances_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_instances_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "member_retention_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_instances_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          coach_id: string | null
          created_at: string | null
          day_of_week: number
          discipline_id: string
          end_time: string
          id: string
          is_active: boolean | null
          is_recurring: boolean | null
          max_capacity: number | null
          name: string
          recurrence_end_date: string | null
          room: string | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          coach_id?: string | null
          created_at?: string | null
          day_of_week: number
          discipline_id: string
          end_time: string
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          max_capacity?: number | null
          name: string
          recurrence_end_date?: string | null
          room?: string | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          coach_id?: string | null
          created_at?: string | null
          day_of_week?: number
          discipline_id?: string
          end_time?: string
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          max_capacity?: number | null
          name?: string
          recurrence_end_date?: string | null
          room?: string | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "member_retention_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_fighter_characters: {
        Row: {
          character_type: string | null
          created_at: string | null
          id: string
          image_url: string
          prompt: string | null
          user_id: string | null
        }
        Insert: {
          character_type?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          prompt?: string | null
          user_id?: string | null
        }
        Update: {
          character_type?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          prompt?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      creative_fighter_credit_costs: {
        Row: {
          action_type: string
          credits_cost: number
          description: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          action_type: string
          credits_cost: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          credits_cost?: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      creative_fighter_credit_packages: {
        Row: {
          created_at: string | null
          credits: number
          currency: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          price_cents: number
          sort_order: number | null
          stripe_price_id: string | null
        }
        Insert: {
          created_at?: string | null
          credits: number
          currency?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          price_cents: number
          sort_order?: number | null
          stripe_price_id?: string | null
        }
        Update: {
          created_at?: string | null
          credits?: number
          currency?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          price_cents?: number
          sort_order?: number | null
          stripe_price_id?: string | null
        }
        Relationships: []
      }
      creative_fighter_credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          description: string | null
          id: string
          reference_id: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creative_fighter_credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "creative_fighter_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_fighter_gear: {
        Row: {
          created_at: string | null
          gear_type: string
          id: string
          image_url: string
          output_format: string | null
          prompt: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          gear_type: string
          id?: string
          image_url: string
          output_format?: string | null
          prompt?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          gear_type?: string
          id?: string
          image_url?: string
          output_format?: string | null
          prompt?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      creative_fighter_photos: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          prompt: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          prompt?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          prompt?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      creative_fighter_profiles: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          credits: number | null
          display_name: string | null
          email: string
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          credits?: number | null
          display_name?: string | null
          email: string
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          credits?: number | null
          display_name?: string | null
          email?: string
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      creative_fighter_videos: {
        Row: {
          created_at: string | null
          id: string
          prompt: string | null
          user_id: string | null
          video_url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          prompt?: string | null
          user_id?: string | null
          video_url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          prompt?: string | null
          user_id?: string | null
          video_url?: string
        }
        Relationships: []
      }
      disciplines: {
        Row: {
          color: string | null
          created_at: string | null
          has_belt_system: boolean | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          has_belt_system?: boolean | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          has_belt_system?: boolean | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          code: string
          created_at: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_amount: number | null
          tenant_id: string
          times_used: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          tenant_id: string
          times_used?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          tenant_id?: string
          times_used?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      discounts: {
        Row: {
          amount: number | null
          checkout_code: string | null
          created_at: string | null
          current_uses: number | null
          description: string | null
          discount_type: string
          id: string
          is_active: boolean | null
          is_exclusive: boolean | null
          max_uses: number | null
          name: string
          percentage: number | null
          requires_verification: boolean | null
          show_on_checkout: boolean | null
          slug: string
          sort_order: number | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          amount?: number | null
          checkout_code?: string | null
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type?: string
          id?: string
          is_active?: boolean | null
          is_exclusive?: boolean | null
          max_uses?: number | null
          name: string
          percentage?: number | null
          requires_verification?: boolean | null
          show_on_checkout?: boolean | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          amount?: number | null
          checkout_code?: string | null
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type?: string
          id?: string
          is_active?: boolean | null
          is_exclusive?: boolean | null
          max_uses?: number | null
          name?: string
          percentage?: number | null
          requires_verification?: boolean | null
          show_on_checkout?: boolean | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      family_discounts: {
        Row: {
          created_at: string | null
          description: string | null
          discount_amount: number
          id: string
          position: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discount_amount: number
          id?: string
          position: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discount_amount?: number
          id?: string
          position?: number
        }
        Relationships: []
      }
      family_groups: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      family_members: {
        Row: {
          created_at: string | null
          family_group_id: string
          id: string
          member_id: string
          position: number
        }
        Insert: {
          created_at?: string | null
          family_group_id: string
          id?: string
          member_id: string
          position: number
        }
        Update: {
          created_at?: string | null
          family_group_id?: string
          id?: string
          member_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_group_id_fkey"
            columns: ["family_group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "member_retention_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
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
      member_belts: {
        Row: {
          belt_color: string
          created_at: string | null
          dan_grade: number | null
          discipline_id: string
          id: string
          member_id: string
          stripes: number | null
          updated_at: string | null
        }
        Insert: {
          belt_color: string
          created_at?: string | null
          dan_grade?: number | null
          discipline_id: string
          id?: string
          member_id: string
          stripes?: number | null
          updated_at?: string | null
        }
        Update: {
          belt_color?: string
          created_at?: string | null
          dan_grade?: number | null
          discipline_id?: string
          id?: string
          member_id?: string
          stripes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_belts_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_belts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_retention_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_belts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_subscription_discounts: {
        Row: {
          created_at: string | null
          discount_amount: number
          discount_id: string | null
          discount_name: string
          family_discount_id: string | null
          id: string
          subscription_id: string
        }
        Insert: {
          created_at?: string | null
          discount_amount: number
          discount_id?: string | null
          discount_name: string
          family_discount_id?: string | null
          id?: string
          subscription_id: string
        }
        Update: {
          created_at?: string | null
          discount_amount?: number
          discount_id?: string | null
          discount_name?: string
          family_discount_id?: string | null
          id?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_subscription_discounts_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_subscription_discounts_family_discount_id_fkey"
            columns: ["family_discount_id"]
            isOneToOne: false
            referencedRelation: "family_discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_subscription_discounts_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "member_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      member_subscriptions: {
        Row: {
          addon_total: number | null
          age_group_id: string | null
          auto_renew: boolean | null
          base_price: number
          cancel_reason: string | null
          cancelled_at: string | null
          created_at: string | null
          duration_months: number | null
          end_date: string | null
          external_subscription_id: string | null
          family_discount: number | null
          final_price: number
          frozen_until: string | null
          id: string
          member_id: string
          one_time_product_id: string | null
          payment_provider: string | null
          plan_type_id: string | null
          selected_discipline_id: string | null
          sessions_remaining: number | null
          start_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          addon_total?: number | null
          age_group_id?: string | null
          auto_renew?: boolean | null
          base_price: number
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          duration_months?: number | null
          end_date?: string | null
          external_subscription_id?: string | null
          family_discount?: number | null
          final_price: number
          frozen_until?: string | null
          id?: string
          member_id: string
          one_time_product_id?: string | null
          payment_provider?: string | null
          plan_type_id?: string | null
          selected_discipline_id?: string | null
          sessions_remaining?: number | null
          start_date: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          addon_total?: number | null
          age_group_id?: string | null
          auto_renew?: boolean | null
          base_price?: number
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          duration_months?: number | null
          end_date?: string | null
          external_subscription_id?: string | null
          family_discount?: number | null
          final_price?: number
          frozen_until?: string | null
          id?: string
          member_id?: string
          one_time_product_id?: string | null
          payment_provider?: string | null
          plan_type_id?: string | null
          selected_discipline_id?: string | null
          sessions_remaining?: number | null
          start_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_subscriptions_age_group_id_fkey"
            columns: ["age_group_id"]
            isOneToOne: false
            referencedRelation: "age_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_subscriptions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_retention_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_subscriptions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_subscriptions_one_time_product_id_fkey"
            columns: ["one_time_product_id"]
            isOneToOne: false
            referencedRelation: "one_time_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_subscriptions_plan_type_id_fkey"
            columns: ["plan_type_id"]
            isOneToOne: false
            referencedRelation: "plan_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_subscriptions_selected_discipline_id_fkey"
            columns: ["selected_discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
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
          legacy_checkin_count: number | null
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
          legacy_checkin_count?: number | null
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
          legacy_checkin_count?: number | null
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
      modules: {
        Row: {
          created_at: string | null
          description: string | null
          external_url: string | null
          icon: string | null
          id: string
          is_core: boolean | null
          name: string
          price_monthly: number | null
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          external_url?: string | null
          icon?: string | null
          id?: string
          is_core?: boolean | null
          name: string
          price_monthly?: number | null
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          external_url?: string | null
          icon?: string | null
          id?: string
          is_core?: boolean | null
          name?: string
          price_monthly?: number | null
          slug?: string
        }
        Relationships: []
      }
      one_time_products: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          mollie_payment_id: string | null
          name: string
          price: number
          product_type: string
          sessions: number | null
          show_on_checkout: boolean | null
          slug: string
          sort_order: number | null
          stripe_price_id: string | null
          validity_days: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          mollie_payment_id?: string | null
          name: string
          price: number
          product_type: string
          sessions?: number | null
          show_on_checkout?: boolean | null
          slug: string
          sort_order?: number | null
          stripe_price_id?: string | null
          validity_days: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          mollie_payment_id?: string | null
          name?: string
          price?: number
          product_type?: string
          sessions?: number | null
          show_on_checkout?: boolean | null
          slug?: string
          sort_order?: number | null
          stripe_price_id?: string | null
          validity_days?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          is_preorder: boolean | null
          order_id: string
          preorder_note: string | null
          product_name: string
          product_variant_id: string | null
          quantity: number
          sku: string | null
          tenant_id: string
          total_price: number
          unit_price: number
          variant_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_preorder?: boolean | null
          order_id: string
          preorder_note?: string | null
          product_name: string
          product_variant_id?: string | null
          quantity: number
          sku?: string | null
          tenant_id: string
          total_price: number
          unit_price: number
          variant_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_preorder?: boolean | null
          order_id?: string
          preorder_note?: string | null
          product_name?: string
          product_variant_id?: string | null
          quantity?: number
          sku?: string | null
          tenant_id?: string
          total_price?: number
          unit_price?: number
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shop_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_addons: {
        Row: {
          applicable_to: Json | null
          billing_type: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          name: string
          price: number
          slug: string
          sort_order: number | null
        }
        Insert: {
          applicable_to?: Json | null
          billing_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          name: string
          price: number
          slug: string
          sort_order?: number | null
        }
        Update: {
          applicable_to?: Json | null
          billing_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          name?: string
          price?: number
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      plan_types: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json | null
          highlight_text: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          highlight_text?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          highlight_text?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      pricing_discounts: {
        Row: {
          created_at: string | null
          discount_id: string
          id: string
          override_amount: number | null
          override_percentage: number | null
          pricing_matrix_id: string
        }
        Insert: {
          created_at?: string | null
          discount_id: string
          id?: string
          override_amount?: number | null
          override_percentage?: number | null
          pricing_matrix_id: string
        }
        Update: {
          created_at?: string | null
          discount_id?: string
          id?: string
          override_amount?: number | null
          override_percentage?: number | null
          pricing_matrix_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_discounts_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_discounts_pricing_matrix_id_fkey"
            columns: ["pricing_matrix_id"]
            isOneToOne: false
            referencedRelation: "pricing_matrix"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_matrix: {
        Row: {
          age_group_id: string
          created_at: string | null
          duration_months: number
          highlight_text: string | null
          id: string
          includes_insurance: boolean | null
          is_active: boolean | null
          mollie_plan_id: string | null
          plan_type_id: string
          price: number
          price_per_month: number | null
          savings: number | null
          show_on_checkout: boolean | null
          stripe_price_id: string | null
        }
        Insert: {
          age_group_id: string
          created_at?: string | null
          duration_months: number
          highlight_text?: string | null
          id?: string
          includes_insurance?: boolean | null
          is_active?: boolean | null
          mollie_plan_id?: string | null
          plan_type_id: string
          price: number
          price_per_month?: number | null
          savings?: number | null
          show_on_checkout?: boolean | null
          stripe_price_id?: string | null
        }
        Update: {
          age_group_id?: string
          created_at?: string | null
          duration_months?: number
          highlight_text?: string | null
          id?: string
          includes_insurance?: boolean | null
          is_active?: boolean | null
          mollie_plan_id?: string | null
          plan_type_id?: string
          price?: number
          price_per_month?: number | null
          savings?: number | null
          show_on_checkout?: boolean | null
          stripe_price_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_matrix_age_group_id_fkey"
            columns: ["age_group_id"]
            isOneToOne: false
            referencedRelation: "age_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_matrix_plan_type_id_fkey"
            columns: ["plan_type_id"]
            isOneToOne: false
            referencedRelation: "plan_types"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          low_stock_alert: number | null
          name: string
          price_adjustment: number | null
          product_id: string
          size: string | null
          sku: string | null
          stock_quantity: number
          tenant_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          low_stock_alert?: number | null
          name: string
          price_adjustment?: number | null
          product_id: string
          size?: string | null
          sku?: string | null
          stock_quantity?: number
          tenant_id?: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          low_stock_alert?: number | null
          name?: string
          price_adjustment?: number | null
          product_id?: string
          size?: string | null
          sku?: string | null
          stock_quantity?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allow_preorder: boolean | null
          availability_status: string
          base_price: number
          category: string
          created_at: string | null
          description: string
          featured: boolean | null
          featured_image: string | null
          id: string
          images: string[]
          is_active: boolean | null
          name: string
          preorder_discount_percent: number | null
          preorder_note: string | null
          presale_ends_at: string | null
          presale_price: number | null
          seo_slug: string
          tenant_id: string
          updated_at: string | null
          video_thumbnail: string | null
          video_url: string | null
        }
        Insert: {
          allow_preorder?: boolean | null
          availability_status?: string
          base_price: number
          category: string
          created_at?: string | null
          description: string
          featured?: boolean | null
          featured_image?: string | null
          id?: string
          images?: string[]
          is_active?: boolean | null
          name: string
          preorder_discount_percent?: number | null
          preorder_note?: string | null
          presale_ends_at?: string | null
          presale_price?: number | null
          seo_slug: string
          tenant_id?: string
          updated_at?: string | null
          video_thumbnail?: string | null
          video_url?: string | null
        }
        Update: {
          allow_preorder?: boolean | null
          availability_status?: string
          base_price?: number
          category?: string
          created_at?: string | null
          description?: string
          featured?: boolean | null
          featured_image?: string | null
          id?: string
          images?: string[]
          is_active?: boolean | null
          name?: string
          preorder_discount_percent?: number | null
          preorder_note?: string | null
          presale_ends_at?: string | null
          presale_price?: number | null
          seo_slug?: string
          tenant_id?: string
          updated_at?: string | null
          video_thumbnail?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      reservations: {
        Row: {
          cancelled_at: string | null
          checked_in_at: string | null
          class_id: string
          created_at: string | null
          id: string
          member_id: string
          reservation_date: string
          status: string | null
        }
        Insert: {
          cancelled_at?: string | null
          checked_in_at?: string | null
          class_id: string
          created_at?: string | null
          id?: string
          member_id: string
          reservation_date: string
          status?: string | null
        }
        Update: {
          cancelled_at?: string | null
          checked_in_at?: string | null
          class_id?: string
          created_at?: string | null
          id?: string
          member_id?: string
          reservation_date?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_retention_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
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
      shipping_settings: {
        Row: {
          created_at: string | null
          free_shipping_threshold: number | null
          id: string
          pickup_enabled: boolean | null
          pickup_location: string | null
          shipping_cost: number | null
          shipping_enabled: boolean | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          free_shipping_threshold?: number | null
          id?: string
          pickup_enabled?: boolean | null
          pickup_location?: string | null
          shipping_cost?: number | null
          shipping_enabled?: boolean | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          free_shipping_threshold?: number | null
          id?: string
          pickup_enabled?: boolean | null
          pickup_location?: string | null
          shipping_cost?: number | null
          shipping_enabled?: boolean | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      shop_banners: {
        Row: {
          background_color: string | null
          badge_text: string | null
          created_at: string | null
          created_by: string | null
          cta_link: string | null
          cta_text: string | null
          ends_at: string | null
          id: string
          image_alt: string | null
          image_url: string
          image_url_mobile: string | null
          is_active: boolean | null
          overlay_opacity: number | null
          position: number | null
          slug: string | null
          starts_at: string | null
          subtitle: string | null
          tenant_id: string
          text_color: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          background_color?: string | null
          badge_text?: string | null
          created_at?: string | null
          created_by?: string | null
          cta_link?: string | null
          cta_text?: string | null
          ends_at?: string | null
          id?: string
          image_alt?: string | null
          image_url: string
          image_url_mobile?: string | null
          is_active?: boolean | null
          overlay_opacity?: number | null
          position?: number | null
          slug?: string | null
          starts_at?: string | null
          subtitle?: string | null
          tenant_id: string
          text_color?: string | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          background_color?: string | null
          badge_text?: string | null
          created_at?: string | null
          created_by?: string | null
          cta_link?: string | null
          cta_text?: string | null
          ends_at?: string | null
          id?: string
          image_alt?: string | null
          image_url?: string
          image_url_mobile?: string | null
          is_active?: boolean | null
          overlay_opacity?: number | null
          position?: number | null
          slug?: string | null
          starts_at?: string | null
          subtitle?: string | null
          tenant_id?: string
          text_color?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      shop_discount_codes: {
        Row: {
          code: string
          created_at: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_amount: number | null
          tenant_id: string
          times_used: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          tenant_id?: string
          times_used?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          tenant_id?: string
          times_used?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      shop_order_items: {
        Row: {
          created_at: string | null
          id: string
          is_preorder: boolean | null
          order_id: string
          preorder_note: string | null
          product_name: string
          product_variant_id: string | null
          quantity: number
          sku: string | null
          total_price: number
          unit_price: number
          variant_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_preorder?: boolean | null
          order_id: string
          preorder_note?: string | null
          product_name: string
          product_variant_id?: string | null
          quantity?: number
          sku?: string | null
          total_price: number
          unit_price: number
          variant_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_preorder?: boolean | null
          order_id?: string
          preorder_note?: string | null
          product_name?: string
          product_variant_id?: string | null
          quantity?: number
          sku?: string | null
          total_price?: number
          unit_price?: number
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shop_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_order_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_orders: {
        Row: {
          cancelled_at: string | null
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          delivered_at: string | null
          delivery_method: string | null
          discount_amount: number | null
          discount_code_id: string | null
          id: string
          mollie_payment_id: string | null
          notes: string | null
          order_number: string
          paid_at: string | null
          payment_id: string | null
          payment_provider: string | null
          payment_session_id: string | null
          ready_for_pickup_at: string | null
          shipped_at: string | null
          shipping_address: Json | null
          shipping_amount: number | null
          status: string
          subtotal_amount: number
          tenant_id: string
          total_amount: number
          tracking_number: string | null
          tracking_url: string | null
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          delivered_at?: string | null
          delivery_method?: string | null
          discount_amount?: number | null
          discount_code_id?: string | null
          id?: string
          mollie_payment_id?: string | null
          notes?: string | null
          order_number: string
          paid_at?: string | null
          payment_id?: string | null
          payment_provider?: string | null
          payment_session_id?: string | null
          ready_for_pickup_at?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_amount?: number | null
          status?: string
          subtotal_amount: number
          tenant_id: string
          total_amount: number
          tracking_number?: string | null
          tracking_url?: string | null
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          delivered_at?: string | null
          delivery_method?: string | null
          discount_amount?: number | null
          discount_code_id?: string | null
          id?: string
          mollie_payment_id?: string | null
          notes?: string | null
          order_number?: string
          paid_at?: string | null
          payment_id?: string | null
          payment_provider?: string | null
          payment_session_id?: string | null
          ready_for_pickup_at?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_amount?: number | null
          status?: string
          subtotal_amount?: number
          tenant_id?: string
          total_amount?: number
          tracking_number?: string | null
          tracking_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_orders_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_adjustments: {
        Row: {
          adjusted_by_email: string | null
          adjustment_reason: string | null
          created_at: string | null
          id: string
          new_quantity: number
          notes: string | null
          old_quantity: number
          order_id: string | null
          product_variant_id: string
          tenant_id: string
        }
        Insert: {
          adjusted_by_email?: string | null
          adjustment_reason?: string | null
          created_at?: string | null
          id?: string
          new_quantity: number
          notes?: string | null
          old_quantity: number
          order_id?: string | null
          product_variant_id: string
          tenant_id: string
        }
        Update: {
          adjusted_by_email?: string | null
          adjustment_reason?: string | null
          created_at?: string | null
          id?: string
          new_quantity?: number
          notes?: string | null
          old_quantity?: number
          order_id?: string | null
          product_variant_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_adjustments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shop_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_adjustments_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_adjustments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_addons: {
        Row: {
          addon_id: string
          created_at: string | null
          end_date: string | null
          id: string
          price_paid: number
          start_date: string
          subscription_id: string
        }
        Insert: {
          addon_id: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          price_paid: number
          start_date: string
          subscription_id: string
        }
        Update: {
          addon_id?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          price_paid?: number
          start_date?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_addons_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "plan_addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_addons_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "member_subscriptions"
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
      tenant_admins: {
        Row: {
          accepted_at: string | null
          email: string
          id: string
          invited_at: string | null
          is_active: boolean | null
          name: string | null
          role: string
          tenant_id: string
        }
        Insert: {
          accepted_at?: string | null
          email: string
          id?: string
          invited_at?: string | null
          is_active?: boolean | null
          name?: string | null
          role?: string
          tenant_id: string
        }
        Update: {
          accepted_at?: string | null
          email?: string
          id?: string
          invited_at?: string | null
          is_active?: boolean | null
          name?: string | null
          role?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_admins_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_module_subscriptions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          module_id: string | null
          started_at: string | null
          status: string
          tenant_id: string
          trial_ends_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          module_id?: string | null
          started_at?: string | null
          status?: string
          tenant_id: string
          trial_ends_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          module_id?: string | null
          started_at?: string | null
          status?: string
          tenant_id?: string
          trial_ends_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_module_subscriptions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_payment_configs: {
        Row: {
          created_at: string | null
          currency: string | null
          id: string
          is_active: boolean | null
          is_test_mode: boolean | null
          mollie_api_key: string | null
          mollie_profile_id: string | null
          provider: string
          stripe_publishable_key: string | null
          stripe_secret_key: string | null
          stripe_webhook_secret: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          is_test_mode?: boolean | null
          mollie_api_key?: string | null
          mollie_profile_id?: string | null
          provider: string
          stripe_publishable_key?: string | null
          stripe_secret_key?: string | null
          stripe_webhook_secret?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          is_test_mode?: boolean | null
          mollie_api_key?: string | null
          mollie_profile_id?: string | null
          provider?: string
          stripe_publishable_key?: string | null
          stripe_secret_key?: string | null
          stripe_webhook_secret?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_payment_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          contact_email: string
          contact_phone: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          primary_color: string | null
          slug: string
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          contact_email: string
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          primary_color?: string | null
          slug: string
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          contact_email?: string
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          slug?: string
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
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
      active_shop_banners: {
        Row: {
          background_color: string | null
          badge_text: string | null
          created_at: string | null
          created_by: string | null
          cta_link: string | null
          cta_text: string | null
          ends_at: string | null
          id: string | null
          image_alt: string | null
          image_url: string | null
          image_url_mobile: string | null
          is_active: boolean | null
          overlay_opacity: number | null
          position: number | null
          slug: string | null
          starts_at: string | null
          subtitle: string | null
          tenant_id: string | null
          text_color: string | null
          title: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          background_color?: string | null
          badge_text?: string | null
          created_at?: string | null
          created_by?: string | null
          cta_link?: string | null
          cta_text?: string | null
          ends_at?: string | null
          id?: string | null
          image_alt?: string | null
          image_url?: string | null
          image_url_mobile?: string | null
          is_active?: boolean | null
          overlay_opacity?: number | null
          position?: number | null
          slug?: string | null
          starts_at?: string | null
          subtitle?: string | null
          tenant_id?: string | null
          text_color?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          background_color?: string | null
          badge_text?: string | null
          created_at?: string | null
          created_by?: string | null
          cta_link?: string | null
          cta_text?: string | null
          ends_at?: string | null
          id?: string | null
          image_alt?: string | null
          image_url?: string | null
          image_url_mobile?: string | null
          is_active?: boolean | null
          overlay_opacity?: number | null
          position?: number | null
          slug?: string | null
          starts_at?: string | null
          subtitle?: string | null
          tenant_id?: string | null
          text_color?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
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
      member_belt_summary: {
        Row: {
          belt_color: string | null
          belt_updated_at: string | null
          dan_grade: number | null
          discipline_color: string | null
          discipline_id: string | null
          discipline_name: string | null
          discipline_slug: string | null
          has_belt_system: boolean | null
          member_id: string | null
          stripes: number | null
          training_count: number | null
          trainings_since_promotion: number | null
        }
        Relationships: [
          {
            foreignKeyName: "member_belts_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_belts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_retention_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_belts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
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
      add_credits: {
        Args: {
          p_amount: number
          p_description: string
          p_reference_id?: string
          p_type: string
          p_user_id: string
        }
        Returns: number
      }
      check_import_duplicates: {
        Args: { p_emails: string[] }
        Returns: {
          confidence: number
          existing_email: string
          existing_first_name: string
          existing_last_name: string
          existing_member_id: string
          input_index: number
          match_type: string
        }[]
      }
      create_profile_on_signup: {
        Args: {
          p_auth_user_id: string
          p_display_name?: string
          p_email: string
        }
        Returns: string
      }
      decrease_variant_stock: {
        Args: { p_quantity: number; p_variant_id: string }
        Returns: boolean
      }
      deduct_credits: {
        Args: {
          p_amount: number
          p_description: string
          p_reference_id?: string
          p_user_id: string
        }
        Returns: boolean
      }
      find_duplicate_members: {
        Args: never
        Returns: {
          confidence: number
          created_at: string
          email: string
          first_name: string
          group_id: number
          has_subscription: boolean
          is_recommended_master: boolean
          last_name: string
          match_type: string
          member_id: string
          phone: string
          profile_completeness: number
          total_checkins: number
        }[]
      }
      generate_order_number: { Args: { p_tenant_id: string }; Returns: string }
      generate_shop_order_number: { Args: never; Returns: string }
      get_my_role: { Args: never; Returns: string }
      get_tenant_modules: {
        Args: { p_tenant_id: string }
        Returns: {
          external_url: string
          icon: string
          is_core: boolean
          module_id: string
          name: string
          slug: string
          status: string
          trial_ends_at: string
        }[]
      }
      get_training_count: {
        Args: { p_discipline_id?: string; p_member_id: string }
        Returns: number
      }
      get_trainings_since_promotion: {
        Args: { p_discipline_id: string; p_member_id: string }
        Returns: number
      }
      get_user_tenant_ids: { Args: never; Returns: string[] }
      has_module_access: {
        Args: { p_module_slug: string; p_tenant_id: string }
        Returns: boolean
      }
      is_tenant_owner: { Args: { check_tenant_id: string }; Returns: boolean }
      merge_duplicate_members: {
        Args: { p_duplicate_ids: string[]; p_master_id: string }
        Returns: Json
      }
      restore_variant_stock: {
        Args: { p_quantity: number; p_variant_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      duplicate_match: {
        member_id: string | null
        match_type: string | null
        confidence: number | null
        first_name: string | null
        last_name: string | null
        email: string | null
        phone: string | null
        has_subscription: boolean | null
        total_checkins: number | null
        created_at: string | null
      }
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
