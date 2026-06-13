-- =============================================
-- VISITORS - Guest Vehicle Management
-- =============================================

CREATE TABLE visitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_plate VARCHAR(20) NOT NULL,
  visitor_name VARCHAR(100) NOT NULL,
  host_apartment_code VARCHAR(10) NOT NULL,
  host_tower INTEGER NOT NULL CHECK (host_tower >= 1 AND host_tower <= 14),
  host_owner_name VARCHAR(100) NOT NULL,
  purpose VARCHAR(100),
  expected_duration_hours INTEGER DEFAULT 24,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('expected', 'active', 'completed', 'expired')),
  entry_time TIMESTAMP WITH TIME ZONE,
  exit_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_visitors_plate ON visitors(visitor_plate);
CREATE INDEX idx_visitors_status ON visitors(status);
CREATE INDEX idx_visitors_host ON visitors(host_tower, host_apartment_code);
CREATE INDEX idx_visitors_created ON visitors(created_at DESC);

-- RLS
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on visitors"
  ON visitors
  FOR ALL
  USING (true)
  WITH CHECK (true);
