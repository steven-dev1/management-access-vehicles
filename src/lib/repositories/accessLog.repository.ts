import { supabase } from '../supabase';
import { AccessLog, AccessType, Vehicle } from '../../types';
import { getCurrentLicenseId } from './license-context';
import * as XLSX from 'xlsx';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { parseTimestamp } from '../../utils';

function formatPlate(plate: string): string {
  const clean = plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (clean.length === 6) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  if (clean.length === 7 && !clean.includes('-')) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  return clean;
}

function addLicenseFilter(query: any) {
  const lid = getCurrentLicenseId();
  if (lid) return query.eq('license_id', lid);
  return query;
}

export const accessLogRepository = {
  async logAccess(vehicleId: string, accessType: AccessType, plateScanned?: string): Promise<AccessLog> {
    const lid = getCurrentLicenseId();
    const insertData: any = {
      vehicle_id: vehicleId,
      access_type: accessType,
      plate_scanned: plateScanned || null,
    };
    if (lid) insertData.license_id = lid;

    const { data, error } = await supabase
      .from('access_logs')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getRecentLogs(limit: number = 20): Promise<AccessLog[]> {
    const { data, error } = await addLicenseFilter(
      supabase.from('access_logs').select('*, vehicle:vehicles(*)').order('timestamp', { ascending: false }).limit(limit)
    );

    if (error) throw error;
    return data || [];
  },

  async getLogsByVehicle(vehicleId: string): Promise<AccessLog[]> {
    const { data, error } = await addLicenseFilter(
      supabase.from('access_logs').select('*').eq('vehicle_id', vehicleId).order('timestamp', { ascending: false })
    );

    if (error) throw error;
    return data || [];
  },

  async getTodayLogs(): Promise<AccessLog[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await addLicenseFilter(
      supabase.from('access_logs').select('*, vehicle:vehicles(*)').gte('timestamp', today.toISOString()).order('timestamp', { ascending: false })
    );

    if (error) throw error;
    return data || [];
  },

  async getVehicleByPlate(plate: string): Promise<Vehicle | null> {
    const cleanPlate = plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    let query = addLicenseFilter(
      supabase.from('vehicles').select('*')
    );
    query = query.or(`license_plate.eq.${plate.toUpperCase()},license_plate.eq.${cleanPlate},license_plate.eq.${formatPlate(cleanPlate)}`);
    const { data, error } = await query.single();

    if (error) return null;
    return data;
  },

  async searchVehicles(query: string): Promise<Vehicle[]> {
    const cleanQuery = query.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    let vehicleQuery = addLicenseFilter(
      supabase.from('vehicles').select('*')
    );
    vehicleQuery = vehicleQuery
      .or(`license_plate.ilike.%${query}%,license_plate.ilike.%${cleanQuery}%`)
      .order('license_plate')
      .limit(10);
    const { data, error } = await vehicleQuery;

    if (error) throw error;
    return data || [];
  },

  async getLogsByApartment(tower: number, apartmentCode: string, limit: number = 50): Promise<AccessLog[]> {
    let vehicleQuery = addLicenseFilter(
      supabase.from('vehicles').select('id')
    );
    vehicleQuery = vehicleQuery.eq('tower', tower).eq('apartment_code', apartmentCode);
    const { data: vehicles, error: vError } = await vehicleQuery;

    if (vError) throw vError;
    if (!vehicles || vehicles.length === 0) return [];

    const vehicleIds = vehicles.map((v: any) => v.id);

    const { data, error } = await addLicenseFilter(
      supabase.from('access_logs')
        .select('*, vehicle:vehicles(*)')
        .in('vehicle_id', vehicleIds)
        .order('timestamp', { ascending: false })
        .limit(limit)
    );

    if (error) throw error;
    return data || [];
  },

  async getAccessStatsByDateRange(startDate: string, endDate: string): Promise<{ date: string; entries: number; exits: number }[]> {
    let query = addLicenseFilter(
      supabase.from('access_logs').select('access_type, timestamp')
    );
    query = query
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)
      .order('timestamp');
    const { data, error } = await query;

    if (error) throw error;

    const dateMap = new Map<string, { entries: number; exits: number }>();

    for (const log of data || []) {
      const date = parseTimestamp(log.timestamp).toISOString().split('T')[0];
      const existing = dateMap.get(date) || { entries: 0, exits: 0 };
      if (log.access_type === 'entry') existing.entries++;
      else existing.exits++;
      dateMap.set(date, existing);
    }

    return Array.from(dateMap.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  async exportLogsToCSV(startDate?: string, endDate?: string): Promise<string> {
    let query = addLicenseFilter(
      supabase.from('access_logs')
        .select('*, vehicle:vehicles(license_plate, vehicle_type, tower, apartment_code, owner_name)')
        .order('timestamp', { ascending: false })
    );

    if (startDate) query = query.gte('timestamp', startDate);
    if (endDate) query = query.lte('timestamp', endDate);

    const { data, error } = await query;
    if (error) throw error;

    const header = 'Fecha,Hora,Placa,Tipo,Torre,Apartamento,Propietario,Tipo Accion\n';
    const rows = (data || []).map((log: any) => {
      const date = parseTimestamp(log.timestamp);
      const dateStr = date.toLocaleDateString('es-ES');
      const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const v = log.vehicle;
      return `${dateStr},${timeStr},${v?.license_plate || ''},${v?.vehicle_type === 'car' ? 'Carro' : 'Moto'},${v?.tower || ''},${v?.apartment_code || ''},${v?.owner_name || ''},${log.access_type === 'entry' ? 'Entrada' : 'Salida'}`;
    }).join('\n');

    return header + rows;
  },

  async exportLogsToExcel(startDate?: string, endDate?: string): Promise<void> {
    let query = addLicenseFilter(
      supabase.from('access_logs')
        .select('*, vehicle:vehicles(license_plate, vehicle_type, tower, apartment_code, owner_name)')
        .order('timestamp', { ascending: false })
    );

    if (startDate) query = query.gte('timestamp', startDate);
    if (endDate) query = query.lte('timestamp', endDate);

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data || []).map((log: any) => {
      const date = parseTimestamp(log.timestamp);
      const v = log.vehicle;
      return {
        'Fecha': date.toLocaleDateString('es-ES'),
        'Hora': date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        'Placa': v?.license_plate || '',
        'Tipo': v?.vehicle_type === 'car' ? 'Carro' : 'Moto',
        'Torre': v?.tower || '',
        'Apartamento': v?.apartment_code || '',
        'Propietario': v?.owner_name || '',
        'Accion': log.access_type === 'entry' ? 'Entrada' : 'Salida',
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Historial');

    ws['!cols'] = [
      { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 8 },
      { wch: 6 }, { wch: 12 }, { wch: 20 }, { wch: 10 },
    ];

    const excelBuffer = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const uri = `${FileSystem.cacheDirectory}historial_accesos.xlsx`;
    await FileSystem.writeAsStringAsync(uri, excelBuffer, {
      encoding: FileSystem.EncodingType.Base64,
    });
    await Sharing.shareAsync(uri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Exportar historial',
    });
  },

  async exportLogsToPDF(startDate?: string, endDate?: string): Promise<void> {
    let query = addLicenseFilter(
      supabase.from('access_logs')
        .select('*, vehicle:vehicles(license_plate, vehicle_type, tower, apartment_code, owner_name)')
        .order('timestamp', { ascending: false })
    );

    if (startDate) query = query.gte('timestamp', startDate);
    if (endDate) query = query.lte('timestamp', endDate);

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data || []).map((log: any) => {
      const date = parseTimestamp(log.timestamp);
      const v = log.vehicle;
      const isEntry = log.access_type === 'entry';
      return `
        <tr>
          <td>${date.toLocaleDateString('es-ES')}</td>
          <td>${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</td>
          <td><strong>${v?.license_plate || ''}</strong></td>
          <td>${v?.vehicle_type === 'car' ? 'Carro' : 'Moto'}</td>
          <td>Torre ${v?.tower || ''}</td>
          <td>${v?.apartment_code || ''}</td>
          <td>${v?.owner_name || ''}</td>
          <td style="color: ${isEntry ? '#10B981' : '#EF4444'}; font-weight: bold;">${isEntry ? 'Entrada' : 'Salida'}</td>
        </tr>`;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, sans-serif; padding: 20px; color: #333; }
          h1 { font-size: 22px; margin-bottom: 4px; }
          .subtitle { color: #666; font-size: 12px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { background: #1A1A1A; color: white; padding: 8px 6px; text-align: left; }
          td { padding: 6px; border-bottom: 1px solid #eee; }
          tr:nth-child(even) { background: #f9f9f9; }
        </style>
      </head>
      <body>
        <h1>Historial de Accesos</h1>
        <p class="subtitle">Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
        <table>
          <thead>
            <tr>
              <th>Fecha</th><th>Hora</th><th>Placa</th><th>Tipo</th>
              <th>Torre</th><th>Apart.</th><th>Propietario</th><th>Accion</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top: 20px; font-size: 10px; color: #999;">Total: ${(data || []).length} registros</p>
      </body>
      </html>`;

    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Exportar historial',
    });
  },
};
