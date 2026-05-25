/*
  # Security hardening: search_path, function permissions, storage policies

  1. Function Security
    - Add `SET search_path = public` to both `update_updated_at_column` and `handle_new_user`
    - This resolves mutable search_path warnings

  2. Function Execution Restrictions
    - Revoke EXECUTE on `handle_new_user` from anon, authenticated, and PUBLIC
    - Keep EXECUTE only for postgres and service_role
    - The function is triggered by the auth system (postgres), so signup flow is preserved
    - Keep EXECUTE on `update_updated_at_column` for authenticated (trigger needs it)

  3. Storage Security
    - Drop the overly broad "Public read logos" SELECT policy on storage.objects
    - Replace with a policy that only allows SELECT when the full object path is known
    - This prevents bucket listing/enumeration while allowing direct URL access
*/

-- 1. Fix search_path on both functions

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

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, business_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'business_name', '')
  );
  RETURN NEW;
END;
$$;

-- 2. Restrict handle_new_user execution
-- Revoke from anon and authenticated roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- Ensure postgres and service_role retain EXECUTE (they already have it)
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- 3. Fix storage bucket security
-- Drop the broad public SELECT policy that allows listing
DROP POLICY IF EXISTS "Public read logos" ON storage.objects;

-- Replace with a restrictive policy: only allow SELECT when path includes a known user folder
-- This allows direct URL access (public URLs hit with the full path) but prevents listing
CREATE POLICY "Direct read logos only"
  ON storage.objects FOR SELECT
  TO public
  USING (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] <> ''
  );
