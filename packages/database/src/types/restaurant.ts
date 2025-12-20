import type { Database } from './database';

export type Restaurant = Database['public']['Tables']['restaurants']['Row'];
export type RestaurantInsert = Database['public']['Tables']['restaurants']['Insert'];
export type RestaurantUpdate = Database['public']['Tables']['restaurants']['Update'];

export type RestaurantMember = Database['public']['Tables']['restaurant_members']['Row'];
export type RestaurantMemberInsert = Database['public']['Tables']['restaurant_members']['Insert'];
export type RestaurantMemberUpdate = Database['public']['Tables']['restaurant_members']['Update'];

export type Employee = Database['public']['Tables']['employees']['Row'];
export type EmployeeInsert = Database['public']['Tables']['employees']['Insert'];
export type EmployeeUpdate = Database['public']['Tables']['employees']['Update'];

export type RestaurantRole = 'owner' | 'admin' | 'manager' | 'staff';
