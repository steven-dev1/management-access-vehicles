import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { vehicleRepository } from '../lib/repositories/vehicle.repository';
import { Vehicle, VehicleFormData, DashboardStats, TowerStats, ApartmentViolation, FilterOptions, SortOption, OccupancyStats, ParkingAlert } from '../types';

interface VehicleState {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  stats: DashboardStats | null;
  towerStats: TowerStats[];
  violations: ApartmentViolation[];
  occupancyStats: OccupancyStats[];
  parkingAlerts: ParkingAlert[];
  restrictedVehicles: Vehicle[];
  filters: FilterOptions;
  sort: SortOption;
  loading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  totalCount: number;
}

const initialState: VehicleState = {
  vehicles: [],
  selectedVehicle: null,
  stats: null,
  towerStats: [],
  violations: [],
  occupancyStats: [],
  parkingAlerts: [],
  restrictedVehicles: [],
  filters: {},
  sort: 'newest',
  loading: false,
  error: null,
  page: 0,
  hasMore: true,
  totalCount: 0,
};

export const fetchVehicles = createAsyncThunk(
  'vehicles/fetchAll',
  async (_, { getState }) => {
    const state = getState() as { vehicles: VehicleState };
    return vehicleRepository.getAll(state.vehicles.filters, state.vehicles.sort, 0);
  }
);

export const fetchMoreVehicles = createAsyncThunk(
  'vehicles/fetchMore',
  async (_, { getState }) => {
    const state = getState() as { vehicles: VehicleState };
    const nextPage = state.vehicles.page + 1;
    const result = await vehicleRepository.getAll(state.vehicles.filters, state.vehicles.sort, nextPage);
    return { ...result, page: nextPage };
  }
);

export const fetchVehicleById = createAsyncThunk(
  'vehicles/fetchById',
  async (id: string) => {
    return vehicleRepository.getById(id);
  }
);

export const createVehicle = createAsyncThunk(
  'vehicles/create',
  async (vehicle: VehicleFormData) => {
    const isDuplicate = await vehicleRepository.checkDuplicatePlate(vehicle.license_plate);
    if (isDuplicate) {
      throw new Error('Ya existe un vehículo con esta placa');
    }
    return vehicleRepository.create(vehicle);
  }
);

export const updateVehicle = createAsyncThunk(
  'vehicles/update',
  async ({ id, vehicle }: { id: string; vehicle: VehicleFormData }) => {
    const isDuplicate = await vehicleRepository.checkDuplicatePlate(vehicle.license_plate, id);
    if (isDuplicate) {
      throw new Error('Ya existe un vehículo con esta placa');
    }
    return vehicleRepository.update(id, vehicle);
  }
);

export const deleteVehicle = createAsyncThunk(
  'vehicles/delete',
  async (id: string) => {
    await vehicleRepository.delete(id);
    return id;
  }
);

export const fetchStats = createAsyncThunk(
  'vehicles/fetchStats',
  async () => {
    return vehicleRepository.getStats();
  }
);

export const fetchTowerStats = createAsyncThunk(
  'vehicles/fetchTowerStats',
  async () => {
    return vehicleRepository.getTowerStats();
  }
);

export const fetchViolations = createAsyncThunk(
  'vehicles/fetchViolations',
  async () => {
    return vehicleRepository.getApartmentViolations();
  }
);

export const fetchOccupancyStats = createAsyncThunk(
  'vehicles/fetchOccupancyStats',
  async () => {
    return vehicleRepository.getOccupancyByTower();
  }
);

export const fetchParkingAlerts = createAsyncThunk(
  'vehicles/fetchParkingAlerts',
  async () => {
    return vehicleRepository.getParkingAlerts(30);
  }
);

export const fetchRestrictedVehicles = createAsyncThunk(
  'vehicles/fetchRestrictedVehicles',
  async () => {
    return vehicleRepository.getRestrictedVehicles();
  }
);

const vehicleSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<FilterOptions>) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setSort: (state, action: PayloadAction<SortOption>) => {
      state.sort = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    optimisticAdd: (state, action: PayloadAction<Vehicle>) => {
      state.vehicles.unshift(action.payload);
    },
    optimisticRemove: (state, action: PayloadAction<string>) => {
      state.vehicles = state.vehicles.filter(v => v.id !== action.payload);
    },
    optimisticUpdate: (state, action: PayloadAction<Vehicle>) => {
      const index = state.vehicles.findIndex(v => v.id === action.payload.id);
      if (index !== -1) {
        state.vehicles[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicles.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.page = 0;
      })
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.loading = false;
        state.vehicles = action.payload.data;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al cargar vehículos';
      })
      .addCase(fetchMoreVehicles.fulfilled, (state, action) => {
        state.vehicles = [...state.vehicles, ...action.payload.data];
        state.hasMore = action.payload.hasMore;
        state.page = action.payload.page;
      })
      .addCase(fetchVehicleById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicleById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedVehicle = action.payload;
      })
      .addCase(fetchVehicleById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al cargar vehículo';
      })
      .addCase(createVehicle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createVehicle.fulfilled, (state, action) => {
        state.loading = false;
        state.vehicles.unshift(action.payload);
      })
      .addCase(createVehicle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al crear vehículo';
      })
      .addCase(updateVehicle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateVehicle.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.vehicles.findIndex(v => v.id === action.payload.id);
        if (index !== -1) {
          state.vehicles[index] = action.payload;
        }
      })
      .addCase(updateVehicle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al actualizar vehículo';
      })
      .addCase(deleteVehicle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteVehicle.fulfilled, (state, action) => {
        state.loading = false;
        state.vehicles = state.vehicles.filter(v => v.id !== action.payload);
      })
      .addCase(deleteVehicle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al eliminar vehículo';
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(fetchTowerStats.fulfilled, (state, action) => {
        state.towerStats = action.payload;
      })
      .addCase(fetchViolations.fulfilled, (state, action) => {
        state.violations = action.payload;
      })
      .addCase(fetchOccupancyStats.fulfilled, (state, action) => {
        state.occupancyStats = action.payload;
      })
      .addCase(fetchParkingAlerts.fulfilled, (state, action) => {
        state.parkingAlerts = action.payload;
      })
      .addCase(fetchRestrictedVehicles.fulfilled, (state, action) => {
        state.restrictedVehicles = action.payload;
      });
  },
});

export const { setFilters, clearFilters, setSort, clearError, optimisticAdd, optimisticRemove, optimisticUpdate } = vehicleSlice.actions;
export default vehicleSlice.reducer;
