import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, getTowerColor } from '../../../constants';
import { OccupancyStats } from '../../../types';

const getOccupancyColor = (rate: number): string => {
  if (rate > 75) return COLORS.success;
  if (rate >= 50) return COLORS.warning;
  return COLORS.danger;
};

export const OccupancyCard: React.FC<{ occupancyStats: OccupancyStats[] }> = ({
  occupancyStats,
}) => {
  const totalVehicles = occupancyStats.reduce((sum, s) => sum + s.total_vehicles, 0);
  const totalMax = occupancyStats.reduce((sum, s) => sum + s.max_vehicles, 0);
  const avgRate =
    occupancyStats.length > 0
      ? occupancyStats.reduce((sum, s) => sum + s.occupancy_rate, 0) / occupancyStats.length
      : 0;

  return (
    <View>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalVehicles}</Text>
          <Text style={styles.summaryLabel}>Vehículos</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalMax}</Text>
          <Text style={styles.summaryLabel}>Capacidad</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: getOccupancyColor(avgRate) }]}>
            {avgRate.toFixed(0)}%
          </Text>
          <Text style={styles.summaryLabel}>Ocupación</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {occupancyStats.map((stat) => {
          const color = getTowerColor(stat.tower);
          const rateColor = getOccupancyColor(stat.occupancy_rate);
          const progressWidth = `${Math.min(stat.occupancy_rate, 100)}%` as unknown as number;

          return (
            <View key={stat.tower} style={styles.towerCard}>
              <View style={styles.towerHeader}>
                <View style={styles.towerTitleRow}>
                  <View style={[styles.dot, { backgroundColor: color }]} />
                  <Text style={styles.towerNumber}>Torre {stat.tower}</Text>
                </View>
                <Text style={[styles.rateValue, { color: rateColor }]}>
                  {stat.occupancy_rate.toFixed(0)}%
                </Text>
              </View>

              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: progressWidth,
                      backgroundColor: rateColor,
                    },
                  ]}
                />
              </View>

              <View style={styles.towerDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="car" size={12} color={COLORS.car} />
                  <Text style={styles.detailText}>{stat.car_count}</Text>
                  <Ionicons name="bicycle" size={12} color={COLORS.motorcycle} />
                  <Text style={styles.detailText}>{stat.motorcycle_count}</Text>
                </View>
                <Text style={styles.aptText}>
                  {stat.total_vehicles}/{stat.max_vehicles} vehículos
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  towerCard: {
    width: '48.5%',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 12,
  },
  towerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  towerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  towerNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  rateValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  towerDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginRight: 6,
  },
  aptText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});
