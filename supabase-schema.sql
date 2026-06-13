-- =============================================
-- VEHICLE ACCESS MANAGEMENT - SUPABASE SCHEMA
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE: vehicles
-- =============================================
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_plate VARCHAR(20) NOT NULL UNIQUE,
  vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('car', 'motorcycle')),
  tower INTEGER NOT NULL CHECK (tower >= 1 AND tower <= 14),
  floor INTEGER NOT NULL CHECK (floor >= 1 AND floor <= 5),
  apartment INTEGER NOT NULL CHECK (apartment >= 1 AND apartment <= 4),
  apartment_code VARCHAR(10) NOT NULL,
  owner_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX idx_vehicles_tower ON vehicles(tower);
CREATE INDEX idx_vehicles_apartment_code ON vehicles(apartment_code);
CREATE INDEX idx_vehicles_vehicle_type ON vehicles(vehicle_type);
CREATE INDEX idx_vehicles_created_at ON vehicles(created_at DESC);

-- =============================================
-- FUNCTION: Update updated_at timestamp
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- TRIGGER: Auto-update updated_at
-- =============================================
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated and anonymous users
-- In production, you may want to restrict this further
CREATE POLICY "Allow all operations on vehicles"
  ON vehicles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =============================================
-- VIEW: Dashboard statistics
-- =============================================
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM vehicles) as total_vehicles,
  (SELECT COUNT(*) FROM vehicles WHERE vehicle_type = 'car') as total_cars,
  (SELECT COUNT(*) FROM vehicles WHERE vehicle_type = 'motorcycle') as total_motorcycles;

-- =============================================
-- VIEW: Vehicles per tower
-- =============================================
CREATE OR REPLACE VIEW vehicles_per_tower AS
SELECT
  tower,
  COUNT(*) as total_vehicles,
  COUNT(*) FILTER (WHERE vehicle_type = 'car') as total_cars,
  COUNT(*) FILTER (WHERE vehicle_type = 'motorcycle') as total_motorcycles
FROM vehicles
GROUP BY tower
ORDER BY tower;

-- =============================================
-- VIEW: Apartments exceeding limits
-- =============================================
CREATE OR REPLACE VIEW apartments_exceeding_limits AS
SELECT
  apartment_code,
  tower,
  floor,
  apartment,
  COUNT(*) as vehicle_count,
  COUNT(*) FILTER (WHERE vehicle_type = 'car') as car_count,
  COUNT(*) FILTER (WHERE vehicle_type = 'motorcycle') as motorcycle_count
FROM vehicles
GROUP BY apartment_code, tower, floor, apartment
HAVING COUNT(*) > 2
   OR COUNT(*) FILTER (WHERE vehicle_type = 'car') > 1
   OR COUNT(*) FILTER (WHERE vehicle_type = 'motorcycle') > 1;
