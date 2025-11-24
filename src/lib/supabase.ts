import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  username: string;
  display_name: string
  bio: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Place {
  id: string;
  user_id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  description: string;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Person {
  id: string;
  user_id: string;
  place_id: string;
  name: string;
  home_country: string;
  home_latitude: number | null;
  home_longitude: number | null;
  description: string;
  instagram_handle: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
  place?: Place;
}

export interface Memory {
  id: string;
  user_id: string;
  place_id: string | null;
  person_id: string | null;
  photo_url: string;
  caption: string;
  memory_date: string | null;
  created_at: string;
}
