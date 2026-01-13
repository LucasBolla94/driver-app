-- =====================================================
-- EXECUTE ESTE SQL AGORA NO SUPABASE SQL EDITOR
-- =====================================================

-- 1. ADD online_status COLUMN
ALTER TABLE drivers_uk
ADD COLUMN IF NOT EXISTS online_status TEXT DEFAULT 'offline';

-- Add constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'drivers_uk_online_status_check'
    ) THEN
        ALTER TABLE drivers_uk
        ADD CONSTRAINT drivers_uk_online_status_check
        CHECK (online_status IN ('online', 'offline'));
    END IF;
END $$;

-- 2. ADD online_latitude COLUMN
ALTER TABLE drivers_uk
ADD COLUMN IF NOT EXISTS online_latitude DOUBLE PRECISION;

-- 3. ADD online_longitude COLUMN
ALTER TABLE drivers_uk
ADD COLUMN IF NOT EXISTS online_longitude DOUBLE PRECISION;

-- 4. SET ALL EXISTING DRIVERS TO OFFLINE
UPDATE drivers_uk
SET online_status = 'offline'
WHERE online_status IS NULL;

-- 5. VERIFY COLUMNS WERE CREATED
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'drivers_uk'
    AND column_name IN ('online_status', 'online_latitude', 'online_longitude')
ORDER BY ordinal_position;
