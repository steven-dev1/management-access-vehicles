import { supabase } from '../supabase';
import { Vehicle, VehicleFormData, DashboardStats, TowerStats, ApartmentViolation, FilterOptions, SortOption, OccupancyStats, ParkingAlert } from '../../types';
import * as XLSX from 'xlsx';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

const PAGE_SIZE = 20;

export const vehicleRepository = {
  async getAll(filters?: FilterOptions, sort?: SortOption, page: number = 0): Promise<{ data: Vehicle[]; hasMore: boolean }> {
    let query = supabase
      .from('vehicles')
      .select('*');

    if (filters?.search) {
      query = query.ilike('license_plate', `%${filters.search}%`);
    }

    if (filters?.tower) {
      query = query.eq('tower', filters.tower);
    }

    if (filters?.apartment) {
      query = query.eq('apartment_code', filters.apartment);
    }

    if (filters?.vehicle_type) {
      query = query.eq('vehicle_type', filters.vehicle_type);
    }

    switch (sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'plate_asc':
        query = query.order('license_plate', { ascending: true });
        break;
      case 'plate_desc':
        query = query.order('license_plate', { ascending: false });
        break;
      case 'tower_asc':
        query = query.order('tower', { ascending: true }).order('apartment_code', { ascending: true });
        break;
      case 'tower_desc':
        query = query.order('tower', { ascending: false }).order('apartment_code', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data, error } = await query;

    if (error) throw error;
    return {
      data: data || [],
      hasMore: (data?.length || 0) === PAGE_SIZE,
    };
  },

  async getAllCount(filters?: FilterOptions): Promise<number> {
    let query = supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true });

    if (filters?.search) {
      query = query.ilike('license_plate', `%${filters.search}%`);
    }
    if (filters?.tower) {
      query = query.eq('tower', filters.tower);
    }
    if (filters?.apartment) {
      query = query.eq('apartment_code', filters.apartment);
    }
    if (filters?.vehicle_type) {
      query = query.eq('vehicle_type', filters.vehicle_type);
    }

    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  },

  async getById(id: string): Promise<Vehicle | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(vehicle: VehicleFormData): Promise<Vehicle> {
    const apartment_code = `${vehicle.floor * 100 +vehicle.apartment}`;

    const { data, error } = await supabase
      .from('vehicles')
      .insert({
        ...vehicle,
        apartment_code,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, vehicle: VehicleFormData): Promise<Vehicle> {
    const apartment_code = `${vehicle.floor * 100 + vehicle.apartment}`;

    const { data, error } = await supabase
      .from('vehicles')
      .update({
        ...vehicle,
        apartment_code,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getStats(): Promise<DashboardStats> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('vehicle_type');

    if (error) throw error;

    const vehicles = data || [];
    return {
      total_vehicles: vehicles.length,
      total_cars: vehicles.filter(v => v.vehicle_type === 'car').length,
      total_motorcycles: vehicles.filter(v => v.vehicle_type === 'motorcycle').length,
    };
  },

  async getTowerStats(): Promise<TowerStats[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('tower, vehicle_type');

    if (error) throw error;

    const vehicles = data || [];
    const towerMap = new Map<number, TowerStats>();

    for (const vehicle of vehicles) {
      const existing = towerMap.get(vehicle.tower) || {
        tower: vehicle.tower,
        total_vehicles: 0,
        total_cars: 0,
        total_motorcycles: 0,
      };

      existing.total_vehicles++;
      if (vehicle.vehicle_type === 'car') existing.total_cars++;
      if (vehicle.vehicle_type === 'motorcycle') existing.total_motorcycles++;

      towerMap.set(vehicle.tower, existing);
    }

    return Array.from(towerMap.values()).sort((a, b) => a.tower - b.tower);
  },

  async getApartmentViolations(): Promise<ApartmentViolation[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('apartment_code, tower, floor, apartment, vehicle_type');

    if (error) throw error;

    const vehicles = data || [];
    const apartmentMap = new Map<string, ApartmentViolation>();

    for (const vehicle of vehicles) {
      const key = `${vehicle.tower}-${vehicle.apartment_code}`;
      const existing = apartmentMap.get(key) || {
        apartment_code: vehicle.apartment_code,
        tower: vehicle.tower,
        floor: vehicle.floor,
        apartment: vehicle.apartment,
        vehicle_count: 0,
        car_count: 0,
        motorcycle_count: 0,
      };

      existing.vehicle_count++;
      if (vehicle.vehicle_type === 'car') existing.car_count++;
      if (vehicle.vehicle_type === 'motorcycle') existing.motorcycle_count++;

      apartmentMap.set(key, existing);
    }

    return Array.from(apartmentMap.values()).filter(
      v => v.vehicle_count > 2 || v.car_count > 1 || v.motorcycle_count > 1
    );
  },

  async checkDuplicatePlate(plate: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from('vehicles')
      .select('id')
      .eq('license_plate', plate.toUpperCase());

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data?.length || 0) > 0;
  },

  async exportViolationsToPDF(violations: ApartmentViolation[]): Promise<void> {
    const rows = violations.map(v => `
      <tr>
        <td>Torre ${v.tower}</td>
        <td>${v.apartment_code}</td>
        <td><strong>${v.vehicle_count}</strong></td>
        <td style="color: ${v.car_count > 1 ? '#EF4444' : '#333'}; font-weight: ${v.car_count > 1 ? 'bold' : 'normal'};">${v.car_count}</td>
        <td style="color: ${v.motorcycle_count > 1 ? '#EF4444' : '#333'}; font-weight: ${v.motorcycle_count > 1 ? 'bold' : 'normal'};">${v.motorcycle_count}</td>
        <td style="color: #EF4444; font-weight: bold;">${v.vehicle_count > 2 ? 'Excede total' : ''}${v.car_count > 1 ? ' / Excede autos' : ''}${v.motorcycle_count > 1 ? ' / Excede motos' : ''}</td>
      </tr>`).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, sans-serif; padding: 20px; color: #333; }
          h1 { font-size: 22px; margin-bottom: 4px; }
          .subtitle { color: #666; font-size: 12px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #1A1A1A; color: white; padding: 10px 8px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #eee; }
          tr:nth-child(even) { background: #fef3c7; }
        </style>
      </head>
      <body>
        <h1>Apartamentos que exceden límites</h1>
        <p class="subtitle">Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
        <table>
          <thead>
            <tr>
              <th>Torre</th><th>Apartamento</th><th>Total vehículos</th>
              <th>Autos</th><th>Motos</th><th>Incumplimiento</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top: 20px; font-size: 10px; color: #999;">Total: ${violations.length} apartamentos con excedentes</p>
      </body>
      </html>`;

    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Exportar violaciones',
    });
  },

  async exportViolationsToExcel(violations: ApartmentViolation[]): Promise<void> {
    const rows = violations.map(v => ({
      'Torre': v.tower,
      'Apartamento': v.apartment_code,
      'Total vehículos': v.vehicle_count,
      'Autos': v.car_count,
      'Motos': v.motorcycle_count,
      'Incumplimiento': [
        v.vehicle_count > 2 ? 'Excede total' : '',
        v.car_count > 1 ? 'Excede autos' : '',
        v.motorcycle_count > 1 ? 'Excede motos' : '',
      ].filter(Boolean).join(' / '),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Violaciones');

    ws['!cols'] = [
      { wch: 8 }, { wch: 14 }, { wch: 16 },
      { wch: 8 }, { wch: 8 }, { wch: 30 },
    ];

    const excelBuffer = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const uri = `${FileSystem.cacheDirectory}violaciones.xlsx`;
    await FileSystem.writeAsStringAsync(uri, excelBuffer, {
      encoding: FileSystem.EncodingType.Base64,
    });
    await Sharing.shareAsync(uri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Exportar violaciones',
    });
  },

  async toggleRestriction(vehicleId: string, isRestricted: boolean, reason?: string): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .update({ is_restricted: isRestricted, restriction_reason: reason || null })
      .eq('id', vehicleId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getRestrictedVehicles(): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('is_restricted', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getOccupancyByTower(): Promise<OccupancyStats[]> {
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select('tower, floor, apartment, vehicle_type, apartment_code');
    if (error) throw error;

    const totalApartments = 20; // 5 floors * 4 apartments
    const towerMap = new Map<number, { apartments: Set<string>; cars: number; motorcycles: number; total: number }>();

    for (let t = 1; t <= 14; t++) {
      towerMap.set(t, { apartments: new Set(), cars: 0, motorcycles: 0, total: 0 });
    }

    for (const v of vehicles || []) {
      const stats = towerMap.get(v.tower);
      if (!stats) continue;
      stats.apartments.add(v.apartment_code);
      stats.total++;
      if (v.vehicle_type === 'car') stats.cars++;
      else stats.motorcycles++;
    }

    return Array.from(towerMap.entries()).map(([tower, stats]) => ({
      tower,
      total_apartments: totalApartments,
      occupied_apartments: stats.apartments.size,
      total_vehicles: stats.total,
      car_count: stats.cars,
      motorcycle_count: stats.motorcycles,
      occupancy_rate: Math.round((stats.apartments.size / totalApartments) * 100),
    }));
  },

  async getParkingAlerts(daysThreshold: number = 30): Promise<ParkingAlert[]> {
    const { data: vehicles, error: vErr } = await supabase
      .from('vehicles')
      .select('id, license_plate, owner_name, tower, apartment_code, vehicle_type');
    if (vErr) throw vErr;

    const alerts: ParkingAlert[] = [];
    const now = new Date();

    for (const vehicle of vehicles || []) {
      const { data: logs } = await supabase
        .from('access_logs')
        .select('access_type, timestamp')
        .eq('vehicle_id', vehicle.id)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (!logs || logs.length === 0) continue;

      let lastEntry: string | null = null;
      let hasExitAfterEntry = false;

      for (const log of logs) {
        if (log.access_type === 'entry' && !lastEntry) {
          lastEntry = log.timestamp;
        } else if (log.access_type === 'exit' && lastEntry) {
          hasExitAfterEntry = true;
          break;
        }
      }

      if (lastEntry && !hasExitAfterEntry) {
        const entryDate = new Date(lastEntry);
        const diffDays = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= daysThreshold) {
          alerts.push({
            vehicle_id: vehicle.id,
            license_plate: vehicle.license_plate,
            owner_name: vehicle.owner_name,
            tower: vehicle.tower,
            apartment_code: vehicle.apartment_code,
            vehicle_type: vehicle.vehicle_type,
            last_entry: lastEntry,
            days_parked: diffDays,
          });
        }
      }
    }

    return alerts.sort((a, b) => b.days_parked - a.days_parked);
  },
};
