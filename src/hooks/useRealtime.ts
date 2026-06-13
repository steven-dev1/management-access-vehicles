import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAppDispatch } from '../store/hooks';
import { fetchVehicles, fetchStats, fetchTowerStats, fetchViolations } from '../store/vehicleSlice';

export const useRealtimeVehicles = () => {
  const dispatch = useAppDispatch();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    channelRef.current = supabase
      .channel('vehicles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vehicles' },
        () => {
          dispatch(fetchVehicles());
          dispatch(fetchStats());
          dispatch(fetchTowerStats());
          dispatch(fetchViolations());
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [dispatch]);
};

export const useRealtimeAccessLogs = (onNewLog?: () => void) => {
  const channelRef = useRef<any>(null);

  useEffect(() => {
    channelRef.current = supabase
      .channel('access-logs-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'access_logs' },
        () => {
          onNewLog?.();
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [onNewLog]);
};
