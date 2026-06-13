import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants';
import { DashboardStats as DashboardStatsType } from '../../../types';

interface StatsCardProps {
  stats: DashboardStatsType | null;
}

export const StatsCard: React.FC<StatsCardProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={[styles.iconContainer, { backgroundColor: COLORS.primary + '20' }]}>
          <Ionicons name="car" size={24} color={COLORS.primary} />
        </View>
        <Text style={styles.value}>{stats.total_cars}</Text>
        <Text style={styles.label}>Carros</Text>
      </View>
      <View style={styles.card}>
        <View style={[styles.iconContainer, { backgroundColor: '#8B5CF6' + '20' }]}>
          <Ionicons name="bicycle" size={24} color="#8B5CF6" />
        </View>
        <Text style={styles.value}>{stats.total_motorcycles}</Text>
        <Text style={styles.label}>Motos</Text>
      </View>
      <View style={styles.card}>
        <View style={[styles.iconContainer, { backgroundColor: COLORS.secondary + '20' }]}>
          <Ionicons name="albums" size={24} color={COLORS.secondary} />
        </View>
        <Text style={styles.value}>{stats.total_vehicles}</Text>
        <Text style={styles.label}>Total</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
