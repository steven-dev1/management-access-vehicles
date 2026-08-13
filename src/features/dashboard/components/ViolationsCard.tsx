import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../../constants';
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
          <ViolationItem key={violation.apartment_code} violation={violation} />
        ))}
      </View>
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={handleExport}
          activeOpacity={0.7}
        >
          <Ionicons name="document-text-outline" size={15} color={COLORS.warning} />
          <Text style={styles.exportBtnText}>Exportar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface ViolationItemProps {
  violation: ApartmentViolation;
}

const ViolationItem: React.FC<ViolationItemProps> = ({ violation }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
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
      style={[styles.violationCard, { transform: [{ scale: scaleAnim }] }]}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
    >
      <View style={styles.violationHeader}>
        <Text style={styles.apartmentCode}>
          Torre {violation.tower} - {violation.apartment_code}
        </Text>
        <View style={styles.badge}>
          <Ionicons name="warning" size={10} color={COLORS.textInverse} />
          <Text style={styles.badgeText}>{violation.vehicle_count}</Text>
        </View>
      </View>
      <View style={styles.violationDetails}>
        <View style={styles.detailItem}>
          <Ionicons
            name="car"
            size={13}
            color={violation.car_count > 1 ? COLORS.danger : COLORS.textMuted}
          />
          <Text
            style={[
              styles.detailText,
              violation.car_count > 1 && styles.dangerText,
            ]}
          >
            {violation.car_count} auto{violation.car_count !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons
            name="bicycle"
            size={13}
            color={violation.motorcycle_count > 1 ? COLORS.danger : COLORS.textMuted}
          />
          <Text
            style={[
              styles.detailText,
              violation.motorcycle_count > 1 && styles.dangerText,
            ]}
          >
            {violation.motorcycle_count} moto{violation.motorcycle_count !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: SPACING.sm + 2,
  },
  violationCard: {
    backgroundColor: 'rgba(251, 191, 36, 0.06)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.12)',
  },
  violationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  apartmentCode: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: 0.1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textInverse,
  },
  violationDetails: {
    flexDirection: 'row',
    gap: SPACING.xl,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  dangerText: {
    color: COLORS.danger,
    fontWeight: '600',
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
    backgroundColor: COLORS.warningGlow,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.warning,
  },
});
