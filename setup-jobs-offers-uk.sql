-- =====================================================
-- SETUP jobs_offers_uk TABLE AND REALTIME
-- =====================================================

-- 1. CREATE jobs_offers_uk TABLE (if not exists)
CREATE TABLE IF NOT EXISTS jobs_offers_uk (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs_uk(id) ON DELETE CASCADE,
  driver_uid UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Constraint to ensure valid status
  CONSTRAINT jobs_offers_uk_status_check CHECK (status IN ('pending', 'accepted', 'rejected', 'expired'))
);

-- 2. CREATE INDEXES for fast queries
CREATE INDEX IF NOT EXISTS idx_jobs_offers_uk_driver_status
ON jobs_offers_uk(driver_uid, status)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_jobs_offers_uk_job_id
ON jobs_offers_uk(job_id);

CREATE INDEX IF NOT EXISTS idx_jobs_offers_uk_expires_at
ON jobs_offers_uk(expires_at)
WHERE status = 'pending';

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE jobs_offers_uk ENABLE ROW LEVEL SECURITY;

-- 4. DROP EXISTING POLICIES (if any)
DROP POLICY IF EXISTS "Drivers can view their own offers" ON jobs_offers_uk;
DROP POLICY IF EXISTS "Drivers can update their own offers" ON jobs_offers_uk;
DROP POLICY IF EXISTS "Service role full access to jobs_offers_uk" ON jobs_offers_uk;

-- 5. CREATE RLS POLICIES

-- Allow drivers to view their own offers
CREATE POLICY "Drivers can view their own offers"
ON jobs_offers_uk
FOR SELECT
TO authenticated
USING (auth.uid() = driver_uid);

-- Allow drivers to update their own offers (only status column)
CREATE POLICY "Drivers can update their own offers"
ON jobs_offers_uk
FOR UPDATE
TO authenticated
USING (auth.uid() = driver_uid)
WITH CHECK (auth.uid() = driver_uid);

-- Allow service role full access (for backend/cron jobs)
CREATE POLICY "Service role full access to jobs_offers_uk"
ON jobs_offers_uk
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6. ENABLE REALTIME
-- Note: You also need to enable in Dashboard > Database > Replication
ALTER PUBLICATION supabase_realtime ADD TABLE jobs_offers_uk;

-- 7. VERIFY SETUP

-- Check table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'jobs_offers_uk'
ORDER BY ordinal_position;

-- Check indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'jobs_offers_uk'
ORDER BY indexname;

-- Check RLS policies
SELECT
    policyname,
    cmd,
    qual::text as using_clause,
    with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'jobs_offers_uk'
ORDER BY policyname;

-- Check realtime publication
SELECT
    schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
    AND tablename = 'jobs_offers_uk';

-- =====================================================
-- OPTIONAL: ADD TRIGGER TO AUTO-EXPIRE OLD OFFERS
-- =====================================================

-- Create function to expire old offers
CREATE OR REPLACE FUNCTION expire_old_jobs_offers_uk()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE jobs_offers_uk
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$;

-- You can call this function from a cron job or trigger
-- Example cron (using pg_cron extension):
-- SELECT cron.schedule('expire-jobs-offers-uk', '*/1 * * * *', 'SELECT expire_old_jobs_offers_uk()');

-- =====================================================
-- TEST QUERIES
-- =====================================================

-- Count pending offers per driver
SELECT
    driver_uid,
    COUNT(*) as pending_offers
FROM jobs_offers_uk
WHERE status = 'pending'
GROUP BY driver_uid;

-- View recent offers
SELECT
    o.id,
    o.job_id,
    o.driver_uid,
    o.status,
    o.created_at,
    o.expires_at,
    j.ref as job_ref,
    j.amount,
    j.collect_address,
    j.dropoff_address
FROM jobs_offers_uk o
JOIN jobs_uk j ON o.job_id = j.id
ORDER BY o.created_at DESC
LIMIT 10;

-- View expired offers that need cleanup
SELECT
    id,
    job_id,
    driver_uid,
    status,
    expires_at,
    NOW() - expires_at as time_since_expired
FROM jobs_offers_uk
WHERE status = 'pending'
    AND expires_at < NOW()
ORDER BY expires_at DESC;

-- =====================================================
-- TEST INSERT (for testing)
-- =====================================================

-- Example: Insert a test offer
-- Replace with actual driver_uid and job_id
/*
INSERT INTO jobs_offers_uk (job_id, driver_uid, status, expires_at)
VALUES (
    'your-job-id-here'::uuid,
    'your-driver-uid-here'::uuid,
    'pending',
    NOW() + INTERVAL '45 seconds'
);
*/
