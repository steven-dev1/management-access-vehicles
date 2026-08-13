import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../../constants';
import { DashboardStats as DashboardStatsType } from '../../../types';

interface StatsCardProps {
  stats: DashboardStatsType | null;
}

export const StatsCard: React.FC<StatsCardProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <View style={styles.container}>
      <StatItem
        icon="car"
        value={stats.total_cars}
        label="Carros"
        color={COLORS.car}
        glow={COLORS.primaryGlow}
      />
      <StatItem
        icon="bicycle"
        value={stats.total_motorcycles}
        label="Motos"
        color={COLORS.motorcycle}
        glow="rgba(167, 139, 250, 0.15)"
      />
      <StatItem
        icon="albums"
        value={stats.total_vehicles}
        label="Total"
        color={COLORS.secondary}
        glow={COLORS.successGlow}
      />
    </View>
  );
};

interface StatItemProps {
  icon: string;
  value: number;
  label: string;
  color: string;
  glow: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon, value, label, color, glow }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
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
      style={[styles.card, { transform: [{ scale: scaleAnim }] }]}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
    >
      <View style={[styles.iconContainer, { backgroundColor: glow }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: SPACING.sm + 4,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.glass,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...SHADOWS.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
