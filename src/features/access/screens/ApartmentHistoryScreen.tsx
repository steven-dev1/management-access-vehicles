import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, TOWERS } from '../../../constants';
import { accessLogRepository } from '../../../lib/repositories/accessLog.repository';
import { AccessLog } from '../../../types';
import { formatDateTime, getVehicleTypeColor } from '../../../utils';
import { LoadingState, EmptyState } from '../../../components/EmptyState';

export const ApartmentHistoryScreen: React.FC = () => {
  const router = useRouter();
  const { tower, apartment } = useLocalSearchParams<{ tower: string; apartment: string }>();
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  const towerNum = parseInt(tower || '1', 10);
  const aptCode = apartment || '101';

  useEffect(() => {
    loadLogs();
  }, [towerNum, aptCode]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await accessLogRepository.getLogsByApartment(towerNum, aptCode);
      setLogs(data);
    } catch (err) {
      console.error('Error loading apartment logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    Alert.alert('Exportar historial', 'Selecciona el formato:', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'PDF', onPress: () => exportAs('pdf') },
      { text: 'Excel (.xlsx)', onPress: () => exportAs('excel') },
      { text: 'CSV', onPress: () => exportAs('csv') },
    ]);
  };

  const exportAs = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      if (format === 'csv') {
        const csv = await accessLogRepository.exportLogsToCSV();
        await Share.share({ message: csv, title: `Historial Torre ${towerNum} - ${aptCode}` });
      } else if (format === 'excel') {
        await accessLogRepository.exportLogsToExcel();
      } else {
        await accessLogRepository.exportLogsToPDF();
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo exportar el historial');
    }
  };

  if (loading) {
    return <LoadingState message="Cargando historial..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Torre {towerNum} - {aptCode}</Text>
          <Text style={styles.headerSubtitle}>{logs.length} registros</Text>
        </View>
        <TouchableOpacity onPress={handleExport} style={styles.exportButton}>
          <Ionicons name="download" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {logs.length === 0 ? (
          <EmptyState
            icon="time"
            title="Sin registros"
            message="No hay registros de acceso para este apartamento"
          />
        ) : (
          logs.map((log) => (
            <View key={log.id} style={styles.logCard}>
              <View style={[styles.logIcon, { backgroundColor: log.access_type === 'entry' ? COLORS.success + '20' : COLORS.danger + '20' }]}>
                <Ionicons
                  name={log.access_type === 'entry' ? 'log-in' : 'log-out'}
                  size={16}
                  color={log.access_type === 'entry' ? COLORS.success : COLORS.danger}
                />
              </View>
              <View style={styles.logInfo}>
                <View style={styles.logPlateRow}>
                  <Ionicons
                    name={log.vehicle?.vehicle_type === 'motorcycle' ? 'bicycle' : 'car'}
                    size={14}
                    color={getVehicleTypeColor(log.vehicle?.vehicle_type || 'car')}
                  />
                  <Text style={styles.logPlate}>{log.vehicle?.license_plate || 'N/A'}</Text>
                </View>
                <Text style={styles.logOwner}>{log.vehicle?.owner_name || ''}</Text>
                <Text style={styles.logTime}>{formatDateTime(log.timestamp)}</Text>
              </View>
              <Text style={[styles.logType, { color: log.access_type === 'entry' ? COLORS.success : COLORS.danger }]}>
                {log.access_type === 'entry' ? 'Entrada' : 'Salida'}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  exportButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  logIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logInfo: {
    flex: 1,
  },
  logPlateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logPlate: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  logOwner: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  logTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  logType: {
    fontSize: 12,
    fontWeight: '600',
  },
});
