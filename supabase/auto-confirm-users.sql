-- Run this in your Supabase SQL Editor to automatically confirm new users
-- This bypasses the email confirmation requirement entirely.

CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS trigger AS $$
BEGIN
  -- Automatically set the email confirmed timestamp to now
  NEW.email_confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it already exists to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;

-- Create the trigger to run BEFORE any new user is inserted
CREATE TRIGGER on_auth_user_created_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_user();
