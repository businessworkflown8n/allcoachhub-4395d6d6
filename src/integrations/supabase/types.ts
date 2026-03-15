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
      ai_blogs: {
        Row: {
          author: string | null
          blog_type: string
          category: string
          content: string | null
          created_at: string
          cta_link: string | null
          cta_text: string | null
          excerpt: string
          id: string
          image_url: string | null
          is_published: boolean
          job_data: Json | null
          meta_description: string | null
          meta_title: string | null
          published_at: string
          read_time: string
          slug: string | null
          tags: string[] | null
          title: string
        }
        Insert: {
          author?: string | null
          blog_type?: string
          category?: string
          content?: string | null
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          excerpt: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          job_data?: Json | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string
          read_time?: string
          slug?: string | null
          tags?: string[] | null
          title: string
        }
        Update: {
          author?: string | null
          blog_type?: string
          category?: string
          content?: string | null
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          excerpt?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          job_data?: Json | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string
          read_time?: string
          slug?: string | null
          tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      campaign_activity_log: {
        Row: {
          campaign_id: string
          channel: string
          clicked_at: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          delivered_at: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          opened_at: string | null
          replied_at: string | null
          sent_at: string | null
          source: string | null
          status: string
        }
        Insert: {
          campaign_id: string
          channel?: string
          clicked_at?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          delivered_at?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          opened_at?: string | null
          replied_at?: string | null
          sent_at?: string | null
          source?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string
          channel?: string
          clicked_at?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          delivered_at?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          opened_at?: string | null
          replied_at?: string | null
          sent_at?: string | null
          source?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_activity_log_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_contacts: {
        Row: {
          campaign_id: string
          company: string | null
          country_code: string | null
          created_at: string
          custom_fields: Json | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          is_duplicate: boolean
          is_valid: boolean
          last_name: string | null
          phone: string | null
          role: string | null
          source: string
          tags: string[] | null
          validation_errors: string[] | null
          whatsapp_number: string | null
        }
        Insert: {
          campaign_id: string
          company?: string | null
          country_code?: string | null
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_duplicate?: boolean
          is_valid?: boolean
          last_name?: string | null
          phone?: string | null
          role?: string | null
          source?: string
          tags?: string[] | null
          validation_errors?: string[] | null
          whatsapp_number?: string | null
        }
        Update: {
          campaign_id?: string
          company?: string | null
          country_code?: string | null
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_duplicate?: boolean
          is_valid?: boolean
          last_name?: string | null
          phone?: string | null
          role?: string | null
          source?: string
          tags?: string[] | null
          validation_errors?: string[] | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_contacts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_history: {
        Row: {
          content: string
          created_at: string
          id: string
          lead_id: string
          role: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lead_id: string
          role: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lead_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "chatbot_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_leads: {
        Row: {
          company: string | null
          country: string | null
          created_at: string
          email: string
          experience: string | null
          id: string
          industry: string | null
          name: string
          user_type: string
          whatsapp: string
        }
        Insert: {
          company?: string | null
          country?: string | null
          created_at?: string
          email: string
          experience?: string | null
          id?: string
          industry?: string | null
          name: string
          user_type: string
          whatsapp: string
        }
        Update: {
          company?: string | null
          country?: string | null
          created_at?: string
          email?: string
          experience?: string | null
          id?: string
          industry?: string | null
          name?: string
          user_type?: string
          whatsapp?: string
        }
        Relationships: []
      }
      coach_commissions: {
        Row: {
          coach_id: string
          commission_percent: number
          id: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          commission_percent?: number
          id?: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          commission_percent?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      coach_page_views: {
        Row: {
          coach_user_id: string
          id: string
          referrer: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          viewed_at: string
          visitor_ip: string | null
        }
        Insert: {
          coach_user_id: string
          id?: string
          referrer?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          viewed_at?: string
          visitor_ip?: string | null
        }
        Update: {
          coach_user_id?: string
          id?: string
          referrer?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          viewed_at?: string
          visitor_ip?: string | null
        }
        Relationships: []
      }
      communication_settings: {
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
          value?: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
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
          slug: string | null
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
          slug?: string | null
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
          slug?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_zip_level_scores: {
        Row: {
          completed_at: string
          id: string
          level_number: number
          score: number
          time_seconds: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          level_number: number
          score?: number
          time_seconds: number
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          level_number?: number
          score?: number
          time_seconds?: number
          user_id?: string
        }
        Relationships: []
      }
      daily_zip_progress: {
        Row: {
          best_time_seconds: number | null
          created_at: string
          current_level: number
          id: string
          total_games_played: number
          total_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          best_time_seconds?: number | null
          created_at?: string
          current_level?: number
          id?: string
          total_games_played?: number
          total_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          best_time_seconds?: number | null
          created_at?: string
          current_level?: number
          id?: string
          total_games_played?: number
          total_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_zip_puzzles: {
        Row: {
          created_at: string
          difficulty: string
          grid_size: number
          id: string
          is_active: boolean
          puzzle_data: Json
          scheduled_date: string | null
          solution_data: Json
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          difficulty?: string
          grid_size?: number
          id?: string
          is_active?: boolean
          puzzle_data?: Json
          scheduled_date?: string | null
          solution_data?: Json
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          difficulty?: string
          grid_size?: number
          id?: string
          is_active?: boolean
          puzzle_data?: Json
          scheduled_date?: string | null
          solution_data?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_zip_scores: {
        Row: {
          completed_at: string
          id: string
          puzzle_id: string
          score: number
          time_seconds: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          puzzle_id: string
          score?: number
          time_seconds: number
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          puzzle_id?: string
          score?: number
          time_seconds?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_zip_scores_puzzle_id_fkey"
            columns: ["puzzle_id"]
            isOneToOne: false
            referencedRelation: "daily_zip_puzzles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          attached_file_name: string | null
          audience_filter: Json | null
          audience_source: string | null
          audience_type: string
          channel: string
          click_rate: number | null
          coach_id: string | null
          content: string
          created_at: string
          cta_link: string | null
          cta_text: string | null
          delivery_rate: number | null
          id: string
          import_mapping: Json | null
          open_rate: number | null
          scheduled_at: string | null
          sender_email: string | null
          sender_name: string | null
          sent_at: string | null
          status: string
          subject: string
          template_name: string | null
          total_bounced: number | null
          total_clicked: number | null
          total_delivered: number | null
          total_duplicates_removed: number | null
          total_failed: number | null
          total_imported: number | null
          total_invalid: number | null
          total_opened: number | null
          total_recipients: number | null
          total_replied: number | null
          total_sent: number | null
          total_unsubscribed: number | null
          total_valid: number | null
          updated_at: string
        }
        Insert: {
          attached_file_name?: string | null
          audience_filter?: Json | null
          audience_source?: string | null
          audience_type?: string
          channel?: string
          click_rate?: number | null
          coach_id?: string | null
          content: string
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          delivery_rate?: number | null
          id?: string
          import_mapping?: Json | null
          open_rate?: number | null
          scheduled_at?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          template_name?: string | null
          total_bounced?: number | null
          total_clicked?: number | null
          total_delivered?: number | null
          total_duplicates_removed?: number | null
          total_failed?: number | null
          total_imported?: number | null
          total_invalid?: number | null
          total_opened?: number | null
          total_recipients?: number | null
          total_replied?: number | null
          total_sent?: number | null
          total_unsubscribed?: number | null
          total_valid?: number | null
          updated_at?: string
        }
        Update: {
          attached_file_name?: string | null
          audience_filter?: Json | null
          audience_source?: string | null
          audience_type?: string
          channel?: string
          click_rate?: number | null
          coach_id?: string | null
          content?: string
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          delivery_rate?: number | null
          id?: string
          import_mapping?: Json | null
          open_rate?: number | null
          scheduled_at?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          template_name?: string | null
          total_bounced?: number | null
          total_clicked?: number | null
          total_delivered?: number | null
          total_duplicates_removed?: number | null
          total_failed?: number | null
          total_imported?: number | null
          total_invalid?: number | null
          total_opened?: number | null
          total_recipients?: number | null
          total_replied?: number | null
          total_sent?: number | null
          total_unsubscribed?: number | null
          total_valid?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      email_contacts: {
        Row: {
          country: string | null
          course_enrolled: string | null
          created_at: string
          email: string
          id: string
          is_unsubscribed: boolean | null
          name: string | null
          phone: string | null
          signup_date: string | null
          source: string | null
          user_type: string | null
          whatsapp_number: string | null
        }
        Insert: {
          country?: string | null
          course_enrolled?: string | null
          created_at?: string
          email: string
          id?: string
          is_unsubscribed?: boolean | null
          name?: string | null
          phone?: string | null
          signup_date?: string | null
          source?: string | null
          user_type?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          country?: string | null
          course_enrolled?: string | null
          created_at?: string
          email?: string
          id?: string
          is_unsubscribed?: boolean | null
          name?: string | null
          phone?: string | null
          signup_date?: string | null
          source?: string | null
          user_type?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string
          cta_link: string | null
          cta_text: string | null
          id: string
          name: string
          subject: string
          template_html: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          id?: string
          name: string
          subject: string
          template_html?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          id?: string
          name?: string
          subject?: string
          template_html?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
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
      material_downloads: {
        Row: {
          created_at: string
          id: string
          material_id: string
          source: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          source?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          source?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_downloads_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          category: string
          copy_link_clicks: number
          created_at: string
          description: string | null
          download_count: number
          email_share_count: number
          facebook_clicks: number
          facebook_url: string | null
          file_type: string | null
          file_url: string | null
          id: string
          instagram_clicks: number
          instagram_url: string | null
          is_downloadable: boolean
          is_email_shareable: boolean
          is_published: boolean
          linkedin_clicks: number
          linkedin_url: string | null
          share_count: number
          slug: string | null
          thumbnail_url: string | null
          tiktok_clicks: number
          tiktok_url: string | null
          title: string
          twitter_clicks: number
          twitter_url: string | null
          updated_at: string
          view_count: number
          youtube_clicks: number
          youtube_url: string | null
        }
        Insert: {
          category?: string
          copy_link_clicks?: number
          created_at?: string
          description?: string | null
          download_count?: number
          email_share_count?: number
          facebook_clicks?: number
          facebook_url?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          instagram_clicks?: number
          instagram_url?: string | null
          is_downloadable?: boolean
          is_email_shareable?: boolean
          is_published?: boolean
          linkedin_clicks?: number
          linkedin_url?: string | null
          share_count?: number
          slug?: string | null
          thumbnail_url?: string | null
          tiktok_clicks?: number
          tiktok_url?: string | null
          title: string
          twitter_clicks?: number
          twitter_url?: string | null
          updated_at?: string
          view_count?: number
          youtube_clicks?: number
          youtube_url?: string | null
        }
        Update: {
          category?: string
          copy_link_clicks?: number
          created_at?: string
          description?: string | null
          download_count?: number
          email_share_count?: number
          facebook_clicks?: number
          facebook_url?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          instagram_clicks?: number
          instagram_url?: string | null
          is_downloadable?: boolean
          is_email_shareable?: boolean
          is_published?: boolean
          linkedin_clicks?: number
          linkedin_url?: string | null
          share_count?: number
          slug?: string | null
          thumbnail_url?: string | null
          tiktok_clicks?: number
          tiktok_url?: string | null
          title?: string
          twitter_clicks?: number
          twitter_url?: string | null
          updated_at?: string
          view_count?: number
          youtube_clicks?: number
          youtube_url?: string | null
        }
        Relationships: []
      }
      payment_status_audit: {
        Row: {
          changed_at: string
          changed_by: string
          enrollment_id: string
          id: string
          new_status: string
          notes: string | null
          old_status: string
        }
        Insert: {
          changed_at?: string
          changed_by: string
          enrollment_id: string
          id?: string
          new_status: string
          notes?: string | null
          old_status: string
        }
        Update: {
          changed_at?: string
          changed_by?: string
          enrollment_id?: string
          id?: string
          new_status?: string
          notes?: string | null
          old_status?: string
        }
        Relationships: []
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
          slug: string | null
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
          slug?: string | null
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
          slug?: string | null
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
      social_posts: {
        Row: {
          content: string
          created_at: string
          hashtags: string[] | null
          id: string
          image_url: string | null
          link_url: string | null
          platforms: string[] | null
          published_at: string | null
          scheduled_at: string | null
          status: string
          title: string | null
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          content: string
          created_at?: string
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          link_url?: string | null
          platforms?: string[] | null
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          link_url?: string | null
          platforms?: string[] | null
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
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
      webinar_registrations: {
        Row: {
          email_sent: boolean
          id: string
          learner_id: string
          registered_at: string
          registrant_email: string | null
          registrant_name: string | null
          registrant_phone: string | null
          webinar_id: string
        }
        Insert: {
          email_sent?: boolean
          id?: string
          learner_id: string
          registered_at?: string
          registrant_email?: string | null
          registrant_name?: string | null
          registrant_phone?: string | null
          webinar_id: string
        }
        Update: {
          email_sent?: boolean
          id?: string
          learner_id?: string
          registered_at?: string
          registrant_email?: string | null
          registrant_name?: string | null
          registrant_phone?: string | null
          webinar_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webinar_registrations_webinar_id_fkey"
            columns: ["webinar_id"]
            isOneToOne: false
            referencedRelation: "webinars"
            referencedColumns: ["id"]
          },
        ]
      }
      webinars: {
        Row: {
          coach_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_published: boolean
          title: string
          updated_at: string
          webinar_date: string
          webinar_link: string
          webinar_link_status: string
          webinar_time: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_published?: boolean
          title: string
          updated_at?: string
          webinar_date: string
          webinar_link: string
          webinar_link_status?: string
          webinar_time: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_published?: boolean
          title?: string
          updated_at?: string
          webinar_date?: string
          webinar_link?: string
          webinar_link_status?: string
          webinar_time?: string
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
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
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
