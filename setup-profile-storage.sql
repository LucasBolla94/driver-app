-- =====================================================
-- SETUP PROFILE_URL COLUMN AND STORAGE BUCKET
-- =====================================================

-- 1. ADD profile_url COLUMN TO drivers_uk TABLE (if not exists)
-- =====================================================

-- Check if column exists first
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'drivers_uk'
        AND column_name = 'profile_url'
    ) THEN
        ALTER TABLE drivers_uk
        ADD COLUMN profile_url TEXT NULL;
    END IF;
END $$;

-- Add comment to column
COMMENT ON COLUMN drivers_uk.profile_url IS 'Path to driver profile image in Supabase Storage';

-- =====================================================
-- 2. VERIFY COLUMN WAS CREATED
-- =====================================================

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'drivers_uk'
    AND column_name = 'profile_url';

-- =====================================================
-- STORAGE BUCKET SETUP
-- =====================================================

-- The bucket is created through Supabase Dashboard or with this query:
-- Note: You need to run this in the Supabase SQL Editor with proper permissions

-- Create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver_profile', 'driver_profile', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES FOR driver_profile BUCKET
-- =====================================================

-- Policy 1: Allow authenticated users to upload their own profile images
CREATE POLICY "Users can upload their own profile image"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'driver_profile'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow authenticated users to update their own profile images
CREATE POLICY "Users can update their own profile image"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'driver_profile'
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'driver_profile'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow authenticated users to delete their own profile images
CREATE POLICY "Users can delete their own profile image"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'driver_profile'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow authenticated users to read all profile images
-- (so they can see other drivers' profile pictures)
CREATE POLICY "Users can view all profile images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'driver_profile');

-- =====================================================
-- VERIFY STORAGE POLICIES
-- =====================================================

SELECT
    policyname,
    cmd,
    qual::text as using_clause,
    with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'objects'
    AND schemaname = 'storage'
    AND policyname LIKE '%profile%'
ORDER BY policyname;

-- =====================================================
-- VERIFY BUCKET EXISTS
-- =====================================================

SELECT
    id,
    name,
    public,
    created_at
FROM storage.buckets
WHERE id = 'driver_profile';

-- =====================================================
-- SAMPLE DATA UPDATE (OPTIONAL)
-- =====================================================

-- Update a specific driver's profile_url (example)
-- UPDATE drivers_uk
-- SET profile_url = 'user-uid/profile.jpg'
-- WHERE uid = 'your-user-uid-here';

-- =====================================================
-- TEST QUERIES
-- =====================================================

-- View all drivers with their profile URLs
SELECT
    uid,
    first_name,
    last_name,
    profile_url,
    CASE
        WHEN profile_url IS NOT NULL THEN 'Has profile image'
        ELSE 'No profile image'
    END as profile_status
FROM drivers_uk
ORDER BY created_at DESC
LIMIT 10;
