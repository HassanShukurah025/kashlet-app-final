/*
  # Create users table

  1. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `business_name` (text, default '')
      - `business_address` (text, default '')
      - `business_phone` (text, default '')
      - `business_logo_url` (text, default '')
      - `currency` (text, default 'USD')
      - `tax_enabled` (boolean, default false)
      - `tax_rate` (numeric, default 0)
      - `invoice_prefix` (text, default 'INV')
      - `next_invoice_number` (integer, default 1)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `users` table
    - Users can read/update only their own data
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  business_name text DEFAULT '',
  business_address text DEFAULT '',
  business_phone text DEFAULT '',
  business_logo_url text DEFAULT '',
  currency text DEFAULT 'USD',
  tax_enabled boolean DEFAULT false,
  tax_rate numeric DEFAULT 0,
  invoice_prefix text DEFAULT 'INV',
  next_invoice_number integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
