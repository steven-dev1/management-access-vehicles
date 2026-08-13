import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../../constants';
import { getTowerColor } from '../../../constants';
import { Vehicle } from '../../../types';
import { vehicleRepository } from '../../../lib/repositories/vehicle.repository';

interface RestrictedVehiclesCardProps {
  vehicles: Vehicle[];
  onPress: (vehicle: Vehicle) => void;
}

export const RestrictedVehiclesCard: React.FC<RestrictedVehiclesCardProps> = ({
  vehicles,
  onPress,
}) => {
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
            const rows = vehicles
              .map(
                (v) =>
                  `<tr><td>${v.license_plate}</td><td>${v.vehicle_type === 'car' ? 'Carro' : 'Moto'}</td><td>T${v.tower} - ${v.apartment_code}</td><td>${v.owner_name}</td><td>${v.restriction_reason || '-'}</td></tr>`
              )
              .join('');
            const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,sans-serif;padding:20px;color:#333}h1{font-size:20px;color:#EF4444}table{width:100%;border-collapse:collapse;font-size:12px;margin-top:16px}th{background:#1A1A1A;color:white;padding:8px;text-align:left}td{padding:6px;border-bottom:1px solid #eee}</style></head><body><h1>Vehículos Restringidos</h1><table><thead><tr><th>Placa</th><th>Tipo</th><th>Ubicación</th><th>Propietario</th><th>Motivo</th></tr></thead><tbody>${rows}</tbody></table><p style="margin-top:16px;font-size:10px;color:#999">Total: ${vehicles.length} vehículos</p></body></html>`;
            const Print = await import('expo-print');
            const Sharing = await import('expo-sharing');
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, {
              mimeType: 'application/pdf',
              dialogTitle: 'Vehículos restringidos',
            });
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
    <View>
      <View style={styles.list}>
        {displayVehicles.map((vehicle) => (
          <VehicleItem
            key={vehicle.id}
            vehicle={vehicle}
            onPress={onPress}
          />
        ))}
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
            size={15}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={handleExport}
          activeOpacity={0.7}
        >
          <Ionicons name="document-text-outline" size={15} color={COLORS.danger} />
          <Text style={styles.exportBtnText}>Exportar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface VehicleItemProps {
  vehicle: Vehicle;
  onPress: (vehicle: Vehicle) => void;
}

const VehicleItem: React.FC<VehicleItemProps> = ({ vehicle, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const towerColor = getTowerColor(vehicle.tower);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View
      style={[styles.vehicleCard, { transform: [{ scale: scaleAnim }] }]}
    >
      <TouchableOpacity
        style={styles.vehicleTouchable}
        onPress={() => onPress(vehicle)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.85}
      >
        <View style={styles.vehicleLeft}>
          <View style={[styles.typeIcon, { backgroundColor: towerColor + '15' }]}>
            <Ionicons
              name={vehicle.vehicle_type === 'car' ? 'car' : 'bicycle'}
              size={15}
              color={towerColor}
            />
          </View>
          <View style={styles.vehicleInfo}>
            <Text style={styles.plate}>{vehicle.license_plate}</Text>
            <Text style={styles.location}>
              T{vehicle.tower} · {vehicle.apartment_code} · {vehicle.owner_name}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
      </TouchableOpacity>
      {vehicle.restriction_reason && (
        <View style={styles.reasonRow}>
          <Ionicons name="alert-circle" size={11} color={COLORS.danger} />
          <Text style={styles.reasonText} numberOfLines={1}>
            {vehicle.restriction_reason}
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: SPACING.sm + 2,
  },
  vehicleCard: {
    backgroundColor: 'rgba(248, 113, 113, 0.04)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.1)',
    overflow: 'hidden',
  },
  vehicleTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  vehicleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  plate: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.8,
  },
  location: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    letterSpacing: 0.1,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  reasonText: {
    fontSize: 11,
    color: COLORS.danger,
    fontWeight: '500',
    flex: 1,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  expandText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  footer: {
    marginTop: SPACING.md,
    alignItems: 'flex-end',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.dangerGlow,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.15)',
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.danger,
  },
});
