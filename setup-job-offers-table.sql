-- =====================================================
-- SETUP JOB OFFERS TABLE AND REALTIME
-- =====================================================

-- 1. CREATE job_offers TABLE (if not exists)
CREATE TABLE IF NOT EXISTS job_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs_uk(id) ON DELETE CASCADE,
  driver_uid UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Constraint to ensure valid status
  CONSTRAINT job_offers_status_check CHECK (status IN ('pending', 'accepted', 'rejected', 'expired'))
);

-- 2. CREATE INDEXES for fast queries
CREATE INDEX IF NOT EXISTS idx_job_offers_driver_status
ON job_offers(driver_uid, status)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_job_offers_job_id
ON job_offers(job_id);

CREATE INDEX IF NOT EXISTS idx_job_offers_expires_at
ON job_offers(expires_at)
WHERE status = 'pending';

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE job_offers ENABLE ROW LEVEL SECURITY;

-- 4. DROP EXISTING POLICIES (if any)
DROP POLICY IF EXISTS "Drivers can view their own offers" ON job_offers;
DROP POLICY IF EXISTS "Drivers can update their own offers" ON job_offers;
DROP POLICY IF EXISTS "Service role full access to job_offers" ON job_offers;

-- 5. CREATE RLS POLICIES

-- Allow drivers to view their own offers
CREATE POLICY "Drivers can view their own offers"
ON job_offers
FOR SELECT
TO authenticated
USING (auth.uid() = driver_uid);

-- Allow drivers to update their own offers
CREATE POLICY "Drivers can update their own offers"
ON job_offers
FOR UPDATE
TO authenticated
USING (auth.uid() = driver_uid)
WITH CHECK (auth.uid() = driver_uid);

-- Allow service role full access (for backend/cron jobs)
CREATE POLICY "Service role full access to job_offers"
ON job_offers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6. ENABLE REALTIME (via SQL)
-- Note: You also need to enable in Dashboard > Database > Replication

ALTER PUBLICATION supabase_realtime ADD TABLE job_offers;

-- 7. VERIFY SETUP

-- Check table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'job_offers'
ORDER BY ordinal_position;

-- Check indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'job_offers'
ORDER BY indexname;

-- Check RLS policies
SELECT
    policyname,
    cmd,
    qual::text as using_clause,
    with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'job_offers'
ORDER BY policyname;

-- Check realtime publication
SELECT
    schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
    AND tablename = 'job_offers';

-- =====================================================
-- OPTIONAL: ADD TRIGGER TO AUTO-EXPIRE OLD OFFERS
-- =====================================================

-- Create function to expire old offers
CREATE OR REPLACE FUNCTION expire_old_job_offers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE job_offers
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$;

-- You can call this function from a cron job or trigger
-- Example cron (using pg_cron extension):
-- SELECT cron.schedule('expire-job-offers', '*/1 * * * *', 'SELECT expire_old_job_offers()');

-- =====================================================
-- TEST QUERIES
-- =====================================================

-- Count pending offers per driver
SELECT
    driver_uid,
    COUNT(*) as pending_offers
FROM job_offers
WHERE status = 'pending'
GROUP BY driver_uid;

-- View expired offers that need cleanup
SELECT
    id,
    job_id,
    driver_uid,
    status,
    expires_at,
    NOW() - expires_at as time_since_expired
FROM job_offers
WHERE status = 'pending'
    AND expires_at < NOW()
ORDER BY expires_at DESC;
