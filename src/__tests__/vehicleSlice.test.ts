jest.mock('../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

jest.mock('../lib/repositories/vehicle.repository', () => ({
  vehicleRepository: {},
}));

import reducer, {
  setFilters,
  clearFilters,
  setSort,
  clearError,
  optimisticAdd,
  optimisticRemove,
  optimisticUpdate,
} from '../store/vehicleSlice';
import { Vehicle, FilterOptions } from '../types';

const initialState = {
  vehicles: [],
  selectedVehicle: null,
  stats: null,
  towerStats: [],
  violations: [],
  occupancyStats: [],
  parkingAlerts: [],
  restrictedVehicles: [],
  filters: {} as FilterOptions,
  sort: 'newest' as const,
  loading: false,
  error: null,
  page: 0,
  hasMore: true,
  totalCount: 0,
};

const mockVehicle: Vehicle = {
  id: '1',
  license_id: 'lic-1',
  license_plate: 'ABC-123',
  vehicle_type: 'car',
  tower: 1,
  floor: 1,
  apartment: 1,
  apartment_code: '101',
  owner_name: 'Test Owner',
  images: [],
  is_restricted: false,
  restriction_reason: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('vehicleSlice reducers', () => {
  it('setFilters updates filters', () => {
    const filters: FilterOptions = { tower: 1, vehicle_type: 'car' };
    const state = reducer(initialState, setFilters(filters));
    expect(state.filters).toEqual(filters);
  });

  it('clearFilters resets filters to empty', () => {
    const stateWithFilters = { ...initialState, filters: { tower: 1 } };
    const state = reducer(stateWithFilters, clearFilters());
    expect(state.filters).toEqual({});
  });

  it('setSort changes sort', () => {
    const state = reducer(initialState, setSort('plate_asc'));
    expect(state.sort).toBe('plate_asc');
  });

  it('clearError clears error', () => {
    const stateWithError = { ...initialState, error: 'Some error' };
    const state = reducer(stateWithError, clearError());
    expect(state.error).toBeNull();
  });

  it('optimisticAdd adds vehicle to beginning', () => {
    const stateWithVehicles = { ...initialState, vehicles: [mockVehicle] };
    const newVehicle = { ...mockVehicle, id: '2', license_plate: 'DEF-456' };
    const state = reducer(stateWithVehicles, optimisticAdd(newVehicle));
    expect(state.vehicles[0].id).toBe('2');
    expect(state.vehicles).toHaveLength(2);
  });

  it('optimisticRemove removes vehicle by id', () => {
    const stateWithVehicles = { ...initialState, vehicles: [mockVehicle] };
    const state = reducer(stateWithVehicles, optimisticRemove('1'));
    expect(state.vehicles).toHaveLength(0);
  });

  it('optimisticUpdate replaces vehicle by id', () => {
    const stateWithVehicles = { ...initialState, vehicles: [mockVehicle] };
    const updatedVehicle = { ...mockVehicle, owner_name: 'Updated Name' };
    const state = reducer(stateWithVehicles, optimisticUpdate(updatedVehicle));
    expect(state.vehicles[0].owner_name).toBe('Updated Name');
  });

  it('optimisticUpdate does nothing if id not found', () => {
    const stateWithVehicles = { ...initialState, vehicles: [mockVehicle] };
    const otherVehicle = { ...mockVehicle, id: '999' };
    const state = reducer(stateWithVehicles, optimisticUpdate(otherVehicle));
    expect(state.vehicles).toHaveLength(1);
    expect(state.vehicles[0].id).toBe('1');
  });
});
