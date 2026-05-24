/*
  # Create invoices table

  1. New Tables
    - `invoices`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `client_id` (uuid, references clients)
      - `invoice_number` (text, not null, unique per user)
      - `status` (text, default 'draft' - draft/sent/paid/overdue)
      - `invoice_date` (date)
      - `due_date` (date)
      - `items` (jsonb, array of line items)
      - `subtotal` (numeric, default 0)
      - `tax_total` (numeric, default 0)
      - `discount` (numeric, default 0)
      - `total` (numeric, default 0)
      - `currency` (text, default 'USD')
      - `notes` (text, default '')
      - `payment_terms` (text, default '')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `invoices` table
    - Users can only CRUD their own invoices

  3. Indexes
    - Index on user_id and status for filtering
*/

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  invoice_number text NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  invoice_date date DEFAULT CURRENT_DATE,
  due_date date,
  items jsonb DEFAULT '[]'::jsonb,
  subtotal numeric DEFAULT 0,
  tax_total numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  total numeric DEFAULT 0,
  currency text DEFAULT 'USD',
  notes text DEFAULT '',
  payment_terms text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, invoice_number)
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(user_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(user_id, created_at DESC);
