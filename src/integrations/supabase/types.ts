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
      community_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_friends: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      community_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          achievement_type: string
          badge: string | null
          content: string
          created_at: string
          id: string
          university_id: string | null
          user_id: string
        }
        Insert: {
          achievement_type: string
          badge?: string | null
          content: string
          created_at?: string
          id?: string
          university_id?: string | null
          user_id: string
        }
        Update: {
          achievement_type?: string
          badge?: string | null
          content?: string
          created_at?: string
          id?: string
          university_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      emails_log: {
        Row: {
          body: string | null
          created_at: string
          id: string
          reply_at: string | null
          sent_at: string | null
          status: string
          subject: string
          university_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          reply_at?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          university_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          reply_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          university_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_log_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          university_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          university_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          university_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_data: {
        Row: {
          budget_goal: number | null
          created_at: string
          currency: string | null
          current_savings: number | null
          id: string
          monthly_expenses: number | null
          monthly_income: number | null
          notes: string | null
          updated_at: string
          usd_rate_override: number | null
          user_id: string
        }
        Insert: {
          budget_goal?: number | null
          created_at?: string
          currency?: string | null
          current_savings?: number | null
          id?: string
          monthly_expenses?: number | null
          monthly_income?: number | null
          notes?: string | null
          updated_at?: string
          usd_rate_override?: number | null
          user_id: string
        }
        Update: {
          budget_goal?: number | null
          created_at?: string
          currency?: string | null
          current_savings?: number | null
          id?: string
          monthly_expenses?: number | null
          monthly_income?: number | null
          notes?: string | null
          updated_at?: string
          usd_rate_override?: number | null
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          category: string
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          impact: string | null
          is_focus: boolean | null
          progress: number
          status: string
          title: string
          updated_at: string
          urgency: string | null
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          impact?: string | null
          is_focus?: boolean | null
          progress?: number
          status?: string
          title: string
          updated_at?: string
          urgency?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          impact?: string | null
          is_focus?: boolean | null
          progress?: number
          status?: string
          title?: string
          updated_at?: string
          urgency?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      pipeline: {
        Row: {
          applied: boolean | null
          created_at: string
          email_sent: boolean | null
          id: string
          interest_level: string | null
          last_activity_at: string | null
          notes: string | null
          response_received: boolean | null
          status: string
          university_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          applied?: boolean | null
          created_at?: string
          email_sent?: boolean | null
          id?: string
          interest_level?: string | null
          last_activity_at?: string | null
          notes?: string | null
          response_received?: boolean | null
          status?: string
          university_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          applied?: boolean | null
          created_at?: string
          email_sent?: boolean | null
          id?: string
          interest_level?: string | null
          last_activity_at?: string | null
          notes?: string | null
          response_received?: boolean | null
          status?: string
          university_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          about: string | null
          age: number | null
          avatar_url: string | null
          budget_goal: number | null
          city: string | null
          commitment_level: string | null
          country: string | null
          created_at: string
          current_savings: number | null
          daily_time: string | null
          documents_progress: number | null
          education_level: string | null
          email: string
          english_level: string | null
          full_name: string
          has_passport: boolean | null
          has_transcript: boolean | null
          id: string
          ielts_score: number | null
          main_goal: string | null
          monthly_expenses: number | null
          monthly_focus: string | null
          monthly_income: number | null
          target_country: string | null
          toefl_score: number | null
          updated_at: string
          username: string
          willingness: string | null
        }
        Insert: {
          about?: string | null
          age?: number | null
          avatar_url?: string | null
          budget_goal?: number | null
          city?: string | null
          commitment_level?: string | null
          country?: string | null
          created_at?: string
          current_savings?: number | null
          daily_time?: string | null
          documents_progress?: number | null
          education_level?: string | null
          email: string
          english_level?: string | null
          full_name: string
          has_passport?: boolean | null
          has_transcript?: boolean | null
          id: string
          ielts_score?: number | null
          main_goal?: string | null
          monthly_expenses?: number | null
          monthly_focus?: string | null
          monthly_income?: number | null
          target_country?: string | null
          toefl_score?: number | null
          updated_at?: string
          username: string
          willingness?: string | null
        }
        Update: {
          about?: string | null
          age?: number | null
          avatar_url?: string | null
          budget_goal?: number | null
          city?: string | null
          commitment_level?: string | null
          country?: string | null
          created_at?: string
          current_savings?: number | null
          daily_time?: string | null
          documents_progress?: number | null
          education_level?: string | null
          email?: string
          english_level?: string | null
          full_name?: string
          has_passport?: boolean | null
          has_transcript?: boolean | null
          id?: string
          ielts_score?: number | null
          main_goal?: string | null
          monthly_expenses?: number | null
          monthly_focus?: string | null
          monthly_income?: number | null
          target_country?: string | null
          toefl_score?: number | null
          updated_at?: string
          username?: string
          willingness?: string | null
        }
        Relationships: []
      }
      universities: {
        Row: {
          acceptance_chance: string | null
          city: string | null
          country: string
          created_at: string
          division: string | null
          estimated_cost_usd: number | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          nature: string
          scholarship_available: boolean | null
          state: string
          type: string
          website: string | null
        }
        Insert: {
          acceptance_chance?: string | null
          city?: string | null
          country: string
          created_at?: string
          division?: string | null
          estimated_cost_usd?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          nature: string
          scholarship_available?: boolean | null
          state: string
          type: string
          website?: string | null
        }
        Update: {
          acceptance_chance?: string | null
          city?: string | null
          country?: string
          created_at?: string
          division?: string | null
          estimated_cost_usd?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          nature?: string
          scholarship_available?: boolean | null
          state?: string
          type?: string
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
