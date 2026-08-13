import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../../constants';
import { getTowerColor } from '../../../constants';
import { OccupancyStats } from '../../../types';

const getOccupancyColor = (rate: number): string => {
  if (rate > 75) return COLORS.success;
  if (rate >= 50) return COLORS.warning;
  return COLORS.danger;
};

const getOccupancyGlow = (rate: number): string => {
  if (rate > 75) return COLORS.successGlow;
  if (rate >= 50) return COLORS.warningGlow;
  return COLORS.dangerGlow;
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
        {occupancyStats.map((stat) => (
          <TowerOccupancyItem key={stat.tower} stat={stat} />
        ))}
      </View>
    </View>
  );
};

interface TowerOccupancyItemProps {
  stat: OccupancyStats;
}

const TowerOccupancyItem: React.FC<TowerOccupancyItemProps> = ({ stat }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const barWidth = useRef(new Animated.Value(0)).current;

  const color = getTowerColor(stat.tower);
  const rateColor = getOccupancyColor(stat.occupancy_rate);

  React.useEffect(() => {
    Animated.spring(barWidth, {
      toValue: Math.min(stat.occupancy_rate, 100),
      useNativeDriver: false,
      speed: 30,
      bounciness: 8,
    }).start();
  }, [stat.occupancy_rate]);

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

  const animatedWidth = barWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[styles.towerCard, { transform: [{ scale: scaleAnim }] }]}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
    >
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
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              width: animatedWidth,
              backgroundColor: rateColor,
            },
          ]}
        />
      </View>

      <View style={styles.towerDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="car" size={11} color={COLORS.car} />
          <Text style={styles.detailText}>{stat.car_count}</Text>
          <Ionicons name="bicycle" size={11} color={COLORS.motorcycle} />
          <Text style={styles.detailText}>{stat.motorcycle_count}</Text>
        </View>
        <Text style={styles.aptText}>
          {stat.total_vehicles}/{stat.max_vehicles} vehículos
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glass,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...SHADOWS.sm,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    letterSpacing: -0.3,
  },
  summaryLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.divider,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm + 2,
  },
  towerCard: {
    width: '48.5%',
    backgroundColor: COLORS.glass,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  towerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  towerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  towerNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: 0.1,
  },
  rateValue: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  progressBarTrack: {
    height: 3,
    backgroundColor: COLORS.surfaceHighlight,
    borderRadius: 1.5,
    marginBottom: SPACING.sm + 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  towerDetails: {
    gap: SPACING.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },
  aptText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
