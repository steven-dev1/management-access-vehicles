import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ParkingAlert } from '../../../types';
import { COLORS } from '../../../constants';
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
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="time-outline" size={22} color={COLORS.warning} />
          <Text style={styles.title}>Vehículos estacionados +30 días</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{alerts.length}</Text>
        </View>
      </View>

      {alerts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="checkmark-circle-outline"
            size={40}
            color={COLORS.success}
          />
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
            <View key={alert.vehicle_id} style={styles.alertCard}>
              <View style={styles.alertTopRow}>
                <View style={styles.vehicleInfo}>
                  <Ionicons
                    name={
                      alert.vehicle_type === 'car'
                        ? 'car-sport-outline'
                        : 'bicycle-outline'
                    }
                    size={20}
                    color={
                      alert.vehicle_type === 'car'
                        ? COLORS.car
                        : COLORS.motorcycle
                    }
                  />
                  <Text style={styles.plate}>{alert.license_plate}</Text>
                </View>
                <View style={styles.daysBadge}>
                  <Text style={styles.daysText}>
                    {alert.days_parked} días
                  </Text>
                </View>
              </View>

              <Text style={styles.ownerName}>{alert.owner_name}</Text>

              <View style={styles.locationRow}>
                <Ionicons
                  name="business-outline"
                  size={14}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.locationText}>
                  Torre {alert.tower} · {alert.apartment_code}
                </Text>
              </View>

              <View style={styles.dateRow}>
                <Ionicons
                  name="log-in-outline"
                  size={14}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.dateLabel}>Última entrada</Text>
                <Text style={styles.dateValue}>
                  {formatDate(alert.last_entry)}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  countBadge: {
    backgroundColor: COLORS.danger,
    borderRadius: 12,
    minWidth: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  list: {
    maxHeight: 400,
  },
  listContent: {
    padding: 12,
    gap: 10,
  },
  alertCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  alertTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  plate: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  daysBadge: {
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  daysText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  ownerName: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  dateLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  dateValue: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
