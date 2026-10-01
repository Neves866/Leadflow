export interface Database {
  public: {
    Tables: {
      integrations: {
        Row: {
          id: string
          organization_id: string
          provider: string
          external_account_id: string
          external_account_name: string
          status: string
          metadata: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          provider: string
          external_account_id: string
          external_account_name: string
          status?: string
          metadata?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          [K in keyof Row]?: any
        }
      }
      integration_credentials: {
        Row: {
          integration_id: string
          credentials: any
          created_at: string
          updated_at: string
        }
        Insert: {
          integration_id: string
          credentials: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          [K in keyof Row]?: any
        }
      }
      integration_oauth_sessions: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          provider: string
          temp_data: any
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          provider: string
          temp_data?: any
          expires_at: string
          created_at?: string
        }
        Update: {
          [K in keyof Row]?: any
        }
      },
      whatsapp_conversations: {
        Row: {
          id: string
          organization_id: string
          integration_id: string
          contact_id: string
          lead_id: string | null
          external_wa_id: string
          assigned_user_id: string | null
          status: string
          unread_count: number
          last_message_at: string | null
          last_inbound_at: string | null
          service_window_expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          integration_id: string
          contact_id: string
          lead_id?: string | null
          external_wa_id: string
          assigned_user_id?: string | null
          status?: string
          unread_count?: number
          last_message_at?: string | null
          last_inbound_at?: string | null
          service_window_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          [K in keyof Row]?: any
        }
      },
      whatsapp_messages: {
        Row: {
          id: string
          organization_id: string
          integration_id: string
          conversation_id: string
          provider_message_id: string | null
          direction: string
          message_type: string
          text_body: string | null
          template_name: string | null
          status: string
          actor_user_id: string | null
          metadata: any
          error_code: string | null
          error_message: string | null
          sent_at: string | null
          delivered_at: string | null
          read_at: string | null
          failed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          integration_id: string
          conversation_id: string
          provider_message_id?: string | null
          direction: string
          message_type: string
          text_body?: string | null
          template_name?: string | null
          status: string
          actor_user_id?: string | null
          metadata?: any
          error_code?: string | null
          error_message?: string | null
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          failed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          [K in keyof Row]?: any
        }
      },
      notification_rules: {
        Row: {
          id: string
          organization_id: string
          integration_id: string | null
          event_type: string
          channel: string
          enabled: boolean
          config: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          integration_id?: string | null
          event_type: string
          channel: string
          enabled?: boolean
          config?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          [K in keyof Row]?: any
        }
      },
      notification_jobs: {
        Row: {
          id: string
          organization_id: string
          rule_id: string | null
          lead_id: string | null
          channel: string
          event_type: string
          recipient: string
          payload: any
          status: string
          attempts: number
          max_attempts: number
          scheduled_at: string
          provider_message_id: string | null
          last_error: string | null
          processed_at: string | null
          idempotency_key: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          rule_id?: string | null
          lead_id?: string | null
          channel: string
          event_type: string
          recipient: string
          payload?: any
          status?: string
          attempts?: number
          max_attempts?: number
          scheduled_at?: string
          provider_message_id?: string | null
          last_error?: string | null
          processed_at?: string | null
          idempotency_key: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          [K in keyof Row]?: any
        }
      }
    }
  }
}

export type Integration = Database['public']['Tables']['integrations']['Row'];
export type IntegrationInsert = Database['public']['Tables']['integrations']['Insert'];
export type IntegrationUpdate = Database['public']['Tables']['integrations']['Update'];

export type IntegrationCredential = Database['public']['Tables']['integration_credentials']['Row'];
export type IntegrationCredentialInsert = Database['public']['Tables']['integration_credentials']['Insert'];
export type IntegrationCredentialUpdate = Database['public']['Tables']['integration_credentials']['Update'];

export type IntegrationOAuthSession = Database['public']['Tables']['integration_oauth_sessions']['Row'];
export type IntegrationOAuthSessionInsert = Database['public']['Tables']['integration_oauth_sessions']['Insert'];
export type IntegrationOAuthSessionUpdate = Database['public']['Tables']['integration_oauth_sessions']['Update'];

export type WhatsAppConversation = Database['public']['Tables']['whatsapp_conversations']['Row'];
export type WhatsAppConversationInsert = Database['public']['Tables']['whatsapp_conversations']['Insert'];
export type WhatsAppConversationUpdate = Database['public']['Tables']['whatsapp_conversations']['Update'];

export type WhatsAppMessage = Database['public']['Tables']['whatsapp_messages']['Row'];
export type WhatsAppMessageInsert = Database['public']['Tables']['whatsapp_messages']['Insert'];
export type WhatsAppMessageUpdate = Database['public']['Tables']['whatsapp_messages']['Update'];

export type NotificationRule = Database['public']['Tables']['notification_rules']['Row'];
export type NotificationRuleInsert = Database['public']['Tables']['notification_rules']['Insert'];
export type NotificationRuleUpdate = Database['public']['Tables']['notification_rules']['Update'];

export type NotificationJob = Database['public']['Tables']['notification_jobs']['Row'];
export type NotificationJobInsert = Database['public']['Tables']['notification_jobs']['Insert'];
export type NotificationJobUpdate = Database['public']['Tables']['notification_jobs']['Update'];
