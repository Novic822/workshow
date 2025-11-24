/*
  # TravelMates Database Schema

  ## Overview
  This migration creates the core database structure for TravelMates, a travel connection tracking app.

  ## Tables Created

  ### 1. profiles
  - `id` (uuid, references auth.users)
  - `full_name` (text)
  - `bio` (text, optional)
  - `avatar_url` (text, optional)
  - `is_public` (boolean, default false)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. places
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `name` (text) - e.g., "Taghazout"
  - `country` (text)
  - `latitude` (numeric)
  - `longitude` (numeric)
  - `description` (text, optional)
  - `photo_url` (text, optional)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. people
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `place_id` (uuid, references places) - where they met
  - `name` (text)
  - `home_country` (text)
  - `home_latitude` (numeric, optional)
  - `home_longitude` (numeric, optional)
  - `description` (text, optional)
  - `instagram_handle` (text, optional)
  - `photo_url` (text, optional)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. memories
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `place_id` (uuid, references places, optional)
  - `person_id` (uuid, references people, optional)
  - `photo_url` (text)
  - `caption` (text, optional)
  - `memory_date` (date, optional)
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Policies for SELECT, INSERT, UPDATE, DELETE operations

  ## Important Notes
  - All tables use UUIDs for primary keys
  - Timestamps automatically track creation and updates
  - Foreign keys maintain data integrity
  - Cascading deletes ensure cleanup
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text NOT NULL,
  bio text DEFAULT '',
  avatar_url text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create places table
CREATE TABLE IF NOT EXISTS places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  country text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  description text DEFAULT '',
  photo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own places"
  ON places FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own places"
  ON places FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own places"
  ON places FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own places"
  ON places FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create people table
CREATE TABLE IF NOT EXISTS people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  place_id uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  name text NOT NULL,
  home_country text NOT NULL,
  home_latitude numeric,
  home_longitude numeric,
  description text DEFAULT '',
  instagram_handle text,
  photo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own people"
  ON people FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own people"
  ON people FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own people"
  ON people FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own people"
  ON people FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create memories table
CREATE TABLE IF NOT EXISTS memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  place_id uuid REFERENCES places(id) ON DELETE CASCADE,
  person_id uuid REFERENCES people(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  caption text DEFAULT '',
  memory_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memories"
  ON memories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memories"
  ON memories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memories"
  ON memories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own memories"
  ON memories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS places_user_id_idx ON places(user_id);
CREATE INDEX IF NOT EXISTS people_user_id_idx ON people(user_id);
CREATE INDEX IF NOT EXISTS people_place_id_idx ON people(place_id);
CREATE INDEX IF NOT EXISTS memories_user_id_idx ON memories(user_id);
CREATE INDEX IF NOT EXISTS memories_place_id_idx ON memories(place_id);
CREATE INDEX IF NOT EXISTS memories_person_id_idx ON memories(person_id);
