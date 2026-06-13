import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS } from '../constants';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 6,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
};

export const VehicleCardSkeleton: React.FC = () => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Skeleton width={80} height={24} borderRadius={6} />
      <Skeleton width={40} height={14} borderRadius={4} />
    </View>
    <Skeleton width={140} height={28} borderRadius={6} style={{ marginBottom: 12 }} />
    <View style={styles.cardInfo}>
      <Skeleton width={90} height={14} borderRadius={4} />
      <Skeleton width={100} height={14} borderRadius={4} />
    </View>
  </View>
);

export const StatsCardSkeleton: React.FC = () => (
  <View style={styles.statsRow}>
    <View style={styles.statCard}>
      <Skeleton width={40} height={40} borderRadius={10} style={{ marginBottom: 8 }} />
      <Skeleton width={30} height={20} borderRadius={4} style={{ marginBottom: 4 }} />
      <Skeleton width={50} height={12} borderRadius={4} />
    </View>
    <View style={styles.statCard}>
      <Skeleton width={40} height={40} borderRadius={10} style={{ marginBottom: 8 }} />
      <Skeleton width={30} height={20} borderRadius={4} style={{ marginBottom: 4 }} />
      <Skeleton width={50} height={12} borderRadius={4} />
    </View>
    <View style={styles.statCard}>
      <Skeleton width={40} height={40} borderRadius={10} style={{ marginBottom: 8 }} />
      <Skeleton width={30} height={20} borderRadius={4} style={{ marginBottom: 4 }} />
      <Skeleton width={50} height={12} borderRadius={4} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.surfaceLight,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
});
