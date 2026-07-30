-- =============================================
-- ACCESS LOGS - Vehicle Entry/Exit Tracking
-- =============================================

CREATE TABLE access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  access_type VARCHAR(10) NOT NULL CHECK (access_type IN ('entry', 'exit')),
  plate_scanned VARCHAR(20),
  license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_access_logs_vehicle_id ON access_logs(vehicle_id);
CREATE INDEX idx_access_logs_timestamp ON access_logs(timestamp DESC);
CREATE INDEX idx_access_logs_access_type ON access_logs(access_type);
CREATE INDEX idx_access_logs_license_id ON access_logs(license_id);

-- RLS
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "access_logs_all" ON access_logs FOR ALL USING (true) WITH CHECK (true);
