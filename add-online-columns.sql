-- =====================================================
-- ADD ONLINE STATUS COLUMNS TO drivers_uk TABLE
-- =====================================================

-- 1. ADD online_status COLUMN
ALTER TABLE drivers_uk
ADD COLUMN IF NOT EXISTS online_status TEXT DEFAULT 'offline'
CHECK (online_status IN ('online', 'offline'));

-- 2. ADD online_latitude COLUMN
ALTER TABLE drivers_uk
ADD COLUMN IF NOT EXISTS online_latitude DOUBLE PRECISION;

-- 3. ADD online_longitude COLUMN
ALTER TABLE drivers_uk
ADD COLUMN IF NOT EXISTS online_longitude DOUBLE PRECISION;

-- 4. ADD last_location_update COLUMN (to track when location was last updated)
ALTER TABLE drivers_uk
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. ADD COMMENTS TO COLUMNS
COMMENT ON COLUMN drivers_uk.online_status IS 'Driver online/offline status';
COMMENT ON COLUMN drivers_uk.online_latitude IS 'Driver current latitude when online';
COMMENT ON COLUMN drivers_uk.online_longitude IS 'Driver current longitude when online';
COMMENT ON COLUMN drivers_uk.last_location_update IS 'Last time driver location was updated';

-- 6. CREATE INDEX for faster queries on online drivers
CREATE INDEX IF NOT EXISTS idx_drivers_uk_online_status
ON drivers_uk(online_status)
WHERE online_status = 'online';

-- 7. VERIFY COLUMNS WERE CREATED
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'drivers_uk'
    AND column_name IN ('online_status', 'online_latitude', 'online_longitude', 'last_location_update')
ORDER BY ordinal_position;

-- 8. SET ALL EXISTING DRIVERS TO OFFLINE (if needed)
UPDATE drivers_uk
SET online_status = 'offline'
WHERE online_status IS NULL;
