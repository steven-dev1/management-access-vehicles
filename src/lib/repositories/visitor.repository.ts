import { supabase } from '../supabase';
import { Visitor, VisitorFormData } from '../../types';
import { parseTimestamp } from '../../utils';

export const visitorRepository = {
  async getAll(limit?: number): Promise<Visitor[]> {
    let query = supabase
      .from('visitors')
      .select('*')
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Visitor[];
  },

  async getActive(): Promise<Visitor[]> {
    const { data, error } = await supabase
      .from('visitors')
      .select('*')
      .in('status', ['active', 'expected'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Visitor[];
  },

  async getByHost(tower: number, apartmentCode: string): Promise<Visitor[]> {
    const { data, error } = await supabase
      .from('visitors')
      .select('*')
      .eq('host_tower', tower)
      .eq('host_apartment_code', apartmentCode)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Visitor[];
  },

  async create(data: VisitorFormData): Promise<Visitor> {
    const { data: newVisitor, error } = await supabase
      .from('visitors')
      .insert({
        visitor_plate: data.visitor_plate,
        visitor_name: data.visitor_name,
        host_tower: data.host_tower,
        host_apartment_code: data.host_apartment_code,
        host_owner_name: data.host_owner_name,
        purpose: data.purpose,
        expected_duration_hours: data.expected_duration_hours,
        status: 'active',
        entry_time: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return newVisitor as Visitor;
  },

  async checkIn(id: string): Promise<Visitor> {
    const { data, error } = await supabase
      .from('visitors')
      .update({
        status: 'active',
        entry_time: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Visitor;
  },

  async checkOut(id: string): Promise<Visitor> {
    const { data, error } = await supabase
      .from('visitors')
      .update({
        status: 'completed',
        exit_time: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Visitor;
  },

  async update(id: string, data: Partial<VisitorFormData>): Promise<Visitor> {
    const { data: updated, error } = await supabase
      .from('visitors')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updated as Visitor;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('visitors')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async search(query: string): Promise<Visitor[]> {
    const { data, error } = await supabase
      .from('visitors')
      .select('*')
      .or(`visitor_plate.ilike.%${query}%,visitor_name.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Visitor[];
  },

  async getExpiredVisitors(): Promise<Visitor[]> {
    const { data, error } = await supabase
      .from('visitors')
      .select('*')
      .eq('status', 'active');

    if (error) throw error;

    const visitors = data as Visitor[];
    const now = new Date();

    return visitors.filter((visitor) => {
      if (!visitor.entry_time || !visitor.expected_duration_hours) return false;
      const entryTime = parseTimestamp(visitor.entry_time);
      const expectedEnd = new Date(
        entryTime.getTime() + visitor.expected_duration_hours * 60 * 60 * 1000
      );
      return expectedEnd < now;
    });
  },

  async getStats(): Promise<{
    total: number;
    active: number;
    expected: number;
    completed: number;
    expired: number;
  }> {
    const allVisitors = await this.getAll();
    const expiredVisitors = await this.getExpiredVisitors();

    return {
      total: allVisitors.length,
      active: allVisitors.filter((v) => v.status === 'active').length,
      expected: allVisitors.filter((v) => v.status === 'expected').length,
      completed: allVisitors.filter((v) => v.status === 'completed').length,
      expired: expiredVisitors.length,
    };
  },

  async exportVisitorsToCSV(visitors: Visitor[]): Promise<void> {
    const { shareAsync } = await import('expo-sharing');
    const FileSystem = await import('expo-file-system/legacy');

    const headers = [
      'Placa',
      'Nombre',
      'Torre',
      'Apartamento',
      'Residente',
      'Propósito',
      'Duración',
      'Estado',
      'Entrada',
      'Salida',
    ];

    const rows = visitors.map((visitor) => [
      visitor.visitor_plate,
      visitor.visitor_name,
      visitor.host_tower?.toString() ?? '',
      visitor.host_apartment_code ?? '',
      visitor.host_owner_name ?? '',
      visitor.purpose ?? '',
      visitor.expected_duration_hours?.toString() ?? '',
      visitor.status,
      visitor.entry_time ? parseTimestamp(visitor.entry_time).toLocaleString() : '',
      visitor.exit_time ? parseTimestamp(visitor.exit_time).toLocaleString() : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${(cell ?? '').replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const fileUri = FileSystem.cacheDirectory + 'visitors.csv';
    await FileSystem.writeAsStringAsync(fileUri, csvContent);

    await shareAsync(fileUri, { UTI: 'public.comma-separated-values-text' });
  },

  async exportVisitorsToExcel(visitors: Visitor[]): Promise<void> {
    const XLSX = await import('xlsx');
    const FileSystem = await import('expo-file-system/legacy');
    const { shareAsync } = await import('expo-sharing');

    const rows = visitors.map((visitor) => ({
      Placa: visitor.visitor_plate,
      Nombre: visitor.visitor_name,
      Torre: visitor.host_tower,
      Apartamento: visitor.host_apartment_code,
      Residente: visitor.host_owner_name,
      Propósito: visitor.purpose,
      Duración: visitor.expected_duration_hours,
      Estado: visitor.status,
      Entrada: visitor.entry_time
        ? parseTimestamp(visitor.entry_time).toLocaleString()
        : '',
      Salida: visitor.exit_time
        ? parseTimestamp(visitor.exit_time).toLocaleString()
        : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Visitors');

    const excelBuffer = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    const fileUri = FileSystem.cacheDirectory + 'visitors.xlsx';
    await FileSystem.writeAsStringAsync(fileUri, excelBuffer, {
      encoding: FileSystem.EncodingType.Base64,
    });

    await shareAsync(fileUri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Exportar visitantes',
    });
  },
};
