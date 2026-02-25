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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      courses: {
        Row: {
          approval_status: string
          category: string
          coach_id: string
          created_at: string
          curriculum: Json | null
          description: string | null
          discount_percent: number | null
          duration_hours: number
          id: string
          intro_video_url: string | null
          is_published: boolean
          language: string
          level: string
          original_price_inr: number | null
          original_price_usd: number | null
          price_inr: number
          price_usd: number
          rejection_reason: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          approval_status?: string
          category: string
          coach_id: string
          created_at?: string
          curriculum?: Json | null
          description?: string | null
          discount_percent?: number | null
          duration_hours?: number
          id?: string
          intro_video_url?: string | null
          is_published?: boolean
          language?: string
          level?: string
          original_price_inr?: number | null
          original_price_usd?: number | null
          price_inr?: number
          price_usd?: number
          rejection_reason?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          approval_status?: string
          category?: string
          coach_id?: string
          created_at?: string
          curriculum?: Json | null
          description?: string | null
          discount_percent?: number | null
          duration_hours?: number
          id?: string
          intro_video_url?: string | null
          is_published?: boolean
          language?: string
          level?: string
          original_price_inr?: number | null
          original_price_usd?: number | null
          price_inr?: number
          price_usd?: number
          rejection_reason?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          amount_paid: number | null
          certificate_url: string | null
          city: string
          coach_id: string
          completed_at: string | null
          contact_number: string
          country: string
          course_id: string
          currency: string | null
          current_job_title: string
          education_qualification: string
          email: string
          enrolled_at: string
          experience_level: string
          full_name: string
          id: string
          industry: string
          learner_id: string
          learning_objective: string | null
          linkedin_profile: string | null
          payment_id: string | null
          payment_status: string
          progress_percent: number | null
          whatsapp_number: string
        }
        Insert: {
          amount_paid?: number | null
          certificate_url?: string | null
          city: string
          coach_id: string
          completed_at?: string | null
          contact_number: string
          country: string
          course_id: string
          currency?: string | null
          current_job_title: string
          education_qualification: string
          email: string
          enrolled_at?: string
          experience_level: string
          full_name: string
          id?: string
          industry: string
          learner_id: string
          learning_objective?: string | null
          linkedin_profile?: string | null
          payment_id?: string | null
          payment_status?: string
          progress_percent?: number | null
          whatsapp_number: string
        }
        Update: {
          amount_paid?: number | null
          certificate_url?: string | null
          city?: string
          coach_id?: string
          completed_at?: string | null
          contact_number?: string
          country?: string
          course_id?: string
          currency?: string | null
          current_job_title?: string
          education_qualification?: string
          email?: string
          enrolled_at?: string
          experience_level?: string
          full_name?: string
          id?: string
          industry?: string
          learner_id?: string
          learning_objective?: string | null
          linkedin_profile?: string | null
          payment_id?: string | null
          payment_status?: string
          progress_percent?: number | null
          whatsapp_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          coach_earning: number
          coach_id: string
          created_at: string
          currency: string
          enrollment_id: string
          id: string
          payment_provider: string
          payment_provider_id: string | null
          platform_commission: number
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          coach_earning?: number
          coach_id: string
          created_at?: string
          currency?: string
          enrollment_id: string
          id?: string
          payment_provider?: string
          payment_provider_id?: string | null
          platform_commission?: number
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          coach_earning?: number
          coach_id?: string
          created_at?: string
          currency?: string
          enrollment_id?: string
          id?: string
          payment_provider?: string
          payment_provider_id?: string | null
          platform_commission?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          coach_id: string
          id: string
          processed_at: string | null
          requested_at: string
          status: string
        }
        Insert: {
          amount: number
          coach_id: string
          id?: string
          processed_at?: string | null
          requested_at?: string
          status?: string
        }
        Update: {
          amount?: number
          coach_id?: string
          id?: string
          processed_at?: string | null
          requested_at?: string
          status?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          category: string | null
          certifications: string[] | null
          city: string | null
          company_name: string | null
          contact_number: string | null
          country: string | null
          created_at: string
          education: string | null
          email: string | null
          experience: string | null
          experience_level: string | null
          full_name: string | null
          id: string
          industry: string | null
          intro_video_url: string | null
          is_suspended: boolean
          job_title: string | null
          last_active_at: string | null
          linkedin_profile: string | null
          marketing_consent: boolean
          social_links: Json | null
          tags: string[] | null
          updated_at: string
          user_id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          whatsapp_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          category?: string | null
          certifications?: string[] | null
          city?: string | null
          company_name?: string | null
          contact_number?: string | null
          country?: string | null
          created_at?: string
          education?: string | null
          email?: string | null
          experience?: string | null
          experience_level?: string | null
          full_name?: string | null
          id?: string
          industry?: string | null
          intro_video_url?: string | null
          is_suspended?: boolean
          job_title?: string | null
          last_active_at?: string | null
          linkedin_profile?: string | null
          marketing_consent?: boolean
          social_links?: Json | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          category?: string | null
          certifications?: string[] | null
          city?: string | null
          company_name?: string | null
          contact_number?: string | null
          country?: string | null
          created_at?: string
          education?: string | null
          email?: string | null
          experience?: string | null
          experience_level?: string | null
          full_name?: string | null
          id?: string
          industry?: string | null
          intro_video_url?: string | null
          is_suspended?: boolean
          job_title?: string | null
          last_active_at?: string | null
          linkedin_profile?: string | null
          marketing_consent?: boolean
          social_links?: Json | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          commission_earned: number | null
          created_at: string
          id: string
          points_earned: number | null
          referred_email: string
          referred_user_id: string | null
          referrer_id: string
          referrer_role: string
          status: string
        }
        Insert: {
          commission_earned?: number | null
          created_at?: string
          id?: string
          points_earned?: number | null
          referred_email: string
          referred_user_id?: string | null
          referrer_id: string
          referrer_role: string
          status?: string
        }
        Update: {
          commission_earned?: number | null
          created_at?: string
          id?: string
          points_earned?: number | null
          referred_email?: string
          referred_user_id?: string | null
          referrer_id?: string
          referrer_role?: string
          status?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          coach_id: string
          comment: string | null
          course_id: string
          created_at: string
          id: string
          is_approved: boolean
          learner_id: string
          rating: number
        }
        Insert: {
          coach_id: string
          comment?: string | null
          course_id: string
          created_at?: string
          id?: string
          is_approved?: boolean
          learner_id: string
          rating: number
        }
        Update: {
          coach_id?: string
          comment?: string | null
          course_id?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          learner_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          course_id: string
          created_at: string
          id: string
          learner_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          learner_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          learner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      coach_profiles_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          category: string | null
          certifications: string[] | null
          country: string | null
          created_at: string | null
          education: string | null
          experience: string | null
          full_name: string | null
          industry: string | null
          intro_video_url: string | null
          job_title: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          category?: string | null
          certifications?: string[] | null
          country?: string | null
          created_at?: string | null
          education?: string | null
          experience?: string | null
          full_name?: string | null
          industry?: string | null
          intro_video_url?: string | null
          job_title?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          category?: string | null
          certifications?: string[] | null
          country?: string | null
          created_at?: string | null
          education?: string | null
          experience?: string | null
          full_name?: string | null
          industry?: string | null
          intro_video_url?: string | null
          job_title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      public_reviews: {
        Row: {
          anonymous_reviewer_id: string | null
          coach_id: string | null
          comment: string | null
          course_id: string | null
          created_at: string | null
          id: string | null
          rating: number | null
        }
        Insert: {
          anonymous_reviewer_id?: never
          coach_id?: string | null
          comment?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
        }
        Update: {
          anonymous_reviewer_id?: never
          coach_id?: string | null
          comment?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "learner" | "coach" | "admin"
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
      app_role: ["learner", "coach", "admin"],
    },
  },
} as const
