-- =====================================================
-- SUPABASE RLS SETUP FOR DRIVERS_UK TABLE
-- =====================================================

-- First, check if RLS is enabled on the table
-- Run this query in Supabase SQL Editor to see current RLS status:

SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'drivers_uk';

-- =====================================================
-- View existing RLS policies
-- =====================================================

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'drivers_uk';

-- =====================================================
-- RECOMMENDED RLS POLICIES FOR DRIVERS_UK
-- =====================================================

-- 1. Enable RLS on the table (if not already enabled)
ALTER TABLE drivers_uk ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies (if any) to start fresh
DROP POLICY IF EXISTS "drivers_uk_select_policy" ON drivers_uk;
DROP POLICY IF EXISTS "drivers_uk_insert_policy" ON drivers_uk;
DROP POLICY IF EXISTS "drivers_uk_update_policy" ON drivers_uk;

-- 3. Create SELECT policy - Allow users to read their own data
CREATE POLICY "drivers_uk_select_policy"
ON drivers_uk
FOR SELECT
TO authenticated
USING (auth.uid() = uid);

-- 4. Create UPDATE policy - Allow users to update their own data
CREATE POLICY "drivers_uk_update_policy"
ON drivers_uk
FOR UPDATE
TO authenticated
USING (auth.uid() = uid)
WITH CHECK (auth.uid() = uid);

-- 5. Optional: Allow service role to have full access (for admin operations)
-- This is useful if you need backend services to manage driver data

-- =====================================================
-- VERIFY THE POLICIES ARE WORKING
-- =====================================================

-- Test query (run this while authenticated as a user)
-- This should return the driver data for the current authenticated user
SELECT * FROM drivers_uk WHERE uid = auth.uid();

-- =====================================================
-- CHECK TABLE STRUCTURE
-- =====================================================

-- View all columns in the drivers_uk table
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'drivers_uk'
ORDER BY ordinal_position;

-- =====================================================
-- SAMPLE DATA CHECK
-- =====================================================

-- Count total drivers in the table
SELECT COUNT(*) as total_drivers FROM drivers_uk;

-- View first few records (without sensitive data)
SELECT
  uid,
  first_name,
  last_name,
  points,
  created_at
FROM drivers_uk
LIMIT 5;
