export type VehicleType = 'car' | 'motorcycle';

export interface Vehicle {
  id: string;
  license_id: string;
  license_plate: string;
  vehicle_type: VehicleType;
  tower: number;
  floor: number;
  apartment: number;
  apartment_code: string;
  owner_name: string;
  images: string[];
  is_restricted: boolean;
  restriction_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleFormData {
  license_plate: string;
  vehicle_type: VehicleType;
  tower: number;
  floor: number;
  apartment: number;
  owner_name: string;
  is_restricted: boolean;
  restriction_reason: string;
}

export interface DashboardStats {
  total_vehicles: number;
  total_cars: number;
  total_motorcycles: number;
}

export interface TowerStats {
  tower: number;
  total_vehicles: number;
  total_cars: number;
  total_motorcycles: number;
}

export interface ApartmentViolation {
  apartment_code: string;
  tower: number;
  floor: number;
  apartment: number;
  vehicle_count: number;
  car_count: number;
  motorcycle_count: number;
}

export interface FilterOptions {
  tower?: number;
  apartment?: string;
  vehicle_type?: VehicleType;
  search?: string;
}

export type SortOption = 'newest' | 'oldest' | 'plate_asc' | 'plate_desc' | 'tower_asc' | 'tower_desc';

export type AccessType = 'entry' | 'exit';

export interface AccessLog {
  id: string;
  license_id: string;
  vehicle_id: string;
  access_type: AccessType;
  plate_scanned: string | null;
  timestamp: string;
  created_at: string;
  vehicle?: Vehicle;
}

export interface AccessLogWithVehicle extends AccessLog {
  vehicle: Vehicle;
}

export type VisitorStatus = 'expected' | 'active' | 'completed' | 'expired';

export interface Visitor {
  id: string;
  license_id: string;
  visitor_plate: string;
  visitor_name: string;
  host_apartment_code: string;
  host_tower: number;
  host_owner_name: string;
  purpose: string | null;
  expected_duration_hours: number;
  status: VisitorStatus;
  entry_time: string | null;
  exit_time: string | null;
  created_at: string;
}

export interface VisitorFormData {
  visitor_plate: string;
  visitor_name: string;
  host_tower: number;
  host_apartment_code: string;
  host_owner_name: string;
  purpose: string;
  expected_duration_hours: number;
}

export interface OccupancyStats {
  tower: number;
  total_apartments: number;
  occupied_apartments: number;
  total_vehicles: number;
  car_count: number;
  motorcycle_count: number;
  occupancy_rate: number;
}

export interface ParkingAlert {
  vehicle_id: string;
  license_plate: string;
  owner_name: string;
  tower: number;
  apartment_code: string;
  vehicle_type: VehicleType;
  last_entry: string;
  days_parked: number;
}

export interface License {
  id: string;
  license_key: string;
  complex_name: string;
  max_devices: number;
  active: boolean;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LicenseDevice {
  id: string;
  license_id: string;
  device_id: string;
  device_name: string | null;
  active: boolean;
  registered_at: string;
}

export interface LicenseValidation {
  valid: boolean;
  license: License | null;
  deviceRegistered: boolean;
  devicesUsed: number;
  maxDevices: number;
  error?: string;
}
