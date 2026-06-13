import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchVehicles, fetchMoreVehicles, deleteVehicle, setFilters, clearFilters, setSort } from '../../../store/vehicleSlice';
import { FilterOptions, SortOption, Vehicle } from '../../../types';
import { Alert } from 'react-native';
import { useRealtimeVehicles } from '../../../hooks/useRealtime';

export const useVehicles = () => {
  const dispatch = useAppDispatch();
  const { vehicles, filters, sort, loading, error, hasMore, page } = useAppSelector(
    (state) => state.vehicles
  );

  useRealtimeVehicles();

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchVehicles());
    }, [dispatch, filters, sort])
  );

  const refresh = useCallback(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      dispatch(fetchMoreVehicles());
    }
  }, [dispatch, loading, hasMore]);

  const handleFilter = useCallback((newFilters: FilterOptions) => {
    dispatch(setFilters(newFilters));
  }, [dispatch]);

  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  const handleSort = useCallback((newSort: SortOption) => {
    dispatch(setSort(newSort));
  }, [dispatch]);

  const handleDelete = useCallback((vehicle: Vehicle) => {
    Alert.alert(
      'Eliminar vehículo',
      `¿Estás seguro de eliminar ${vehicle.license_plate}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteVehicle(vehicle.id)).unwrap();
            } catch (err) {
              Alert.alert('Error', 'No se pudo eliminar el vehículo');
            }
          },
        },
      ]
    );
  }, [dispatch]);

  return {
    vehicles,
    filters,
    sort,
    loading,
    error,
    hasMore,
    page,
    refresh,
    loadMore,
    handleFilter,
    handleClearFilters,
    handleSort,
    handleDelete,
  };
};
