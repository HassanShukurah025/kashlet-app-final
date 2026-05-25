/*
  # Clean up duplicate update_updated_at_column function

  1. Issue
    - Two versions of update_updated_at_column exist (one with search_path, one without)
    - Triggers may reference the old OID

  2. Fix
    - Drop all triggers that use the function
    - Drop both function versions
    - Recreate the function cleanly with SET search_path = public
    - Recreate all triggers
*/

-- Drop triggers first
DROP TRIGGER IF EXISTS set_users_updated_at ON users;
DROP TRIGGER IF EXISTS set_clients_updated_at ON clients;
DROP TRIGGER IF EXISTS set_invoices_updated_at ON invoices;

-- Drop both function versions
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Recreate cleanly with search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
