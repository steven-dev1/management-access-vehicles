import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants';
import { AccessLog } from '../../../types';
import { parseTimestamp } from '../../../utils';

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DAY_INDICES = [1, 2, 3, 4, 5, 6, 0];

interface DayData {
  entries: number;
  exits: number;
  total: number;
}

export const WeeklyPatterns: React.FC<{ logs: AccessLog[] }> = ({ logs }) => {
  const weekData = useMemo(() => {
    const data: Record<number, DayData> = {};
    DAY_INDICES.forEach((d) => { data[d] = { entries: 0, exits: 0, total: 0 }; });

    logs.forEach((log) => {
      const d = parseTimestamp(log.timestamp);
      const day = d.getDay();
      if (log.access_type === 'entry') data[day].entries++;
      else data[day].exits++;
      data[day].total++;
    });

    return data;
  }, [logs]);

  const maxTotal = Math.max(...DAY_INDICES.map((d) => weekData[d].total), 1);

  const totalEntries = DAY_INDICES.reduce((s, d) => s + weekData[d].entries, 0);
  const totalExits = DAY_INDICES.reduce((s, d) => s + weekData[d].exits, 0);

  return (
    <View>
      <View style={styles.chart}>
        {DAY_INDICES.map((dayIndex) => {
          const data = weekData[dayIndex];
          const entryPct = data.total > 0 ? (data.entries / maxTotal) * 100 : 0;
          const exitPct = data.total > 0 ? (data.exits / maxTotal) * 100 : 0;
          const isToday = new Date().getDay() === dayIndex;

          return (
            <View key={dayIndex} style={[styles.dayRow, isToday && styles.dayRowActive]}>
              <View style={styles.dayInfo}>
                <Text style={[styles.dayLabel, isToday && styles.dayLabelActive]}>
                  {DAY_NAMES[dayIndex]}
                </Text>
                {isToday && <View style={styles.todayDot} />}
              </View>

              <View style={styles.barsArea}>
                {/* Entry bar */}
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      styles.barEntry,
                      { width: `${Math.max(entryPct, data.entries > 0 ? 8 : 0)}%` as any },
                    ]}
                  >
                    {data.entries > 0 && (
                      <Text style={styles.barText}>{data.entries}</Text>
                    )}
                  </View>
                </View>

                {/* Exit bar */}
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      styles.barExit,
                      { width: `${Math.max(exitPct, data.exits > 0 ? 8 : 0)}%` as any },
                    ]}
                  >
                    {data.exits > 0 && (
                      <Text style={styles.barText}>{data.exits}</Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Entradas</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.legendText}>Salidas</Text>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{totalEntries}</Text>
          <Text style={styles.summaryLabel}>entradas</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{totalExits}</Text>
          <Text style={styles.summaryLabel}>salidas</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chart: {
    gap: 6,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  dayRowActive: {
    backgroundColor: COLORS.primary + '10',
  },
  dayInfo: {
    width: 40,
    alignItems: 'flex-end',
    marginRight: 10,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  dayLabelActive: {
    color: COLORS.primary,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 2,
  },
  barsArea: {
    flex: 1,
    gap: 3,
  },
  barTrack: {
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 6,
    minWidth: 0,
  },
  barEntry: {
    backgroundColor: '#10B981',
  },
  barExit: {
    backgroundColor: '#EF4444',
  },
  barText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFF',
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 20,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 20,
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
});
