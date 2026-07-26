import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants';
import { ApartmentViolation } from '../../../types';
import { vehicleRepository } from '../../../lib/repositories/vehicle.repository';

interface ViolationsCardProps {
  violations: ApartmentViolation[];
}

export const ViolationsCard: React.FC<ViolationsCardProps> = ({ violations }) => {
  if (!violations.length) return null;

  const handleExport = () => {
    Alert.alert('Exportar violaciones', 'Selecciona el formato:', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'PDF',
        onPress: async () => {
          try {
            await vehicleRepository.exportViolationsToPDF(violations);
          } catch {
            Alert.alert('Error', 'No se pudo exportar el PDF');
          }
        },
      },
      {
        text: 'Excel (.xlsx)',
        onPress: async () => {
          try {
            await vehicleRepository.exportViolationsToExcel(violations);
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
        {violations.map((violation) => (
          <View key={violation.apartment_code} style={styles.violationCard}>
            <View style={styles.violationHeader}>
              <Text style={styles.apartmentCode}>Torre {violation.tower} - {violation.apartment_code}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{violation.vehicle_count} vehículos</Text>
              </View>
            </View>
            <View style={styles.violationDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="car" size={14} color={violation.car_count > 1 ? COLORS.danger : COLORS.textSecondary} />
                <Text style={[styles.detailText, violation.car_count > 1 && styles.dangerText]}>
                  {violation.car_count} auto{violation.car_count !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="bicycle" size={14} color={violation.motorcycle_count > 1 ? COLORS.danger : COLORS.textSecondary} />
                <Text style={[styles.detailText, violation.motorcycle_count > 1 && styles.dangerText]}>
                  {violation.motorcycle_count} moto{violation.motorcycle_count !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport} activeOpacity={0.7}>
          <Ionicons name="document-text-outline" size={16} color={COLORS.warning} />
          <Text style={styles.exportBtnText}>Exportar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    backgroundColor: COLORS.warning + '12',
    borderWidth: 1,
    borderColor: COLORS.warning + '30',
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.warning,
  },
  list: {
    gap: 8,
  },
  violationCard: {
    backgroundColor: COLORS.warning + '10',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.warning + '30',
  },
  violationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  apartmentCode: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  ownerNames: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  badge: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  violationDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  dangerText: {
    color: COLORS.danger,
    fontWeight: '600',
  },
});
