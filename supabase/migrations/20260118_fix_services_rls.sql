-- Fix RLS policy for services to allow viewing legacy data (where user_id is NULL)

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view their own services" ON services;

-- Create a more permissive policy for SELECT
-- Allows users to see their own data AND data that hasn't been assigned to anyone yet (legacy)
CREATE POLICY "Users can view own or legacy services" ON services
FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    user_id IS NULL
);

-- Note: INSERT/UPDATE/DELETE policies remain strict (auth.uid() = user_id)
-- so users can't edit or delete legacy data until they "claim" it or an admin fixes it.
