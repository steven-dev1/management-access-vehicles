import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, getTowerColor } from '../../../constants';
import { TowerStats } from '../../../types';

interface TowerStatsCardProps {
  stats: TowerStats[];
}

export const TowerStatsCard: React.FC<TowerStatsCardProps> = ({ stats }) => {
  if (!stats.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vehículos por Torre</Text>
      <View style={styles.list}>
        {stats.map((tower) => {
          const color = getTowerColor(tower.tower);
          return (
            <View key={tower.tower} style={styles.row}>
              <View style={[styles.towerBadge, { backgroundColor: color + '20' }]}>
                <Text style={[styles.towerNumber, { color }]}>T{tower.tower}</Text>
              </View>
              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Ionicons name="car" size={14} color={COLORS.car} />
                  <Text style={styles.statValue}>{tower.total_cars}</Text>
                </View>
                <View style={styles.stat}>
                  <Ionicons name="bicycle" size={14} color="#8B5CF6" />
                  <Text style={styles.statValue}>{tower.total_motorcycles}</Text>
                </View>
              </View>
              <View style={styles.totalContainer}>
                <Text style={styles.totalValue}>{tower.total_vehicles}</Text>
                <Text style={styles.totalLabel}>total</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    padding: 12,
    gap: 12,
  },
  towerBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  towerNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  stats: {
    flex: 1,
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  totalContainer: {
    alignItems: 'center',
    minWidth: 40,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  totalLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
});
