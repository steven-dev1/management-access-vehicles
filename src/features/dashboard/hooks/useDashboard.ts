import React, { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchStats, fetchTowerStats, fetchViolations, fetchVehicles, fetchOccupancyStats, fetchParkingAlerts, fetchRestrictedVehicles } from '../../../store/vehicleSlice';
import { accessLogRepository } from '../../../lib/repositories/accessLog.repository';
import { AccessLog, Vehicle } from '../../../types';

export const useDashboard = () => {
  const dispatch = useAppDispatch();
  const { stats, towerStats, violations, vehicles, occupancyStats, parkingAlerts, restrictedVehicles, loading, error } = useAppSelector(
    (state) => state.vehicles
  );
  const [accessLogs, setAccessLogs] = React.useState<AccessLog[]>([]);

  const loadAccessLogs = async () => {
    try {
      const logs = await accessLogRepository.getRecentLogs(200);
      setAccessLogs(logs);
    } catch {}
  };

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchStats());
      dispatch(fetchTowerStats());
      dispatch(fetchViolations());
      dispatch(fetchVehicles());
      dispatch(fetchOccupancyStats());
      dispatch(fetchParkingAlerts());
      dispatch(fetchRestrictedVehicles());
      loadAccessLogs();
    }, [dispatch])
  );

  const refresh = () => {
    dispatch(fetchStats());
    dispatch(fetchTowerStats());
    dispatch(fetchViolations());
    dispatch(fetchVehicles());
    dispatch(fetchOccupancyStats());
    dispatch(fetchParkingAlerts());
    dispatch(fetchRestrictedVehicles());
    loadAccessLogs();
  };

  return {
    stats,
    towerStats,
    violations,
    recentVehicles: vehicles.slice(0, 5),
    occupancyStats,
    parkingAlerts,
    restrictedVehicles,
    accessLogs,
    loading,
    error,
    refresh,
  };
};
