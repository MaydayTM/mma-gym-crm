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
      account_claim_tokens: {
        Row: {
          claimed_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          member_id: string
          token_hash: string
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          member_id: string
          token_hash: string
        }
        Update: {
          claimed_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          member_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_claim_tokens_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_claim_tokens_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_upcoming"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_claim_tokens_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_retention_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_claim_tokens_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
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
            referencedRelation: "gymscreen_birthdays_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_upcoming"
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
            referencedRelation: "gymscreen_birthdays_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_upcoming"
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
      ai_conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          query_type: string | null
          role: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          query_type?: string | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          query_type?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "gymscreen_birthdays_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "belt_history_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_upcoming"
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
            referencedRelation: "gymscreen_birthdays_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "belt_history_promoted_by_fkey"
            columns: ["promoted_by"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_upcoming"
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
            referencedRelation: "gymscreen_birthdays_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_upcoming"
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
            referencedRelation: "gymscreen_birthdays_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_upcoming"
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
            referencedRelation: "gymscreen_birthdays_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_sessions_created_member_id_fkey"
            columns: ["created_member_id"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_upcoming"
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
            referencedRelation: "gymscreen_birthdays_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_instances_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_upcoming"
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
      class_tracks: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
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
          room_id: string | null
          start_date: string | null
          start_time: string
          track_id: string | null
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
          room_id?: string | null
          start_date?: string | null
          start_time: string
          track_id?: string | null
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
          room_id?: string | null
          start_date?: string | null
          start_time?: string
          track_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_upcoming"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "classes_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "class_tracks"
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
      creative_fighter_lifetime_purchases: {
        Row: {
          amount_cents: number
          auth_user_id: string | null
          created_at: string | null
          currency: string | null
          id: string
          status: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          auth_user_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          auth_user_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creative_fighter_lifetime_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "creative_fighter_profiles"
            referencedColumns: ["id"]
          },
        ]
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
          has_lifetime_access: boolean | null
          id: string
          lifetime_purchased_at: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          credits?: number | null
          display_name?: string | null
          email: string
          has_lifetime_access?: boolean | null
          id?: string
          lifetime_purchased_at?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          credits?: number | null
          display_name?: string | null
          email?: string
          has_lifetime_access?: boolean | null
          id?: string
          lifetime_purchased_at?: string | null
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
      door_access_logs: {
        Row: {
          allowed: boolean
          created_at: string | null
          denial_reason: string | null
          door_location: string | null
          id: string
          member_id: string | null
          qr_token_hash: string | null
          scanned_at: string | null
        }
        Insert: {
          allowed: boolean
          created_at?: string | null
          denial_reason?: string | null
          door_location?: string | null
          id?: string
          member_id?: string | null
          qr_token_hash?: string | null
          scanned_at?: string | null
        }
        Update: {
          allowed?: boolean
          created_at?: string | null
          denial_reason?: string | null
          door_location?: string | null
          id?: string
          member_id?: string | null
          qr_token_hash?: string | null
          scanned_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "door_access_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "door_access_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_upcoming"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "door_access_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_retention_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "door_access_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      doors: {
        Row: {
          created_at: string | null
          esp32_device_id: string | null
          id: string
          is_active: boolean | null
          last_seen_at: string | null
          location: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          esp32_device_id?: string | null
          id?: string
          is_active?: boolean | null
          last_seen_at?: string | null
          location?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          esp32_device_id?: string | null
          id?: string
          is_active?: boolean | null
          last_seen_at?: string | null
          location?: string | null
          name?: string
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          audience_count: number | null
          audience_filter: Json | null
          body_html: string | null
          body_text: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          custom_recipients: string[] | null
          description: string | null
          id: string
          name: string
          scheduled_at: string | null
          started_at: string | null
          status: string | null
          subject: string | null
          template_id: string | null
          total_bounced: number | null
          total_clicked: number | null
          total_complained: number | null
          total_delivered: number | null
          total_opened: number | null
          total_recipients: number | null
          total_sent: number | null
          total_unsubscribed: number | null
          updated_at: string | null
        }
        Insert: {
          audience_count?: number | null
          audience_filter?: Json | null
          body_html?: string | null
          body_text?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_recipients?: string[] | null
          description?: string | null
          id?: string
          name: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
          subject?: string | null
          template_id?: string | null
          total_bounced?: number | null
          total_clicked?: number | null
          total_complained?: number | null
          total_delivered?: number | null
          total_opened?: number | null
          total_recipients?: number | null
          total_sent?: number | null
          total_unsubscribed?: number | null
          updated_at?: string | null
        }
        Update: {
          audience_count?: number | null
          audience_filter?: Json | null
          body_html?: string | null
          body_text?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_recipients?: string[] | null
          description?: string | null
          id?: string
          name?: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
          subject?: string | null
          template_id?: string | null
          total_bounced?: number | null
          total_clicked?: number | null
          total_complained?: number | null
          total_delivered?: number | null
          total_opened?: number | null
          total_recipients?: number | null
          total_sent?: number | null
          total_unsubscribed?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_upcoming"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "member_retention_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_events: {
        Row: {
          clicked_url: string | null
          created_at: string | null
          event_type: string
          id: string
          ip_address: unknown
          raw_payload: Json | null
          send_id: string | null
          user_agent: string | null
        }
        Insert: {
          clicked_url?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          raw_payload?: Json | null
          send_id?: string | null
          user_agent?: string | null
        }
        Update: {
          clicked_url?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          raw_payload?: Json | null
          send_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_events_send_id_fkey"
            columns: ["send_id"]
            isOneToOne: false
            referencedRelation: "email_sends"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sends: {
        Row: {
          campaign_id: string | null
          click_count: number | null
          created_at: string | null
          delivered_at: string | null
          error_code: string | null
          error_message: string | null
          first_clicked_at: string | null
          first_opened_at: string | null
          id: string
          last_opened_at: string | null
          member_id: string | null
          open_count: number | null
          provider: string | null
          provider_message_id: string | null
          queued_at: string | null
          recipient_email: string
          recipient_name: string | null
          sent_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          click_count?: number | null
          created_at?: string | null
          delivered_at?: string | null
          error_code?: string | null
          error_message?: string | null
          first_clicked_at?: string | null
          first_opened_at?: string | null
          id?: string
          last_opened_at?: string | null
          member_id?: string | null
          open_count?: number | null
          provider?: string | null
          provider_message_id?: string | null
          queued_at?: string | null
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          click_count?: number | null
          created_at?: string | null
          delivered_at?: string | null
          error_code?: string | null
          error_message?: string | null
          first_clicked_at?: string | null
          first_opened_at?: string | null
          id?: string
          last_opened_at?: string | null
          member_id?: string | null
          open_count?: number | null
          provider?: string | null
          provider_message_id?: string | null
          queued_at?: string | null
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sends_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sends_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_upcoming"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sends_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_retention_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sends_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          available_variables: string[] | null
          body_html: string
          body_text: string | null
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          preview_text: string | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          available_variables?: string[] | null
          body_html: string
          body_text?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          preview_text?: string | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          available_variables?: string[] | null
          body_html?: string
          body_text?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          preview_text?: string | null
          subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_upcoming"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "member_retention_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      email_unsubscribes: {
        Row: {
          created_at: string | null
          email: string
          id: string
          member_id: string | null
          reason: string | null
          unsubscribed_from_campaign_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          member_id?: string | null
          reason?: string | null
          unsubscribed_from_campaign_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          member_id?: string | null
          reason?: string | null
          unsubscribed_from_campaign_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_unsubscribes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_unsubscribes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_upcoming"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_unsubscribes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_retention_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_unsubscribes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_unsubscribes_unsubscribed_from_campaign_id_fkey"
            columns: ["unsubscribed_from_campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "gymscreen_birthdays_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "gymscreen_birthdays_upcoming"
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
      gym_access_settings: {
        Row: {
          access_mode: string
          created_at: string
          grace_period_minutes: number
          id: string
          minutes_before_class: number
          open_gym_hours: Json
          team_roles_bypass: boolean
          tenant_id: string
          updated_at: string
        }
        Insert: {
          access_mode?: string
          created_at?: string
          grace_period_minutes?: number
          id?: string
          minutes_before_class?: number
          open_gym_hours?: Json
          team_roles_bypass?: boolean
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          access_mode?: string
          created_at?: string
          grace_period_minutes?: number
          id?: string
          minutes_before_class?: number
          open_gym_hours?: Json
          team_roles_bypass?: boolean
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      gymscreen_settings: {
        Row: {
          api_key: string | null
          birthday_display_days: number | null
          created_at: string | null
          id: string
          logo_url: string | null
          section_order: string[] | null
          section_rotation_interval: number | null
          show_announcements: boolean | null
          show_belt_wall: boolean | null
          show_birthdays: boolean | null
          show_clock: boolean | null
          show_logo: boolean | null
          show_shop_banners: boolean | null
          show_slideshow: boolean | null
          slideshow_interval: number | null
          tenant_id: string | null
          theme: string | null
          updated_at: string | null
        }
        Insert: {
          api_key?: string | null
          birthday_display_days?: number | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          section_order?: string[] | null
          section_rotation_interval?: number | null
          show_announcements?: boolean | null
          show_belt_wall?: boolean | null
          show_birthdays?: boolean | null
          show_clock?: boolean | null
          show_logo?: boolean | null
          show_shop_banners?: boolean | null
          show_slideshow?: boolean | null
          slideshow_interval?: number | null
          tenant_id?: string | null
          theme?: string | null
          updated_at?: string | null
        }
        Update: {
          api_key?: string | null
          birthday_display_days?: number | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          section_order?: string[] | null
          section_rotation_interval?: number | null
          show_announcements?: boolean | null
          show_belt_wall?: boolean | null
          show_birthdays?: boolean | null
          show_clock?: boolean | null
          show_logo?: boolean | null
          show_shop_banners?: boolean | null
          show_slideshow?: boolean | null
          slideshow_interval?: number | null
          tenant_id?: string | null
          theme?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gymscreen_slides: {
        Row: {
          caption: string | null
          category: string | null
          created_at: string | null
          display_duration: number | null
          end_date: string | null
          id: string
          image_url: string
          is_active: boolean | null
          sort_order: number | null
          start_date: string | null
          title: string | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          category?: string | null
          created_at?: string | null
          display_duration?: number | null
          end_date?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          sort_order?: number | null
          start_date?: string | null
          title?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          category?: string | null
          created_at?: string | null
          display_duration?: number | null
          end_date?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          sort_order?: number | null
          start_date?: string | null
          title?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gymscreen_slides_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gymscreen_slides_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_upcoming"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gymscreen_slides_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "member_retention_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gymscreen_slides_uploaded_by_fkey"
            columns: ["uploaded_by"]
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
            referencedRelation: "gymscreen_birthdays_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_upcoming"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "gymscreen_birthdays_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_converted_member_id_fkey"
            columns: ["converted_member_id"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_upcoming"
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
            referencedRelation: "gymscreen_birthdays_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_belts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_upcoming"
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
          notes: string | null
          one_time_product_id: string | null
          payment_provider: string | null
          payment_status: string | null
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
          notes?: string | null
          one_time_product_id?: string | null
          payment_provider?: string | null
          payment_status?: string | null
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
          notes?: string | null
          one_time_product_id?: string | null
          payment_provider?: string | null
          payment_status?: string | null
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
            referencedRelation: "gymscreen_birthdays_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_subscriptions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_upcoming"
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
          door_access_enabled: boolean | null
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
          qr_token: string | null
          qr_token_hash: string | null
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
          door_access_enabled?: boolean | null
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
          qr_token?: string | null
          qr_token_hash?: string | null
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
          door_access_enabled?: boolean | null
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
          qr_token?: string | null
          qr_token_hash?: string | null
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
          updated_at: string | null
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
          updated_at?: string | null
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
          updated_at?: string | null
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
            referencedRelation: "gymscreen_birthdays_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_upcoming"
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
            referencedRelation: "gymscreen_birthdays_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_upcoming"
            referencedColumns: ["id"]
          },
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
      rooms: {
        Row: {
          capacity: number | null
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sc_athletes: {
        Row: {
          anaerobic_threshold_hr: number | null
          coach_id: string | null
          created_at: string | null
          date_of_birth: string | null
          fitness_level: Database["public"]["Enums"]["sc_fitness_level"]
          id: string
          max_hr: number | null
          resting_hr: number | null
          sport_detail: string | null
          track_id: Database["public"]["Enums"]["sc_track_id"]
          updated_at: string | null
          weight_kg: number | null
        }
        Insert: {
          anaerobic_threshold_hr?: number | null
          coach_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          fitness_level?: Database["public"]["Enums"]["sc_fitness_level"]
          id: string
          max_hr?: number | null
          resting_hr?: number | null
          sport_detail?: string | null
          track_id?: Database["public"]["Enums"]["sc_track_id"]
          updated_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          anaerobic_threshold_hr?: number | null
          coach_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          fitness_level?: Database["public"]["Enums"]["sc_fitness_level"]
          id?: string
          max_hr?: number | null
          resting_hr?: number | null
          sport_detail?: string | null
          track_id?: Database["public"]["Enums"]["sc_track_id"]
          updated_at?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sc_athletes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "sc_coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      sc_coaches: {
        Row: {
          created_at: string | null
          id: string
          organization: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          organization?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          organization?: string | null
        }
        Relationships: []
      }
      sc_conditioning_methods_ref: {
        Row: {
          category: string
          energy_system: string
          goal: string
          id: string
          intensity_level: number
          logic: Json
          name: string
          ui_cues: string[]
        }
        Insert: {
          category: string
          energy_system: string
          goal: string
          id: string
          intensity_level: number
          logic: Json
          name: string
          ui_cues: string[]
        }
        Update: {
          category?: string
          energy_system?: string
          goal?: string
          id?: string
          intensity_level?: number
          logic?: Json
          name?: string
          ui_cues?: string[]
        }
        Relationships: []
      }
      sc_exercises: {
        Row: {
          category: Database["public"]["Enums"]["sc_exercise_category"]
          coach_id: string
          created_at: string | null
          description: string | null
          equipment: string[] | null
          id: string
          image_url: string | null
          instructions: string | null
          is_archived: boolean | null
          name: string
          primary_muscles: Database["public"]["Enums"]["sc_muscle_group"][]
          secondary_muscles:
            | Database["public"]["Enums"]["sc_muscle_group"][]
            | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["sc_exercise_category"]
          coach_id: string
          created_at?: string | null
          description?: string | null
          equipment?: string[] | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_archived?: boolean | null
          name: string
          primary_muscles?: Database["public"]["Enums"]["sc_muscle_group"][]
          secondary_muscles?:
            | Database["public"]["Enums"]["sc_muscle_group"][]
            | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["sc_exercise_category"]
          coach_id?: string
          created_at?: string | null
          description?: string | null
          equipment?: string[] | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_archived?: boolean | null
          name?: string
          primary_muscles?: Database["public"]["Enums"]["sc_muscle_group"][]
          secondary_muscles?:
            | Database["public"]["Enums"]["sc_muscle_group"][]
            | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      sc_hrv_readings: {
        Row: {
          athlete_id: string
          created_at: string | null
          date: string
          hrv_ms: number
          id: string
          recovery_zone: Database["public"]["Enums"]["sc_recovery_zone"]
          resting_hr: number
          score: number
          source: Database["public"]["Enums"]["sc_hrv_source"]
        }
        Insert: {
          athlete_id: string
          created_at?: string | null
          date: string
          hrv_ms: number
          id?: string
          recovery_zone: Database["public"]["Enums"]["sc_recovery_zone"]
          resting_hr: number
          score: number
          source?: Database["public"]["Enums"]["sc_hrv_source"]
        }
        Update: {
          athlete_id?: string
          created_at?: string | null
          date?: string
          hrv_ms?: number
          id?: string
          recovery_zone?: Database["public"]["Enums"]["sc_recovery_zone"]
          resting_hr?: number
          score?: number
          source?: Database["public"]["Enums"]["sc_hrv_source"]
        }
        Relationships: [
          {
            foreignKeyName: "sc_hrv_readings_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "sc_athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_hrv_readings_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "sc_athletes_view"
            referencedColumns: ["id"]
          },
        ]
      }
      sc_mesocycles: {
        Row: {
          created_at: string | null
          duration_weeks: number
          focus: string | null
          id: string
          name: string
          order: number
          program_id: string
          week_template_id: string
        }
        Insert: {
          created_at?: string | null
          duration_weeks: number
          focus?: string | null
          id?: string
          name: string
          order: number
          program_id: string
          week_template_id: string
        }
        Update: {
          created_at?: string | null
          duration_weeks?: number
          focus?: string | null
          id?: string
          name?: string
          order?: number
          program_id?: string
          week_template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sc_mesocycles_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "sc_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      sc_method_exercises: {
        Row: {
          coach_id: string
          created_at: string | null
          default_load: string | null
          default_reps: string | null
          default_rest_sec: number | null
          default_sets: number | null
          default_tempo: string | null
          exercise_id: string
          id: string
          method_id: string
          notes: string | null
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string | null
          default_load?: string | null
          default_reps?: string | null
          default_rest_sec?: number | null
          default_sets?: number | null
          default_tempo?: string | null
          exercise_id: string
          id?: string
          method_id: string
          notes?: string | null
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string | null
          default_load?: string | null
          default_reps?: string | null
          default_rest_sec?: number | null
          default_sets?: number | null
          default_tempo?: string | null
          exercise_id?: string
          id?: string
          method_id?: string
          notes?: string | null
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sc_method_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "sc_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_method_exercises_method_id_fkey"
            columns: ["method_id"]
            isOneToOne: false
            referencedRelation: "sc_conditioning_methods_ref"
            referencedColumns: ["id"]
          },
        ]
      }
      sc_microcycles: {
        Row: {
          created_at: string | null
          id: string
          mesocycle_id: string
          week_number: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          mesocycle_id: string
          week_number: number
        }
        Update: {
          created_at?: string | null
          id?: string
          mesocycle_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "sc_microcycles_mesocycle_id_fkey"
            columns: ["mesocycle_id"]
            isOneToOne: false
            referencedRelation: "sc_mesocycles"
            referencedColumns: ["id"]
          },
        ]
      }
      sc_program_templates: {
        Row: {
          coach_id: string
          created_at: string | null
          description: string | null
          duration_weeks: number
          id: string
          is_public: boolean
          name: string
          track_id: Database["public"]["Enums"]["sc_track_id"]
          updated_at: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string | null
          description?: string | null
          duration_weeks: number
          id?: string
          is_public?: boolean
          name: string
          track_id: Database["public"]["Enums"]["sc_track_id"]
          updated_at?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string | null
          description?: string | null
          duration_weeks?: number
          id?: string
          is_public?: boolean
          name?: string
          track_id?: Database["public"]["Enums"]["sc_track_id"]
          updated_at?: string | null
        }
        Relationships: []
      }
      sc_programs: {
        Row: {
          athlete_id: string
          coach_id: string
          created_at: string | null
          end_date: string
          id: string
          name: string
          start_date: string
          status: Database["public"]["Enums"]["sc_program_status"]
          track_id: Database["public"]["Enums"]["sc_track_id"]
          updated_at: string | null
        }
        Insert: {
          athlete_id: string
          coach_id: string
          created_at?: string | null
          end_date: string
          id?: string
          name: string
          start_date: string
          status?: Database["public"]["Enums"]["sc_program_status"]
          track_id: Database["public"]["Enums"]["sc_track_id"]
          updated_at?: string | null
        }
        Update: {
          athlete_id?: string
          coach_id?: string
          created_at?: string | null
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          status?: Database["public"]["Enums"]["sc_program_status"]
          track_id?: Database["public"]["Enums"]["sc_track_id"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sc_programs_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "sc_athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_programs_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "sc_athletes_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_programs_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "sc_coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      sc_session_exercises: {
        Row: {
          coach_id: string
          created_at: string | null
          exercise_id: string
          id: string
          load: string | null
          method_id: string | null
          notes: string | null
          reps: string | null
          rest_sec: number | null
          session_id: string
          sets: number | null
          sort_order: number
          status: string
          tempo: string | null
          updated_at: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string | null
          exercise_id: string
          id?: string
          load?: string | null
          method_id?: string | null
          notes?: string | null
          reps?: string | null
          rest_sec?: number | null
          session_id: string
          sets?: number | null
          sort_order?: number
          status?: string
          tempo?: string | null
          updated_at?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string | null
          exercise_id?: string
          id?: string
          load?: string | null
          method_id?: string | null
          notes?: string | null
          reps?: string | null
          rest_sec?: number | null
          session_id?: string
          sets?: number | null
          sort_order?: number
          status?: string
          tempo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sc_session_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "sc_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_session_exercises_method_id_fkey"
            columns: ["method_id"]
            isOneToOne: false
            referencedRelation: "sc_conditioning_methods_ref"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_session_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sc_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sc_sessions: {
        Row: {
          autoregulation_override:
            | Database["public"]["Enums"]["sc_day_type"]
            | null
          coach_notes: string | null
          conditioning: Json
          cooldown: Json
          created_at: string | null
          date: string
          day_type: Database["public"]["Enums"]["sc_day_type"]
          id: string
          microcycle_id: string
          status: Database["public"]["Enums"]["sc_session_status"]
          strength: Json
          updated_at: string | null
          warmup: Json
        }
        Insert: {
          autoregulation_override?:
            | Database["public"]["Enums"]["sc_day_type"]
            | null
          coach_notes?: string | null
          conditioning?: Json
          cooldown?: Json
          created_at?: string | null
          date: string
          day_type: Database["public"]["Enums"]["sc_day_type"]
          id?: string
          microcycle_id: string
          status?: Database["public"]["Enums"]["sc_session_status"]
          strength?: Json
          updated_at?: string | null
          warmup?: Json
        }
        Update: {
          autoregulation_override?:
            | Database["public"]["Enums"]["sc_day_type"]
            | null
          coach_notes?: string | null
          conditioning?: Json
          cooldown?: Json
          created_at?: string | null
          date?: string
          day_type?: Database["public"]["Enums"]["sc_day_type"]
          id?: string
          microcycle_id?: string
          status?: Database["public"]["Enums"]["sc_session_status"]
          strength?: Json
          updated_at?: string | null
          warmup?: Json
        }
        Relationships: [
          {
            foreignKeyName: "sc_sessions_microcycle_id_fkey"
            columns: ["microcycle_id"]
            isOneToOne: false
            referencedRelation: "sc_microcycles"
            referencedColumns: ["id"]
          },
        ]
      }
      sc_template_mesocycles: {
        Row: {
          created_at: string | null
          duration_weeks: number
          focus: string | null
          id: string
          method_ids: string[]
          name: string
          order_index: number
          template_id: string
          week_template_id: string
        }
        Insert: {
          created_at?: string | null
          duration_weeks: number
          focus?: string | null
          id?: string
          method_ids?: string[]
          name: string
          order_index: number
          template_id: string
          week_template_id: string
        }
        Update: {
          created_at?: string | null
          duration_weeks?: number
          focus?: string | null
          id?: string
          method_ids?: string[]
          name?: string
          order_index?: number
          template_id?: string
          week_template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sc_template_mesocycles_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "sc_program_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      sc_user_roles: {
        Row: {
          created_at: string | null
          display_name: string | null
          sc_role: Database["public"]["Enums"]["sc_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          sc_role?: Database["public"]["Enums"]["sc_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          sc_role?: Database["public"]["Enums"]["sc_role"]
          user_id?: string
        }
        Relationships: []
      }
      sc_workout_logs: {
        Row: {
          athlete_id: string
          completed_at: string | null
          created_at: string | null
          date: string
          exercises_completed: Json
          hr_data: Json | null
          id: string
          notes: string | null
          rpe_rating: number | null
          session_id: string
          started_at: string
        }
        Insert: {
          athlete_id: string
          completed_at?: string | null
          created_at?: string | null
          date: string
          exercises_completed?: Json
          hr_data?: Json | null
          id?: string
          notes?: string | null
          rpe_rating?: number | null
          session_id: string
          started_at: string
        }
        Update: {
          athlete_id?: string
          completed_at?: string | null
          created_at?: string | null
          date?: string
          exercises_completed?: Json
          hr_data?: Json | null
          id?: string
          notes?: string | null
          rpe_rating?: number | null
          session_id?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sc_workout_logs_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "sc_athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_workout_logs_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "sc_athletes_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_workout_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sc_sessions"
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
            referencedRelation: "gymscreen_birthdays_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_upcoming"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "gymscreen_birthdays_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_upcoming"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "gymscreen_birthdays_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_upcoming"
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
            referencedRelation: "gymscreen_birthdays_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_upcoming"
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
      claim_account_stats: {
        Row: {
          claimed_accounts: number | null
          expired_tokens: number | null
          pending_tokens: number | null
          total_active_accounts: number | null
          unclaimed_members: number | null
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
      gymscreen_birthdays_today: {
        Row: {
          age: number | null
          birth_date: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          profile_picture_url: string | null
        }
        Insert: {
          age?: never
          birth_date?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          profile_picture_url?: string | null
        }
        Update: {
          age?: never
          birth_date?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          profile_picture_url?: string | null
        }
        Relationships: []
      }
      gymscreen_birthdays_upcoming: {
        Row: {
          age: number | null
          birth_date: string | null
          birthday_display: string | null
          days_until_birthday: number | null
          first_name: string | null
          id: string | null
          last_name: string | null
          profile_picture_url: string | null
        }
        Insert: {
          age?: never
          birth_date?: string | null
          birthday_display?: never
          days_until_birthday?: never
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          profile_picture_url?: string | null
        }
        Update: {
          age?: never
          birth_date?: string | null
          birthday_display?: never
          days_until_birthday?: never
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          profile_picture_url?: string | null
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
            referencedRelation: "gymscreen_birthdays_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_belts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_upcoming"
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
            referencedRelation: "gymscreen_birthdays_today"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "gymscreen_birthdays_upcoming"
            referencedColumns: ["id"]
          },
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
      sc_athletes_view: {
        Row: {
          coach_id: string | null
          created_at: string | null
          display_name: string | null
          fitness_level: Database["public"]["Enums"]["sc_fitness_level"] | null
          id: string | null
          max_hr: number | null
          resting_hr: number | null
          sport_detail: string | null
          track_id: Database["public"]["Enums"]["sc_track_id"] | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sc_athletes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "sc_coaches"
            referencedColumns: ["id"]
          },
        ]
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
      check_lifetime_access: {
        Args: { p_auth_user_id: string }
        Returns: boolean
      }
      check_member_door_access: {
        Args: { p_member_id: string }
        Returns: {
          allowed: boolean
          denial_reason: string
          member_name: string
        }[]
      }
      cleanup_expired_claim_tokens: { Args: never; Returns: number }
      create_claim_token: {
        Args: { p_email: string; p_expires_hours?: number; p_member_id: string }
        Returns: string
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
      find_member_for_claim: {
        Args: { p_identifier: string }
        Returns: {
          can_claim: boolean
          email: string
          first_name: string
          member_id: string
          reason: string
        }[]
      }
      generate_member_qr_token: {
        Args: { p_member_id: string }
        Returns: string
      }
      generate_order_number: { Args: { p_tenant_id: string }; Returns: string }
      generate_shop_order_number: { Args: never; Returns: string }
      get_active_slides: {
        Args: never
        Returns: {
          caption: string
          category: string
          display_duration: number
          id: string
          image_url: string
          title: string
        }[]
      }
      get_campaign_audience: {
        Args: { custom_member_ids?: string[]; filter_json?: Json }
        Returns: {
          email: string
          first_name: string
          last_name: string
          member_id: string
        }[]
      }
      get_churn_risk_members: {
        Args: never
        Returns: {
          avg_checkins_per_week: number
          days_since_checkin: number
          email: string
          first_name: string
          last_checkin: string
          last_name: string
          member_id: string
          risk_factors: string[]
          risk_score: number
          subscription_status: string
          total_checkins_last_90_days: number
        }[]
      }
      get_door_access_stats: {
        Args: { p_days?: number }
        Returns: {
          denied_scans: number
          successful_scans: number
          total_scans: number
          unique_members: number
        }[]
      }
      get_gym_stats: {
        Args: never
        Returns: {
          active_members: number
          avg_checkins_per_member: number
          cancelled_this_month: number
          checkins_last_month: number
          checkins_this_month: number
          new_members_this_month: number
          open_leads: number
        }[]
      }
      get_gymscreen_birthdays: {
        Args: { p_days_ahead?: number }
        Returns: {
          age: number
          birthday_display: string
          first_name: string
          id: string
          is_today: boolean
          last_name: string
          profile_picture_url: string
        }[]
      }
      get_leads_needing_followup: {
        Args: never
        Returns: {
          days_since_created: number
          days_since_last_contact: number
          email: string
          first_name: string
          interested_in: string[]
          last_name: string
          lead_id: string
          phone: string
          source: string
          status: string
          urgency: string
        }[]
      }
      get_member_access_logs: {
        Args: { p_limit?: number; p_member_id: string }
        Returns: {
          allowed: boolean
          denial_reason: string
          door_location: string
          id: string
          scanned_at: string
        }[]
      }
      get_period_comparison: {
        Args: {
          p_metric?: string
          p_period1_end?: string
          p_period1_start?: string
          p_period2_end?: string
          p_period2_start?: string
        }
        Returns: {
          change_absolute: number
          change_percentage: number
          period1_value: number
          period2_value: number
        }[]
      }
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
      get_training_leaderboard: {
        Args: { p_limit?: number; p_period?: string }
        Returns: {
          disciplines: string[]
          first_name: string
          last_name: string
          member_id: string
          rank: number
          total_checkins: number
        }[]
      }
      get_trainings_since_promotion: {
        Args: { p_discipline_id: string; p_member_id: string }
        Returns: number
      }
      get_user_tenant_ids: { Args: never; Returns: string[] }
      grant_lifetime_access: {
        Args: {
          p_amount_cents: number
          p_auth_user_id: string
          p_currency?: string
          p_stripe_payment_intent_id: string
          p_stripe_session_id: string
        }
        Returns: boolean
      }
      has_module_access: {
        Args: { p_module_slug: string; p_tenant_id: string }
        Returns: boolean
      }
      is_email_unsubscribed: { Args: { check_email: string }; Returns: boolean }
      is_member_publicly_visible: {
        Args: { member_row: Database["public"]["Tables"]["members"]["Row"] }
        Returns: boolean
      }
      is_tenant_owner: { Args: { check_tenant_id: string }; Returns: boolean }
      mark_token_claimed: { Args: { p_token: string }; Returns: boolean }
      merge_duplicate_members: {
        Args: { p_duplicate_ids: string[]; p_master_id: string }
        Returns: Json
      }
      restore_variant_stock: {
        Args: { p_quantity: number; p_variant_id: string }
        Returns: boolean
      }
      sc_create_athlete: {
        Args: {
          p_display_name: string
          p_email: string
          p_fitness_level?: Database["public"]["Enums"]["sc_fitness_level"]
          p_max_hr?: number
          p_resting_hr?: number
          p_track_id?: Database["public"]["Enums"]["sc_track_id"]
        }
        Returns: string
      }
      sc_is_coach_of_athlete: {
        Args: { p_athlete_id: string }
        Returns: boolean
      }
      sc_register_coach: {
        Args: { p_display_name: string }
        Returns: undefined
      }
      search_members_for_email: {
        Args: { result_limit?: number; search_query?: string }
        Returns: {
          email: string
          first_name: string
          is_unsubscribed: boolean
          last_name: string
          member_id: string
          status: string
        }[]
      }
      update_campaign_stats: {
        Args: { p_campaign_id: string }
        Returns: undefined
      }
      validate_qr_token: {
        Args: { p_token: string }
        Returns: {
          denial_reason: string
          is_valid: boolean
          member_id: string
          member_name: string
        }[]
      }
      verify_and_claim_token: {
        Args: { p_member_id: string; p_token: string }
        Returns: boolean
      }
      verify_claim_token: {
        Args: { p_token: string }
        Returns: {
          email: string
          error_reason: string
          first_name: string
          last_name: string
          member_id: string
          member_number: number
          profile_picture_url: string
          token_id: string
        }[]
      }
    }
    Enums: {
      sc_day_type: "DEV" | "STIM" | "HPRT" | "REST"
      sc_exercise_category:
        | "cardio"
        | "strength"
        | "power"
        | "flexibility"
        | "balance"
        | "plyometric"
        | "other"
      sc_fitness_level: "beginner" | "average" | "advanced"
      sc_hrv_source: "morpheus" | "apple_health" | "manual"
      sc_muscle_group:
        | "chest"
        | "back"
        | "shoulders"
        | "biceps"
        | "triceps"
        | "forearms"
        | "core"
        | "quads"
        | "hamstrings"
        | "glutes"
        | "calves"
        | "full_body"
        | "other"
      sc_program_status: "draft" | "active" | "completed" | "archived"
      sc_recovery_zone: "green" | "orange" | "red"
      sc_role: "coach" | "athlete" | "both"
      sc_session_status: "planned" | "in_progress" | "completed" | "skipped"
      sc_track_id:
        | "general"
        | "combat"
        | "tactical"
        | "strength"
        | "endurance"
        | "mixed"
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
    Enums: {
      sc_day_type: ["DEV", "STIM", "HPRT", "REST"],
      sc_exercise_category: [
        "cardio",
        "strength",
        "power",
        "flexibility",
        "balance",
        "plyometric",
        "other",
      ],
      sc_fitness_level: ["beginner", "average", "advanced"],
      sc_hrv_source: ["morpheus", "apple_health", "manual"],
      sc_muscle_group: [
        "chest",
        "back",
        "shoulders",
        "biceps",
        "triceps",
        "forearms",
        "core",
        "quads",
        "hamstrings",
        "glutes",
        "calves",
        "full_body",
        "other",
      ],
      sc_program_status: ["draft", "active", "completed", "archived"],
      sc_recovery_zone: ["green", "orange", "red"],
      sc_role: ["coach", "athlete", "both"],
      sc_session_status: ["planned", "in_progress", "completed", "skipped"],
      sc_track_id: [
        "general",
        "combat",
        "tactical",
        "strength",
        "endurance",
        "mixed",
      ],
    },
  },
} as const
