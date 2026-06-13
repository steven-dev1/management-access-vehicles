-- =============================================
-- MIGRATION: Remove apartment limit trigger
-- The app now handles warnings in the frontend
-- =============================================

-- Drop the trigger that blocks inserts
DROP TRIGGER IF EXISTS enforce_apartment_vehicle_limit ON vehicles;

-- Drop the function
DROP FUNCTION IF EXISTS check_apartment_vehicle_limit();
