import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ParkingAlert } from '../../../types';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../../constants';
import { parseTimestamp } from '../../../utils';

export const ParkingAlertsCard: React.FC<{ alerts: ParkingAlert[] }> = ({
  alerts,
}) => {
  const formatDate = (dateString: string): string => {
    const date = parseTimestamp(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View>
      {alerts.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons
              name="checkmark-circle-outline"
              size={36}
              color={COLORS.success}
            />
          </View>
          <Text style={styles.emptyText}>
            No hay vehículos con estacionamiento prolongado
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {alerts.map((alert) => (
            <AlertItem
              key={alert.vehicle_id}
              alert={alert}
              formatDate={formatDate}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

interface AlertItemProps {
  alert: ParkingAlert;
  formatDate: (dateString: string) => string;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert, formatDate }) => {
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
      style={[styles.alertCard, { transform: [{ scale: scaleAnim }] }]}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
    >
      <View style={styles.alertTopRow}>
        <View style={styles.vehicleInfo}>
          <Ionicons
            name={
              alert.vehicle_type === 'car'
                ? 'car-sport-outline'
                : 'bicycle-outline'
            }
            size={18}
            color={
              alert.vehicle_type === 'car' ? COLORS.car : COLORS.motorcycle
            }
          />
          <Text style={styles.plate}>{alert.license_plate}</Text>
        </View>
        <View style={styles.daysBadge}>
          <Text style={styles.daysText}>{alert.days_parked}d</Text>
        </View>
      </View>

      <Text style={styles.ownerName}>{alert.owner_name}</Text>

      <View style={styles.locationRow}>
        <Ionicons
          name="business-outline"
          size={13}
          color={COLORS.textMuted}
        />
        <Text style={styles.locationText}>
          Torre {alert.tower} · {alert.apartment_code}
        </Text>
      </View>

      <View style={styles.dateRow}>
        <Ionicons
          name="log-in-outline"
          size={13}
          color={COLORS.textMuted}
        />
        <Text style={styles.dateLabel}>Última entrada</Text>
        <Text style={styles.dateValue}>{formatDate(alert.last_entry)}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  emptyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.xxl,
    backgroundColor: COLORS.successGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  list: {
    maxHeight: 400,
  },
  listContent: {
    gap: SPACING.sm + 2,
  },
  alertCard: {
    backgroundColor: 'rgba(248, 113, 113, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.1)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  alertTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  plate: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.8,
  },
  daysBadge: {
    backgroundColor: COLORS.danger,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
  },
  daysText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  ownerName: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textMuted,
    letterSpacing: 0.1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  dateLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  dateValue: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
