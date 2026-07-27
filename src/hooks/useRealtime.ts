import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAppDispatch } from '../store/hooks';
import { fetchVehicles, fetchStats, fetchTowerStats, fetchViolations } from '../store/vehicleSlice';

type Table = 'vehicles' | 'access_logs' | 'visitors' | 'licenses' | 'license_devices';

export const useRealtime = (tables: Table[], onDataChanged: () => void) => {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const callbackRef = useRef(onDataChanged);
  callbackRef.current = onDataChanged;

  useEffect(() => {
    const channel = supabase.channel(`db-changes-${tables.join('-')}`);

    tables.forEach((table) => {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          callbackRef.current();
        }
      );
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [tables.join(',')]);
};

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

export const useRealtimeVisitors = (onChanged?: () => void) => {
  const channelRef = useRef<any>(null);
  const callbackRef = useRef(onChanged);
  callbackRef.current = onChanged;

  useEffect(() => {
    channelRef.current = supabase
      .channel('visitors-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visitors' },
        () => {
          callbackRef.current?.();
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);
};
