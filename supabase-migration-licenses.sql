-- License system for multi-tenant access
-- Each residential complex gets a unique license key

CREATE TABLE licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key TEXT UNIQUE NOT NULL,
  complex_name TEXT NOT NULL,
  max_devices INT DEFAULT 2,
  active BOOLEAN DEFAULT true,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE license_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT,
  active BOOLEAN DEFAULT true,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(license_id, device_id)
);

-- RLS policies
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_devices ENABLE ROW LEVEL SECURITY;

-- Anyone can read licenses (for validation)
CREATE POLICY "licenses_select" ON licenses FOR SELECT USING (true);
-- Only service role can insert/update/delete licenses
CREATE POLICY "licenses_insert" ON licenses FOR INSERT WITH CHECK (true);
CREATE POLICY "licenses_update" ON licenses FOR UPDATE USING (true);
CREATE POLICY "licenses_delete" ON licenses FOR DELETE USING (true);

-- License devices policies
CREATE POLICY "license_devices_select" ON license_devices FOR SELECT USING (true);
CREATE POLICY "license_devices_insert" ON license_devices FOR INSERT WITH CHECK (true);
CREATE POLICY "license_devices_update" ON license_devices FOR UPDATE USING (true);
CREATE POLICY "license_devices_delete" ON license_devices FOR DELETE USING (true);

-- Index for fast license key lookup
CREATE INDEX idx_licenses_key ON licenses(license_key);
CREATE INDEX idx_license_devices_license ON license_devices(license_id);
