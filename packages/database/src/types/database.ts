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
      restaurants: {
        Row: {
          id: string
          name: string
          owner_id: string
          address: string | null
          phone: string | null
          email: string | null
          siret: string | null
          slug: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          address?: string | null
          phone?: string | null
          email?: string | null
          siret?: string | null
          slug?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          address?: string | null
          phone?: string | null
          email?: string | null
          siret?: string | null
          slug?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      restaurant_members: {
        Row: {
          id: string
          restaurant_id: string
          user_id: string | null
          employee_id: string | null
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          user_id?: string | null
          employee_id?: string | null
          role: string
          created_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          user_id?: string | null
          employee_id?: string | null
          role?: string
          created_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          manager_id: string
          restaurant_id: string
          first_name: string
          last_name: string
          role: string
          pin_code: string | null
          created_at: string
        }
        Insert: {
          id?: string
          manager_id: string
          restaurant_id: string
          first_name: string
          last_name: string
          role: string
          pin_code?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          manager_id?: string
          restaurant_id?: string
          first_name?: string
          last_name?: string
          role?: string
          pin_code?: string | null
          created_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          restaurant_id: string
          name: string
          grid_width: number
          grid_height: number
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          name: string
          grid_width?: number
          grid_height?: number
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          name?: string
          grid_width?: number
          grid_height?: number
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      tables: {
        Row: {
          id: string
          room_id: string
          restaurant_id: string
          table_number: string
          capacity: number
          position_x: number
          position_y: number
          width: number
          height: number
          shape: 'square' | 'round' | 'rectangle'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_id: string
          restaurant_id: string
          table_number: string
          capacity?: number
          position_x?: number
          position_y?: number
          width?: number
          height?: number
          shape?: 'square' | 'round' | 'rectangle'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          restaurant_id?: string
          table_number?: string
          capacity?: number
          position_x?: number
          position_y?: number
          width?: number
          height?: number
          shape?: 'square' | 'round' | 'rectangle'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          restaurant_id: string
          name: string
          start_time: string
          end_time: string
          max_covers: number
          days_of_week: number[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          name: string
          start_time: string
          end_time: string
          max_covers?: number
          days_of_week?: number[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          name?: string
          start_time?: string
          end_time?: string
          max_covers?: number
          days_of_week?: number[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      reservations: {
        Row: {
          id: string
          restaurant_id: string
          service_id: string | null
          table_id: string | null
          reservation_date: string
          reservation_time: string
          party_size: number
          duration_minutes: number
          customer_name: string
          customer_phone: string
          customer_email: string | null
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
          notes: string | null
          internal_notes: string | null
          confirmed_by: string | null
          confirmed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          service_id?: string | null
          table_id?: string | null
          reservation_date: string
          reservation_time: string
          party_size: number
          duration_minutes?: number
          customer_name: string
          customer_phone: string
          customer_email?: string | null
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
          notes?: string | null
          internal_notes?: string | null
          confirmed_by?: string | null
          confirmed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          service_id?: string | null
          table_id?: string | null
          reservation_date?: string
          reservation_time?: string
          party_size?: number
          duration_minutes?: number
          customer_name?: string
          customer_phone?: string
          customer_email?: string | null
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
          notes?: string | null
          internal_notes?: string | null
          confirmed_by?: string | null
          confirmed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      restaurant_reservation_settings: {
        Row: {
          id: string
          restaurant_id: string
          is_enabled: boolean
          slug: string | null
          primary_color: string
          secondary_color: string
          accent_color: string
          min_party_size: number
          max_party_size: number
          advance_booking_days: number
          min_notice_hours: number
          welcome_message: string | null
          confirmation_message: string | null
          display_phone: string | null
          display_email: string | null
          display_address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          is_enabled?: boolean
          slug?: string | null
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          min_party_size?: number
          max_party_size?: number
          advance_booking_days?: number
          min_notice_hours?: number
          welcome_message?: string | null
          confirmation_message?: string | null
          display_phone?: string | null
          display_email?: string | null
          display_address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          is_enabled?: boolean
          slug?: string | null
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          min_party_size?: number
          max_party_size?: number
          advance_booking_days?: number
          min_notice_hours?: number
          welcome_message?: string | null
          confirmation_message?: string | null
          display_phone?: string | null
          display_email?: string | null
          display_address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      special_dates: {
        Row: {
          id: string
          restaurant_id: string
          date: string
          type: 'closed' | 'holiday' | 'special_hours' | 'special_event'
          name: string | null
          description: string | null
          custom_services: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          date: string
          type: 'closed' | 'holiday' | 'special_hours' | 'special_event'
          name?: string | null
          description?: string | null
          custom_services?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          date?: string
          type?: 'closed' | 'holiday' | 'special_hours' | 'special_event'
          name?: string | null
          description?: string | null
          custom_services?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_available_covers: {
        Args: {
          p_restaurant_id: string
          p_service_id: string
          p_date: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
