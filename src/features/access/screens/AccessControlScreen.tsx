import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, RefreshControl, Share, SectionList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../../constants';
import { accessLogRepository } from '../../../lib/repositories/accessLog.repository';
import { useVoiceCommand, isExpoGoEnvironment } from '../../../hooks/useVoiceCommand';
import { Vehicle, AccessLog } from '../../../types';
import { formatRelativeTime, getVehicleTypeColor, parseTimestamp } from '../../../utils';
import { useHaptics } from '../../../hooks/useHaptics';
import { useRealtimeAccessLogs } from '../../../hooks/useRealtime';

interface LogSection {
  title: string;
  data: AccessLog[];
}

export const AccessControlScreen: React.FC = () => {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [recentLogs, setRecentLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [historySections, setHistorySections] = useState<LogSection[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [allHistoryLogs, setAllHistoryLogs] = useState<AccessLog[]>([]);
  const [filterPlate, setFilterPlate] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const { listening, voiceText, startListening, updateVoiceText, isVoiceAvailable } = useVoiceCommand();
  const { impactMedium, notificationSuccess } = useHaptics();
  const [voiceSupported, setVoiceSupported] = useState<boolean | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadRecentLogs();
    isVoiceAvailable().then(setVoiceSupported);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useRealtimeAccessLogs(() => { loadRecentLogs(); });

  const loadRecentLogs = async () => {
    try {
      const logs = await accessLogRepository.getRecentLogs(10);
      setRecentLogs(logs);
    } catch (err) {
      console.error('Error loading logs:', err);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRecentLogs();
    setRefreshing(false);
  }, []);

  const handleExportOptions = () => {
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
        await Share.share({ message: csv, title: 'Historial de accesos' });
      } else if (format === 'excel') {
        await accessLogRepository.exportLogsToExcel();
      } else {
        await accessLogRepository.exportLogsToPDF();
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo exportar el historial');
    }
  };

  const loadFullHistory = async () => {
    setLoadingHistory(true);
    try {
      const logs = await accessLogRepository.getRecentLogs(200);
      setAllHistoryLogs(logs);
      applyHistoryFilters(logs);
      setShowFullHistory(true);
    } catch (err) {
      Alert.alert('Error', 'No se pudo cargar el historial');
    } finally {
      setLoadingHistory(false);
    }
  };

  const applyHistoryFilters = (logs: AccessLog[]) => {
    const plate = filterPlate.toUpperCase().trim();
    const from = filterDateFrom ? new Date(filterDateFrom + 'T00:00:00') : null;
    const to = filterDateTo ? new Date(filterDateTo + 'T23:59:59') : null;

    const filtered = logs.filter(log => {
      if (plate && !(log.vehicle?.license_plate || '').toUpperCase().includes(plate)) return false;
      const logDate = parseTimestamp(log.timestamp);
      if (from && logDate < from) return false;
      if (to && logDate > to) return false;
      return true;
    });

    const grouped = new Map<string, AccessLog[]>();
    for (const log of filtered) {
      const date = parseTimestamp(log.timestamp);
      const key = date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(log);
    }

    const sections: LogSection[] = [];
    for (const [dateStr, logGroup] of grouped) {
      sections.push({ title: dateStr, data: logGroup });
    }
    setHistorySections(sections);
  };

  useEffect(() => {
    if (showFullHistory && allHistoryLogs.length > 0) {
      applyHistoryFilters(allHistoryLogs);
    }
  }, [filterPlate, filterDateFrom, filterDateTo]);

  const handleVoiceCommand = async () => {
    try {
      if (isExpoGoEnvironment()) {
        Alert.alert(
          'Voz no disponible en Expo Go',
          'El reconocimiento de voz requiere build nativo.\n\nEjecuta:\nnpx expo run:android',
          [{ text: 'OK' }]
        );
        return;
      }

      updateVoiceText('Iniciando...');
      const result = await startListening();

      if (!result.rawText) {
        Alert.alert(
          'No se detectó audio',
          'No se pudo iniciar el reconocimiento de voz.\n\nPosibles causas:\n• Permiso de micrófono no concedido\n• Servicio de voz no disponible\n• Sin conexión a internet\n\nVe a Ajustes > Permisos > Micrófono para activarlo.',
          [{ text: 'OK' }]
        );
        updateVoiceText('');
        return;
      }

      updateVoiceText(`"${result.rawText}"`);

      if (!result.plate) {
        Alert.alert('Placa no detectada', `No se pudo detectar la placa en: "${result.rawText}"\n\nIntenta de nuevo hablando más claro.`, [
          { text: 'OK' },
        ]);
        setTimeout(() => updateVoiceText(''), 3000);
        return;
      }

      if (!result.action) {
        Alert.alert('Acción no detectada', `No se detectó si es entrada o salida.\n\nPlaca detectada: ${result.plate}\n\nIntenta de nuevo hablando más claro.`, [
          { text: 'OK' },
        ]);
        setTimeout(() => updateVoiceText(''), 3000);
        return;
      }

      const vehicle = await accessLogRepository.getVehicleByPlate(result.plate);

      if (!vehicle) {
        Alert.alert('Vehículo no encontrado', `Placa: ${result.plate}\n\nNo se encontró en el sistema.`, [
          { text: 'OK' },
        ]);
        setTimeout(() => updateVoiceText(''), 3000);
        return;
      }

      const actionLabel = result.action === 'entry' ? 'Entrada' : 'Salida';
      Alert.alert(
        `${actionLabel} - ${vehicle.license_plate}`,
        `${vehicle.owner_name}\nTorre ${vehicle.tower} - ${vehicle.apartment_code}`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: `Registrar ${actionLabel}`,
            onPress: async () => {
              await handleLogAccess(vehicle, result.action!);
              updateVoiceText(`${actionLabel} registrada: ${vehicle.license_plate}`);
              setTimeout(() => updateVoiceText(''), 3000);
            },
          },
        ]
      );
    } catch (err: any) {
      updateVoiceText('');
    }
  };

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await accessLogRepository.searchVehicles(query);
        setSearchResults(results);
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 300);
  }, []);

  const handleLogAccess = async (vehicle: Vehicle, accessType: 'entry' | 'exit') => {
    setLoading(true);
    try {
      await accessLogRepository.logAccess(vehicle.id, accessType, vehicle.license_plate);
      await notificationSuccess();
      const label = accessType === 'entry' ? 'Entrada' : 'Salida';
      Alert.alert(`${label} registrada`, `${vehicle.license_plate} - Torre ${vehicle.tower}`, [
        { text: 'OK' }
      ]);
      setSelectedVehicle(null);
      setSearchQuery('');
      setSearchResults([]);
      loadRecentLogs();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al registrar acceso');
    } finally {
      setLoading(false);
    }
  };

  const formatDateHeader = (dateStr: string): string => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const d = new Date(dateStr);
    if (d.toDateString() === today.toDateString()) return 'Hoy';
    if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
    return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  };

  if (showFullHistory) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowFullHistory(false)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Historial completo</Text>
          <TouchableOpacity onPress={handleExportOptions} style={styles.exportButton}>
            <Ionicons name="download-outline" size={16} color="#FFF" />
            <Text style={styles.exportButtonText}>Exportar</Text>
          </TouchableOpacity>
        </View>

        {loadingHistory ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator color={COLORS.primary} size="large" />
          </View>
        ) : (
          <>
            <View style={styles.filterBar}>
              <View style={styles.filterRow}>
                <View style={styles.filterInput}>
                  <Ionicons name="search" size={16} color={COLORS.textSecondary} />
                  <TextInput
                    style={styles.filterInputText}
                    placeholder="Placa"
                    placeholderTextColor={COLORS.textSecondary}
                    value={filterPlate}
                    onChangeText={setFilterPlate}
                    autoCapitalize="characters"
                  />
                  {filterPlate.length > 0 && (
                    <TouchableOpacity onPress={() => setFilterPlate('')}>
                      <Ionicons name="close-circle" size={16} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <View style={styles.filterRow}>
                <View style={[styles.filterInput, { flex: 1 }]}>
                  <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
                  <TextInput
                    style={styles.filterInputText}
                    placeholder="Desde (AAAA-MM-DD)"
                    placeholderTextColor={COLORS.textSecondary}
                    value={filterDateFrom}
                    onChangeText={setFilterDateFrom}
                    maxLength={10}
                  />
                  {filterDateFrom.length > 0 && (
                    <TouchableOpacity onPress={() => setFilterDateFrom('')}>
                      <Ionicons name="close-circle" size={16} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={[styles.filterInput, { flex: 1 }]}>
                  <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
                  <TextInput
                    style={styles.filterInputText}
                    placeholder="Hasta (AAAA-MM-DD)"
                    placeholderTextColor={COLORS.textSecondary}
                    value={filterDateTo}
                    onChangeText={setFilterDateTo}
                    maxLength={10}
                  />
                  {filterDateTo.length > 0 && (
                    <TouchableOpacity onPress={() => setFilterDateTo('')}>
                      <Ionicons name="close-circle" size={16} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              {(filterPlate || filterDateFrom || filterDateTo) && (
                <TouchableOpacity style={styles.clearFiltersBtn} onPress={() => { setFilterPlate(''); setFilterDateFrom(''); setFilterDateTo(''); }}>
                  <Ionicons name="funnel" size={14} color={COLORS.primary} />
                  <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
                </TouchableOpacity>
              )}
            </View>
            <SectionList
            sections={historySections}
            keyExtractor={(item) => item.id}
            stickySectionHeadersEnabled={true}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{formatDateHeader(section.title)}</Text>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{section.data.length}</Text>
                </View>
              </View>
            )}
            renderItem={({ item: log }) => (
              <TouchableOpacity
                style={styles.logCard}
                onPress={() => log.vehicle && router.push(`/vehicle/${log.vehicle.id}`)}
                activeOpacity={0.7}
              >
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
                    <Text style={[styles.logAction, { color: log.access_type === 'entry' ? COLORS.success : COLORS.danger }]}>
                      {log.access_type === 'entry' ? 'Entrada' : 'Salida'}
                    </Text>
                    {log.vehicle?.is_restricted && (
                      <View style={styles.restrictedBadge}>
                        <Ionicons name="warning" size={10} color="#FFF" />
                        <Text style={styles.restrictedBadgeText}>RESTRINGIDO</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.logOwner}>{log.vehicle?.owner_name || ''}</Text>
                  <Text style={styles.logDetails}>
                    {log.vehicle ? `Torre ${log.vehicle.tower} - ${log.vehicle.apartment_code}` : ''} • {parseTimestamp(log.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 32 }}
            renderSectionFooter={() => <View style={{ height: 16 }} />}
            ListEmptyComponent={
              <View style={styles.loadingCenter}>
                <Ionicons name="search" size={32} color={COLORS.textSecondary} />
                <Text style={styles.emptyText}>Sin resultados</Text>
              </View>
            }
          />
          </>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="shield-checkmark" size={22} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Control de Acceso</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        <View style={styles.voiceSection}>
          {voiceSupported !== false ? (
            <TouchableOpacity
              style={[styles.voiceButton, listening && styles.voiceButtonActive]}
              onPress={handleVoiceCommand}
              disabled={listening}
              activeOpacity={0.8}
            >
              {listening ? (
                <View style={styles.voiceRecording}>
                  <View style={styles.pulseRing} />
                  <View style={styles.pulseRingInner} />
                  <View style={styles.micCircleActive}>
                    <Ionicons name="mic" size={28} color="#FFF" />
                  </View>
                  <Text style={styles.voiceRecordingText}>Escuchando...</Text>
                  <Text style={styles.voiceRecordingHint}>Di la placa y la acción</Text>
                </View>
              ) : (
                <View style={styles.voiceIdle}>
                  <View style={styles.micCircle}>
                    <Ionicons name="mic" size={28} color={COLORS.primary} />
                  </View>
                  <Text style={styles.voiceIdleText}>Activar voz</Text>
                  <Text style={styles.voiceIdleHint}>Di la placa y la acción</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.voiceUnavailable}>
              <Ionicons name="mic-off" size={18} color={COLORS.textSecondary} />
              <Text style={styles.voiceUnavailableText}>
                Comando de voz no disponible en este dispositivo
              </Text>
            </View>
          )}

          {voiceText && !listening && (
            <View style={styles.voiceStatus}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
              <Text style={styles.voiceStatusText} numberOfLines={2}>{voiceText}</Text>
            </View>
          )}
        </View>

        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Buscar vehículo</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por placa..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={handleSearch}
              autoCapitalize="characters"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); setSelectedVehicle(null); }}>
                <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {searchResults.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Resultados</Text>
            {searchResults.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={styles.resultCard}
                onPress={() => setSelectedVehicle(vehicle)}
              >
                <View style={styles.resultInfo}>
                  <Text style={styles.resultPlate}>{vehicle.license_plate}</Text>
                  <Text style={styles.resultDetails}>Torre {vehicle.tower} - {vehicle.apartment_code} • {vehicle.owner_name}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedVehicle && (
          <View style={styles.selectedSection}>
            <Text style={styles.sectionTitle}>Vehículo seleccionado</Text>
            <View style={styles.selectedCard}>
              <View style={styles.selectedHeader}>
                <View style={[styles.selectedType, { backgroundColor: getVehicleTypeColor(selectedVehicle.vehicle_type) + '20' }]}>
                  <Ionicons
                    name={selectedVehicle.vehicle_type === 'car' ? 'car' : 'bicycle'}
                    size={24}
                    color={getVehicleTypeColor(selectedVehicle.vehicle_type)}
                  />
                </View>
                <View>
                  <Text style={styles.selectedPlate}>{selectedVehicle.license_plate}</Text>
                  <Text style={styles.selectedOwner}>{selectedVehicle.owner_name}</Text>
                </View>
              </View>
              <Text style={styles.selectedLocation}>Torre {selectedVehicle.tower} - {selectedVehicle.apartment_code}</Text>

              <View style={styles.accessButtons}>
                <TouchableOpacity
                  style={[styles.accessButton, styles.entryButton]}
                  onPress={() => handleLogAccess(selectedVehicle, 'entry')}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.text} />
                  ) : (
                    <>
                      <Ionicons name="log-in" size={20} color={COLORS.text} />
                      <Text style={styles.accessButtonText}>Entrada</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.accessButton, styles.exitButton]}
                  onPress={() => handleLogAccess(selectedVehicle, 'exit')}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.text} />
                  ) : (
                    <>
                      <Ionicons name="log-out" size={20} color={COLORS.text} />
                      <Text style={styles.accessButtonText}>Salida</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Actividad reciente</Text>
            {recentLogs.length > 0 && (
              <TouchableOpacity onPress={handleExportOptions} style={styles.exportButton}>
                <Ionicons name="download-outline" size={16} color="#FFF" />
                <Text style={styles.exportButtonText}>Exportar</Text>
              </TouchableOpacity>
            )}
          </View>
          {recentLogs.length === 0 ? (
            <View style={styles.emptyRecent}>
              <Ionicons name="time" size={32} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>Sin registros recientes</Text>
            </View>
          ) : (
            <>
              {recentLogs.map((log) => (
                <TouchableOpacity
                  key={log.id}
                  style={styles.logCard}
                  onPress={() => log.vehicle && router.push(`/vehicle/${log.vehicle.id}`)}
                  activeOpacity={0.7}
                >
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
                      <Text style={[styles.logAction, { color: log.access_type === 'entry' ? COLORS.success : COLORS.danger }]}>
                        {log.access_type === 'entry' ? 'Entrada' : 'Salida'}
                      </Text>
                      {log.vehicle?.is_restricted && (
                        <View style={styles.restrictedBadge}>
                          <Ionicons name="warning" size={10} color="#FFF" />
                          <Text style={styles.restrictedBadgeText}>RESTRINGIDO</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.logOwner}>{log.vehicle?.owner_name || ''}</Text>
                    <Text style={styles.logDetails}>
                      {log.vehicle ? `Torre ${log.vehicle.tower} - ${log.vehicle.apartment_code}` : ''} • {formatRelativeTime(log.timestamp)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={loadFullHistory}
                disabled={loadingHistory}
                activeOpacity={0.7}
              >
                {loadingHistory ? (
                  <ActivityIndicator color={COLORS.primary} size="small" />
                ) : (
                  <>
                    <Text style={styles.viewAllText}>Ver historial completo</Text>
                    <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  backBtn: {
    padding: 4,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: "#000d30e9",
    borderColor: "#001a63e9",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  content: {
    paddingBottom: 32,
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Voice section
  voiceSection: {
    padding: 16,
    paddingBottom: 8,
  },
  voiceButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.primary + '25',
    paddingVertical: 28,
    alignItems: 'center',
  },
  voiceButtonActive: {
    borderColor: COLORS.danger + '60',
    backgroundColor: COLORS.danger + '08',
  },
  voiceIdle: {
    alignItems: 'center',
  },
  micCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary + '15',
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  voiceIdleText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  voiceIdleHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  voiceRecording: {
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.danger + '10',
    top: -18,
  },
  pulseRingInner: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.danger + '15',
    top: -8,
  },
  micCircleActive: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  voiceRecordingText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.danger,
    marginBottom: 4,
  },
  voiceRecordingHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  voiceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 10,
  },
  voiceStatusText: {
    fontSize: 13,
    color: COLORS.primary,
    flex: 1,
  },
  voiceUnavailable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
  },
  voiceUnavailableText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },

  // Search
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: COLORS.text,
    fontSize: 16,
  },

  // Results
  resultsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  resultInfo: {
    flex: 1,
  },
  resultPlate: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  resultDetails: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  // Selected vehicle
  selectedSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  selectedCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  selectedType: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedPlate: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  selectedOwner: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  selectedLocation: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  accessButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  accessButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  entryButton: {
    backgroundColor: COLORS.success,
  },
  exitButton: {
    backgroundColor: COLORS.danger,
  },
  accessButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Recent activity
  recentSection: {
    paddingHorizontal: 16,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  emptyRecent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: COLORS.textSecondary,
    marginTop: 8,
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
  logPlate: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  logPlateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logAction: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  restrictedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.danger,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  restrictedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFF',
  },
  logOwner: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  logDetails: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    backgroundColor: COLORS.primary + '08',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Filters
  filterBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 10,
    gap: 6,
    height: 38,
  },
  filterInputText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
  },
  clearFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '10',
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Full history
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  sectionBadge: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
