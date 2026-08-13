import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../../constants';
import { getTowerColor } from '../../../constants';
import { TowerStats } from '../../../types';

interface TowerStatsCardProps {
  stats: TowerStats[];
}

export const TowerStatsCard: React.FC<TowerStatsCardProps> = ({ stats }) => {
  if (!stats.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <Ionicons name="stats-chart" size={16} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Vehículos por Torre</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{stats.length}</Text>
        </View>
      </View>
      <View style={styles.list}>
        {stats.map((tower) => (
          <TowerRow key={tower.tower} tower={tower} />
        ))}
      </View>
    </View>
  );
};

interface TowerRowProps {
  tower: TowerStats;
}

const TowerRow: React.FC<TowerRowProps> = ({ tower }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const barWidth = useRef(new Animated.Value(0)).current;
  const color = getTowerColor(tower.tower);

  const maxVehicles = Math.max(
    ...Array.from({ length: 14 }, (_, i) => i + 1).map(() => 20)
  );
  const percentage = (tower.total_vehicles / maxVehicles) * 100;

  React.useEffect(() => {
    Animated.spring(barWidth, {
      toValue: Math.min(percentage, 100),
      useNativeDriver: false,
      speed: 30,
      bounciness: 8,
    }).start();
  }, [percentage]);

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

  const animatedWidth = barWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[styles.row, { transform: [{ scale: scaleAnim }] }]}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
    >
      <View style={styles.rowTop}>
        <View style={[styles.towerBadge, { backgroundColor: color + '15' }]}>
          <Text style={[styles.towerNumber, { color }]}>T{tower.tower}</Text>
        </View>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Ionicons name="car" size={13} color={COLORS.car} />
            <Text style={styles.statValue}>{tower.total_cars}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="bicycle" size={13} color={COLORS.motorcycle} />
            <Text style={styles.statValue}>{tower.total_motorcycles}</Text>
          </View>
        </View>
        <View style={styles.totalContainer}>
          <Text style={styles.totalValue}>{tower.total_vehicles}</Text>
        </View>
      </View>
      <View style={styles.progressBarTrack}>
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              width: animatedWidth,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.glass,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: 0.1,
  },
  countBadge: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.sm,
    minWidth: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  list: {
    gap: SPACING.sm,
  },
  row: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  towerBadge: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  towerNumber: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  stats: {
    flex: 1,
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  totalContainer: {
    alignItems: 'center',
    minWidth: 36,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  progressBarTrack: {
    height: 2,
    backgroundColor: COLORS.surfaceHighlight,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 1,
  },
});
