export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          user_id: string
          name: string
          handle: string
          sector: string
          bio: string | null
          location: string | null
          tags: string[]
          logo_url: string | null
          website: string | null
          founded_year: number | null
          team_size: string | null
          partnership_seeking: string[]
          followers_count: number
          following_count: number
          verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          handle: string
          sector: string
          bio?: string | null
          location?: string | null
          tags?: string[]
          logo_url?: string | null
          website?: string | null
          founded_year?: number | null
          team_size?: string | null
          partnership_seeking?: string[]
          followers_count?: number
          following_count?: number
          verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          handle?: string
          sector?: string
          bio?: string | null
          location?: string | null
          tags?: string[]
          logo_url?: string | null
          website?: string | null
          founded_year?: number | null
          team_size?: string | null
          partnership_seeking?: string[]
          followers_count?: number
          following_count?: number
          verified?: boolean
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          company_id: string
          content: string
          is_partnership_opportunity: boolean
          likes_count: number
          reposts_count: number
          comments_count: number
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          content: string
          is_partnership_opportunity?: boolean
          likes_count?: number
          reposts_count?: number
          comments_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          content?: string
          is_partnership_opportunity?: boolean
          likes_count?: number
          reposts_count?: number
          comments_count?: number
          created_at?: string
        }
      }
      post_likes: {
        Row: {
          post_id: string
          company_id: string
          created_at: string
        }
        Insert: {
          post_id: string
          company_id: string
          created_at?: string
        }
        Update: {
          post_id?: string
          company_id?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          company_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          company_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          company_id?: string
          content?: string
          created_at?: string
        }
      }
      follows: {
        Row: {
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      partnership_requests: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          message: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          message?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          message?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      legal_documents: {
        Row: {
          id: string
          company_id: string
          type: string
          title: string
          party_a: string
          party_b: string
          fields: Json
          document_text: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          type: string
          title: string
          party_a: string
          party_b: string
          fields?: Json
          document_text: string
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          type?: string
          title?: string
          party_a?: string
          party_b?: string
          fields?: Json
          document_text?: string
          created_at?: string
        }
      }
      stock_watchlist: {
        Row: {
          company_id: string
          ticker: string
          added_at: string
        }
        Insert: {
          company_id: string
          ticker: string
          added_at?: string
        }
        Update: {
          company_id?: string
          ticker?: string
          added_at?: string
        }
      }
      activity_history: {
        Row: {
          id: string
          company_id: string
          type: string
          description: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          type: string
          description: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          type?: string
          description?: string
          metadata?: Json
          created_at?: string
        }
      }
      valuation_snapshots: {
        Row: {
          id: string
          company_id: string
          inputs: Json
          estimated_low: number
          estimated_high: number
          methodology: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          inputs: Json
          estimated_low: number
          estimated_high: number
          methodology: string
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          inputs?: Json
          estimated_low?: number
          estimated_high?: number
          methodology?: string
          created_at?: string
        }
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
  }
}
