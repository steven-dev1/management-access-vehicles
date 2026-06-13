-- =============================================
-- BLACKLIST - Vehicle Restrictions
-- =============================================

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_restricted BOOLEAN DEFAULT FALSE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS restriction_reason TEXT;

CREATE INDEX idx_vehicles_restricted ON vehicles(is_restricted) WHERE is_restricted = TRUE;
