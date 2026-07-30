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
  is_restricted BOOLEAN DEFAULT false,
  restriction_reason TEXT,
  images TEXT[] DEFAULT '{}',
  license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
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
CREATE INDEX idx_vehicles_license_id ON vehicles(license_id);

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

-- RLS policies: permissive at DB level.
-- Tenant isolation is enforced client-side via addLicenseFilter().
CREATE POLICY "vehicles_all" ON vehicles FOR ALL USING (true) WITH CHECK (true);
