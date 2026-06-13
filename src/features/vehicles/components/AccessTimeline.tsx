import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AccessLog } from '../../../types';
import { parseTimestamp } from '../../../utils';
import { COLORS } from '../../../constants';

export const AccessTimeline: React.FC<{ logs: AccessLog[] }> = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="time-outline" size={48} color={COLORS.textSecondary} />
        <Text style={styles.emptyText}>Sin registros de acceso</Text>
      </View>
    );
  }

  const grouped = new Map<string, AccessLog[]>();

  for (const log of logs) {
    const date = parseTimestamp(log.timestamp);
    const key = date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(log);
  }

  const sortedDates = Array.from(grouped.entries()).sort((a, b) => {
    const aTime = parseTimestamp(a[1][0].timestamp).getTime();
    const bTime = parseTimestamp(b[1][0].timestamp).getTime();
    return bTime - aTime;
  });

  return (
    <View style={styles.container}>
      {sortedDates.map(([date, dateLogs]) => (
        <View key={date} style={styles.dateGroup}>
          <View style={styles.dateHeader}>
            <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
            <Text style={styles.dateText}>{date}</Text>
          </View>

          <View style={styles.timelineContainer}>
            {dateLogs
              .sort((a, b) => parseTimestamp(b.timestamp).getTime() - parseTimestamp(a.timestamp).getTime())
              .map((log) => {
                const time = parseTimestamp(log.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                const isEntry = log.access_type === 'entry';

                return (
                  <View key={log.id} style={styles.timelineEntry}>
                    <View style={[styles.circle, { backgroundColor: isEntry ? '#10B981' : '#EF4444' }]}>
                      <Ionicons name={isEntry ? 'log-in' : 'log-out'} size={16} color="#FFF" />
                    </View>

                    <View style={styles.entryContent}>
                      <Text style={styles.timeText}>{time}</Text>
                      <Text style={styles.typeText}>{isEntry ? 'Entrada' : 'Salida'}</Text>
                      {log.plate_scanned && (
                        <Text style={styles.plateText}>{log.plate_scanned}</Text>
                      )}
                    </View>
                  </View>
                );
              })}
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingTop: 8 },
  emptyContainer: {
    alignItems: 'center', paddingVertical: 48, gap: 10,
  },
  emptyText: { color: COLORS.textSecondary, fontSize: 15 },
  dateGroup: { marginBottom: 20 },
  dateHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dateText: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  timelineContainer: {
    paddingLeft: 16, borderLeftWidth: 2, borderLeftColor: '#2A2A2A', marginLeft: 4,
  },
  timelineEntry: {
    flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 10, marginLeft: -8,
  },
  circle: {
    width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center',
  },
  entryContent: { flex: 1, paddingTop: 2 },
  timeText: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  typeText: { color: COLORS.textSecondary, fontSize: 12, marginTop: 1 },
  plateText: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2, fontFamily: 'monospace' },
});
