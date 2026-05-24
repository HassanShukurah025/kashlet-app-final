/*
  # Create receipts table

  1. New Tables
    - `receipts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `invoice_id` (uuid, unique, references invoices)
      - `receipt_number` (text, not null, unique per user)
      - `issued_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `receipts` table
    - Users can only CRUD their own receipts

  3. Indexes
    - Index on user_id for query performance
    - Index on invoice_id for receipt lookup
*/

CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_id uuid UNIQUE NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  receipt_number text NOT NULL,
  issued_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, receipt_number)
);

ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own receipts"
  ON receipts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own receipts"
  ON receipts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own receipts"
  ON receipts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own receipts"
  ON receipts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_invoice_id ON receipts(invoice_id);
