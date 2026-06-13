import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants';
import { AccessLog } from '../../../types';
import { parseTimestamp } from '../../../utils';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const HOURS = [0, 3, 6, 9, 12, 15, 18, 21];
const CELL_SIZE = 28;
const CELL_GAP = 3;

const getColor = (count: number): string => {
  if (count === 0) return COLORS.surface;
  if (count <= 2) return '#1E3A5F';
  if (count <= 5) return '#2563EB';
  if (count <= 8) return '#F59E0B';
  return '#EF4444';
};

export const ActivityHeatmap: React.FC<{ logs: AccessLog[] }> = ({ logs }) => {
  const grid = useMemo(() => {
    const g: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    logs.forEach((log) => {
      const d = parseTimestamp(log.timestamp);
      const day = (d.getDay() + 6) % 7;
      g[day][d.getHours()]++;
    });
    return g;
  }, [logs]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Ionicons name="time" size={16} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Actividad por hora</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View>
          {/* Hour labels */}
          <View style={styles.row}>
            <View style={styles.dayLabelSpace} />
            {HOURS.map((h) => (
              <View key={h} style={[styles.hourCell, { width: CELL_SIZE }]}>
                <Text style={styles.hourText}>{String(h).padStart(2, '0')}</Text>
              </View>
            ))}
          </View>

          {/* Grid rows */}
          {DAYS.map((day, di) => (
            <View key={day} style={styles.row}>
              <View style={styles.dayLabelSpace}>
                <Text style={styles.dayLabel}>{day}</Text>
              </View>
              {HOURS.map((h) => {
                const count = grid[di][h];
                const bg = getColor(count);
                return (
                  <View
                    key={`${di}-${h}`}
                    style={[
                      styles.cell,
                      { backgroundColor: bg },
                      count > 0 && styles.cellActive,
                    ]}
                  >
                    {count > 0 && <Text style={styles.cellCount}>{count}</Text>}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendLabel}>Menos</Text>
        {[0, 2, 5, 8, 10].map((v, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: getColor(v) }]} />
          </View>
        ))}
        <Text style={styles.legendLabel}>Más</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  scrollContent: {
    paddingRight: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: CELL_GAP,
  },
  dayLabelSpace: {
    width: 36,
    marginRight: 6,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  hourCell: {
    alignItems: 'center',
    marginRight: CELL_GAP,
  },
  hourText: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 6,
    marginRight: CELL_GAP,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cellActive: {
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cellCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    gap: 6,
  },
  legendLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  legendItem: {},
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
});
