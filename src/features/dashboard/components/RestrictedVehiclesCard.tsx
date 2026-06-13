import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, getTowerColor } from '../../../constants';
import { Vehicle } from '../../../types';
import { vehicleRepository } from '../../../lib/repositories/vehicle.repository';

interface RestrictedVehiclesCardProps {
  vehicles: Vehicle[];
  onPress: (vehicle: Vehicle) => void;
}

export const RestrictedVehiclesCard: React.FC<RestrictedVehiclesCardProps> = ({ vehicles, onPress }) => {
  const [expanded, setExpanded] = useState(false);

  if (!vehicles.length) return null;

  const displayVehicles = expanded ? vehicles : vehicles.slice(0, 5);

  const handleExport = () => {
    Alert.alert('Exportar restringidos', 'Selecciona el formato:', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'PDF',
        onPress: async () => {
          try {
            const rows = vehicles.map(v =>
              `<tr><td>${v.license_plate}</td><td>${v.vehicle_type === 'car' ? 'Carro' : 'Moto'}</td><td>T${v.tower} - ${v.apartment_code}</td><td>${v.owner_name}</td><td>${v.restriction_reason || '-'}</td></tr>`
            ).join('');
            const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,sans-serif;padding:20px;color:#333}h1{font-size:20px;color:#EF4444}table{width:100%;border-collapse:collapse;font-size:12px;margin-top:16px}th{background:#1A1A1A;color:white;padding:8px;text-align:left}td{padding:6px;border-bottom:1px solid #eee}</style></head><body><h1>Vehículos Restringidos</h1><table><thead><tr><th>Placa</th><th>Tipo</th><th>Ubicación</th><th>Propietario</th><th>Motivo</th></tr></thead><tbody>${rows}</tbody></table><p style="margin-top:16px;font-size:10px;color:#999">Total: ${vehicles.length} vehículos</p></body></html>`;
            const Print = await import('expo-print');
            const Sharing = await import('expo-sharing');
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Vehículos restringidos' });
          } catch {
            Alert.alert('Error', 'No se pudo exportar el PDF');
          }
        },
      },
      {
        text: 'Excel (.xlsx)',
        onPress: async () => {
          try {
            await vehicleRepository.exportViolationsToExcel([]);
          } catch {
            Alert.alert('Error', 'No se pudo exportar el Excel');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Ionicons name="shield" size={18} color={COLORS.danger} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Lista negra</Text>
          <Text style={styles.subtitle}>{vehicles.length} vehículo{vehicles.length !== 1 ? 's' : ''} restringido{vehicles.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      <View style={styles.list}>
        {displayVehicles.map((vehicle) => {
          const towerColor = getTowerColor(vehicle.tower);
          return (
            <TouchableOpacity
              key={vehicle.id}
              style={styles.vehicleCard}
              onPress={() => onPress(vehicle)}
              activeOpacity={0.7}
            >
              <View style={styles.vehicleLeft}>
                <View style={[styles.typeIcon, { backgroundColor: towerColor + '20' }]}>
                  <Ionicons
                    name={vehicle.vehicle_type === 'car' ? 'car' : 'bicycle'}
                    size={16}
                    color={towerColor}
                  />
                </View>
                <View>
                  <Text style={styles.plate}>{vehicle.license_plate}</Text>
                  <Text style={styles.location}>T{vehicle.tower} - {vehicle.apartment_code} - {vehicle.owner_name}</Text>
                </View>
              </View>
              {vehicle.restriction_reason && (
                <View style={styles.reasonBadge}>
                  <Ionicons name="alert-circle" size={12} color={COLORS.danger} />
                  <Text style={styles.reasonText} numberOfLines={1}>{vehicle.restriction_reason}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {vehicles.length > 5 && (
        <TouchableOpacity
          style={styles.expandBtn}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.expandText}>
            {expanded ? 'Ver menos' : `Ver todos (${vehicles.length})`}
          </Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport} activeOpacity={0.7}>
          <Ionicons name="document-text-outline" size={16} color={COLORS.danger} />
          <Text style={styles.exportBtnText}>Exportar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.danger + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  list: {
    gap: 8,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.danger + '08',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.danger + '20',
  },
  vehicleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plate: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 1,
  },
  location: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  reasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.danger + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: 120,
  },
  reasonText: {
    fontSize: 10,
    color: COLORS.danger,
    fontWeight: '600',
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  expandText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  footer: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.danger + '12',
    borderWidth: 1,
    borderColor: COLORS.danger + '30',
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.danger,
  },
});
