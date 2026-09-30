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
