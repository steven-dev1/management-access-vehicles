import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, getTowerColor } from '../../../constants';
import { TowerStats } from '../../../types';

interface TowerChartProps {
  stats: TowerStats[];
  maxVehicles?: number;
}

export const TowerChart: React.FC<TowerChartProps> = ({ stats, maxVehicles }) => {
  const max = maxVehicles || Math.max(...stats.map(s => s.total_vehicles), 1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="bar-chart" size={18} color={COLORS.primary} />
          <Text style={styles.title}>Vehículos por torre</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.car }]} />
            <Text style={styles.legendText}>Carros</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.motorcycle }]} />
            <Text style={styles.legendText}>Motos</Text>
          </View>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {stats.map((stat) => {
          const barHeight = Math.max((stat.total_vehicles / max) * 130, 6);
          const carRatio = stat.total_vehicles > 0 ? stat.total_cars / stat.total_vehicles : 0;
          const carH = barHeight * carRatio;
          const motoH = barHeight * (1 - carRatio);
          const color = getTowerColor(stat.tower);

          return (
            <View key={stat.tower} style={styles.barWrapper}>
              <Text style={styles.barValue}>{stat.total_vehicles}</Text>
              <View style={styles.barContainer}>
                <View style={[styles.barStack, { height: barHeight }]}>
                  {motoH > 0 && (
                    <View style={[styles.barSegment, { height: motoH, backgroundColor: COLORS.motorcycle }]} />
                  )}
                  {carH > 0 && (
                    <View style={[styles.barSegment, { height: carH, backgroundColor: COLORS.car }]} />
                  )}
                </View>
              </View>
              <View style={[styles.barBase, { backgroundColor: color }]} />
              <Text style={styles.barLabel}>T{stat.tower}</Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{stats.reduce((a, s) => a + s.total_cars, 0)}</Text>
          <Text style={styles.summaryLabel}>Carros</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{stats.reduce((a, s) => a + s.total_motorcycles, 0)}</Text>
          <Text style={styles.summaryLabel}>Motos</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{stats.reduce((a, s) => a + s.total_vehicles, 0)}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
      </View>
    </View>
  );
};

interface AccessChartProps {
  data: { label: string; entries: number; exits: number }[];
}

export const AccessChart: React.FC<AccessChartProps> = ({ data }) => {
  const max = Math.max(...data.map(d => Math.max(d.entries, d.exits)), 1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="trending-up" size={18} color={COLORS.primary} />
          <Text style={styles.title}>Accesos por día</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
            <Text style={styles.legendText}>Entradas</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.danger }]} />
            <Text style={styles.legendText}>Salidas</Text>
          </View>
        </View>
      </View>

      <View style={styles.accessChart}>
        {data.map((item, index) => (
          <View key={index} style={styles.accessBarGroup}>
            <View style={styles.accessBars}>
              <View style={[styles.accessBar, { height: (item.entries / max) * 100, backgroundColor: COLORS.success }]} />
              <View style={[styles.accessBar, { height: (item.exits / max) * 100, backgroundColor: COLORS.danger }]} />
            </View>
            <Text style={styles.accessBarLabel}>{item.label}</Text>
          </View>
        ))}
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
    marginBottom: 16,
  },
  header: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    paddingBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  barWrapper: {
    width: 48,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  barContainer: {
    height: 130,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barStack: {
    width: 18,
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barSegment: {
    width: '100%',
    minHeight: 2,
  },
  barBase: {
    width: 24,
    height: 3,
    borderRadius: 1.5,
    marginTop: 2,
  },
  barLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  accessChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  accessBarGroup: {
    alignItems: 'center',
    flex: 1,
  },
  accessBars: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'flex-end',
    height: 100,
  },
  accessBar: {
    width: 12,
    borderRadius: 3,
  },
  accessBarLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontWeight: '500',
  },
});
