-- =====================================================
-- FIX RLS POLICIES FOR DRIVERS_UK TABLE
-- =====================================================

-- Drop the old policies that might be too permissive
DROP POLICY IF EXISTS "drivers_uk_select_own" ON drivers_uk;
DROP POLICY IF EXISTS "drivers_uk_update_own" ON drivers_uk;
DROP POLICY IF EXISTS "drivers_uk_insert_own" ON drivers_uk;

-- Create proper SELECT policy - Only allow users to see their own data
CREATE POLICY "drivers_uk_select_own"
ON drivers_uk
FOR SELECT
TO authenticated
USING (auth.uid() = uid);

-- Create proper UPDATE policy - Only allow users to update their own data
CREATE POLICY "drivers_uk_update_own"
ON drivers_uk
FOR UPDATE
TO authenticated
USING (auth.uid() = uid)
WITH CHECK (auth.uid() = uid);

-- Verify the policies were created correctly
SELECT
  policyname,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'drivers_uk'
  AND policyname IN ('drivers_uk_select_own', 'drivers_uk_update_own')
ORDER BY policyname;
