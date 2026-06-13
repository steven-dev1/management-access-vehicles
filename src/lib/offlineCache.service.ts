import * as FileSystem from 'expo-file-system/legacy';
import { Vehicle, AccessLog, Visitor } from '../types';

interface SyncAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: 'vehicles' | 'access_logs' | 'visitors';
  data: any;
  timestamp: string;
}

const CACHE_DIR = FileSystem.cacheDirectory + 'offline_cache/';

async function ensureCacheDir() {
  const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

async function saveJson<T>(filename: string, data: T): Promise<void> {
  await ensureCacheDir();
  await FileSystem.writeAsStringAsync(
    CACHE_DIR + filename,
    JSON.stringify(data)
  );
}

async function loadJson<T>(filename: string): Promise<T | null> {
  try {
    const path = CACHE_DIR + filename;
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return null;
    const content = await FileSystem.readAsStringAsync(path);
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export const offlineCacheService = {
  async saveVehicles(vehicles: Vehicle[]): Promise<void> {
    try {
      await saveJson('vehicles.json', vehicles);
    } catch {}
  },

  async getVehicles(): Promise<Vehicle[] | null> {
    try {
      return await loadJson<Vehicle[]>('vehicles.json');
    } catch {
      return null;
    }
  },

  async saveAccessLogs(logs: AccessLog[]): Promise<void> {
    try {
      await saveJson('access_logs.json', logs);
    } catch {}
  },

  async getAccessLogs(): Promise<AccessLog[] | null> {
    try {
      return await loadJson<AccessLog[]>('access_logs.json');
    } catch {
      return null;
    }
  },

  async saveVisitors(visitors: Visitor[]): Promise<void> {
    try {
      await saveJson('visitors.json', visitors);
    } catch {}
  },

  async getVisitors(): Promise<Visitor[] | null> {
    try {
      return await loadJson<Visitor[]>('visitors.json');
    } catch {
      return null;
    }
  },

  async saveDashboardData(data: {
    stats: any;
    towerStats: any;
    violations: any;
    occupancyStats: any;
  }): Promise<void> {
    try {
      await saveJson('dashboard.json', data);
    } catch {}
  },

  async getDashboardData(): Promise<object | null> {
    try {
      return await loadJson<object>('dashboard.json');
    } catch {
      return null;
    }
  },

  async saveSyncQueue(queue: SyncAction[]): Promise<void> {
    try {
      await saveJson('sync_queue.json', queue);
    } catch {}
  },

  async getSyncQueue(): Promise<SyncAction[]> {
    try {
      const queue = await loadJson<SyncAction[]>('sync_queue.json');
      return queue ?? [];
    } catch {
      return [];
    }
  },

  async addToSyncQueue(action: SyncAction): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      queue.push(action);
      await this.saveSyncQueue(queue);
    } catch {}
  },

  async clearSyncQueue(): Promise<void> {
    try {
      await saveJson('sync_queue.json', []);
    } catch {}
  },

  async clearAll(): Promise<void> {
    try {
      const files = [
        'vehicles.json',
        'access_logs.json',
        'visitors.json',
        'dashboard.json',
        'sync_queue.json',
      ];
      for (const file of files) {
        const path = CACHE_DIR + file;
        const info = await FileSystem.getInfoAsync(path);
        if (info.exists) {
          await FileSystem.deleteAsync(path);
        }
      }
    } catch {}
  },
};
