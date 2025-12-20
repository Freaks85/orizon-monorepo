import type { Database } from './database';

// Room types
export type Room = Database['public']['Tables']['rooms']['Row'];
export type RoomInsert = Database['public']['Tables']['rooms']['Insert'];
export type RoomUpdate = Database['public']['Tables']['rooms']['Update'];

// Table types
export type Table = Database['public']['Tables']['tables']['Row'];
export type TableInsert = Database['public']['Tables']['tables']['Insert'];
export type TableUpdate = Database['public']['Tables']['tables']['Update'];
export type TableShape = 'square' | 'round' | 'rectangle';

// Service types
export type Service = Database['public']['Tables']['services']['Row'];
export type ServiceInsert = Database['public']['Tables']['services']['Insert'];
export type ServiceUpdate = Database['public']['Tables']['services']['Update'];

// Reservation types
export type Reservation = Database['public']['Tables']['reservations']['Row'];
export type ReservationInsert = Database['public']['Tables']['reservations']['Insert'];
export type ReservationUpdate = Database['public']['Tables']['reservations']['Update'];
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

// Settings types
export type ReservationSettings = Database['public']['Tables']['restaurant_reservation_settings']['Row'];
export type ReservationSettingsInsert = Database['public']['Tables']['restaurant_reservation_settings']['Insert'];
export type ReservationSettingsUpdate = Database['public']['Tables']['restaurant_reservation_settings']['Update'];

// Special dates types
export type SpecialDate = Database['public']['Tables']['special_dates']['Row'];
export type SpecialDateInsert = Database['public']['Tables']['special_dates']['Insert'];
export type SpecialDateUpdate = Database['public']['Tables']['special_dates']['Update'];
export type SpecialDateType = 'closed' | 'holiday' | 'special_hours' | 'special_event';

// Extended types with relations
export type ReservationWithRelations = Reservation & {
  services?: Service | null;
  tables?: Table | null;
};

export type TableWithRoom = Table & {
  rooms?: Room | null;
};

export type RoomWithTables = Room & {
  tables?: Table[];
};
