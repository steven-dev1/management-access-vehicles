import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Share,
  SectionList,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../../constants';
import { accessLogRepository } from '../../../lib/repositories/accessLog.repository';
import { useVoiceCommand, isExpoGoEnvironment } from '../../../hooks/useVoiceCommand';
import { Vehicle, AccessLog } from '../../../types';
import { formatRelativeTime, getVehicleTypeColor, parseTimestamp } from '../../../utils';
import { useHaptics } from '../../../hooks/useHaptics';
import { useRealtimeAccessLogs } from '../../../hooks/useRealtime';
import * as XLSX from 'xlsx';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

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
  const [filterDateFrom, setFilterDateFrom] = useState<Date | null>(null);
  const [filterDateTo, setFilterDateTo] = useState<Date | null>(null);
  const [showPickerFrom, setShowPickerFrom] = useState(false);
  const [showPickerTo, setShowPickerTo] = useState(false);
  const { listening, voiceText, startListening, updateVoiceText, isVoiceAvailable } = useVoiceCommand();
  const { impactMedium, notificationSuccess } = useHaptics();
  const [voiceSupported, setVoiceSupported] = useState<boolean | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadRecentLogs();
    isVoiceAvailable().then(setVoiceSupported);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (listening) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [listening, pulseAnim]);

  const onScalePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
  }, [scaleAnim]);

  useRealtimeAccessLogs(() => {
    loadRecentLogs();
  });

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
      const plate = filterPlate.toUpperCase().trim();
      const startDate = filterDateFrom ? filterDateFrom.toISOString() : undefined;
      const endDate = filterDateTo
        ? new Date(filterDateTo.getTime() + 86400000).toISOString()
        : undefined;

      if (plate) {
        const allFilteredLogs = historySections.flatMap((s) => s.data);

        if (format === 'csv') {
          const header = 'Fecha,Hora,Placa,Tipo,Torre,Apartamento,Propietario,Tipo Accion\n';
          const rows = allFilteredLogs
            .map((log: any) => {
              const date = parseTimestamp(log.timestamp);
              const v = log.vehicle;
              return `${date.toLocaleDateString('es-ES')},${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })},${v?.license_plate || ''},${v?.vehicle_type === 'car' ? 'Carro' : 'Moto'},${v?.tower || ''},${v?.apartment_code || ''},${v?.owner_name || ''},${log.access_type === 'entry' ? 'Entrada' : 'Salida'}`;
            })
            .join('\n');
          await Share.share({ message: header + rows, title: 'Historial de accesos' });
        } else if (format === 'excel') {
          const rows = allFilteredLogs.map((log: any) => {
            const date = parseTimestamp(log.timestamp);
            const v = log.vehicle;
            return {
              Fecha: date.toLocaleDateString('es-ES'),
              Hora: date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
              Placa: v?.license_plate || '',
              Tipo: v?.vehicle_type === 'car' ? 'Carro' : 'Moto',
              Torre: v?.tower || '',
              Apartamento: v?.apartment_code || '',
              Propietario: v?.owner_name || '',
              Accion: log.access_type === 'entry' ? 'Entrada' : 'Salida',
            };
          });
          const ws = XLSX.utils.json_to_sheet(rows);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Historial');
          const excelBuffer = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
          const uri = `${FileSystem.cacheDirectory}historial_accesos.xlsx`;
          await FileSystem.writeAsStringAsync(uri, excelBuffer, {
            encoding: FileSystem.EncodingType.Base64,
          });
          await Sharing.shareAsync(uri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'Exportar historial',
          });
        } else {
          const rows = allFilteredLogs
            .map((log: any) => {
              const date = parseTimestamp(log.timestamp);
              const v = log.vehicle;
              const isEntry = log.access_type === 'entry';
              return `<tr><td>${date.toLocaleDateString('es-ES')}</td><td>${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</td><td><strong>${v?.license_plate || ''}</strong></td><td>${v?.vehicle_type === 'car' ? 'Carro' : 'Moto'}</td><td>Torre ${v?.tower || ''}</td><td>${v?.apartment_code || ''}</td><td>${v?.owner_name || ''}</td><td style="color:${isEntry ? '#10B981' : '#EF4444'};font-weight:bold;">${isEntry ? 'Entrada' : 'Salida'}</td></tr>`;
            })
            .join('');
          const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:sans-serif;padding:20px;background:#09090B;color:#FAFAFA}table{width:100%;border-collapse:collapse}th,td{border:1px solid #27272A;padding:8px;text-align:left}th{background:#18181B;color:#FAFAFA}tr:nth-child(even){background:#18181B}</style></head><body><h2>Historial de Accesos</h2><table><thead><tr><th>Fecha</th><th>Hora</th><th>Placa</th><th>Tipo</th><th>Torre</th><th>Apto</th><th>Propietario</th><th>Accion</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
          const { uri } = await Print.printToFileAsync({ html });
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Exportar historial',
          });
        }
      } else {
        if (format === 'csv') {
          const csv = await accessLogRepository.exportLogsToCSV(startDate, endDate);
          await Share.share({ message: csv, title: 'Historial de accesos' });
        } else if (format === 'excel') {
          await accessLogRepository.exportLogsToExcel(startDate, endDate);
        } else {
          await accessLogRepository.exportLogsToPDF(startDate, endDate);
        }
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
      setShowFullHistory(true);
    } catch (err) {
      Alert.alert('Error', 'No se pudo cargar el historial');
    } finally {
      setLoadingHistory(false);
    }
  };

  const applyHistoryFilters = useCallback(() => {
    const plate = filterPlate.toUpperCase().trim();

    const filtered = allHistoryLogs.filter((log) => {
      if (plate && !(log.vehicle?.license_plate || '').toUpperCase().includes(plate)) return false;
      const logDate = parseTimestamp(log.timestamp);
      if (filterDateFrom && logDate < filterDateFrom) return false;
      if (filterDateTo) {
        const endOfDay = new Date(filterDateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (logDate > endOfDay) return false;
      }
      return true;
    });

    const grouped = new Map<string, AccessLog[]>();
    for (const log of filtered) {
      const date = parseTimestamp(log.timestamp);
      const key = date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(log);
    }

    const sections: LogSection[] = [];
    for (const [dateStr, logGroup] of grouped) {
      sections.push({ title: dateStr, data: logGroup });
    }
    setHistorySections(sections);
  }, [allHistoryLogs, filterPlate, filterDateFrom, filterDateTo]);

  useEffect(() => {
    if (showFullHistory) {
      applyHistoryFilters();
    }
  }, [applyHistoryFilters, showFullHistory]);

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
        Alert.alert(
          'Placa no detectada',
          `No se pudo detectar la placa en: "${result.rawText}"\n\nIntenta de nuevo hablando más claro.`,
          [{ text: 'OK' }]
        );
        setTimeout(() => updateVoiceText(''), 3000);
        return;
      }

      if (!result.action) {
        Alert.alert(
          'Acción no detectada',
          `No se detectó si es entrada o salida.\n\nPlaca detectada: ${result.plate}\n\nIntenta de nuevo hablando más claro.`,
          [{ text: 'OK' }]
        );
        setTimeout(() => updateVoiceText(''), 3000);
        return;
      }

      const vehicle = await accessLogRepository.getVehicleByPlate(result.plate);

      if (!vehicle) {
        Alert.alert(
          'Vehículo no encontrado',
          `Placa: ${result.plate}\n\nNo se encontró en el sistema.`,
          [{ text: 'OK' }]
        );
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
        { text: 'OK' },
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

  const hasActiveFilters = filterPlate || filterDateFrom || filterDateTo;

  const clearAllFilters = () => {
    setFilterPlate('');
    setFilterDateFrom(null);
    setFilterDateTo(null);
  };

  const renderLogCard = (log: AccessLog) => (
    <TouchableOpacity
      key={log.id}
      style={styles.logCard}
      onPress={() => {
        onScalePress();
        log.vehicle && router.push(`/vehicle/${log.vehicle.id}`);
      }}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.logIcon,
          {
            backgroundColor:
              log.access_type === 'entry'
                ? COLORS.successGlow
                : COLORS.dangerGlow,
          },
        ]}
      >
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
          <Text
            style={[
              styles.logAction,
              { color: log.access_type === 'entry' ? COLORS.success : COLORS.danger },
            ]}
          >
            {log.access_type === 'entry' ? 'Entrada' : 'Salida'}
          </Text>
          {log.vehicle?.is_restricted && (
            <View style={styles.restrictedBadge}>
              <Ionicons name="warning" size={9} color={COLORS.textInverse} />
              <Text style={styles.restrictedBadgeText}>RESTRINGIDO</Text>
            </View>
          )}
        </View>
        <Text style={styles.logOwner}>{log.vehicle?.owner_name || ''}</Text>
        <Text style={styles.logDetails}>
          {log.vehicle ? `Torre ${log.vehicle.tower} - ${log.vehicle.apartment_code}` : ''} ·{' '}
          {formatRelativeTime(log.timestamp)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // ── Full History View ──────────────────────────────────────────────────
  if (showFullHistory) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setShowFullHistory(false)}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Historial completo</Text>
          <TouchableOpacity
            onPress={handleExportOptions}
            style={styles.exportBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="download-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.exportBtnText}>Exportar</Text>
          </TouchableOpacity>
        </View>

        {loadingHistory ? (
          <View style={styles.centerContent}>
            <ActivityIndicator color={COLORS.primary} size="large" />
          </View>
        ) : (
          <>
            {/* Filter bar */}
            <View style={styles.filterBar}>
              <View style={styles.filterRow}>
                <View style={styles.filterInput}>
                  <Ionicons name="search" size={14} color={COLORS.textMuted} />
                  <TextInput
                    style={styles.filterInputText}
                    placeholder="Placa"
                    placeholderTextColor={COLORS.textMuted}
                    value={filterPlate}
                    onChangeText={setFilterPlate}
                    autoCapitalize="characters"
                  />
                  {filterPlate.length > 0 && (
                    <TouchableOpacity onPress={() => setFilterPlate('')} hitSlop={8}>
                      <Ionicons name="close-circle" size={14} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.filterDateBtn, filterDateFrom && styles.filterDateActive]}
                  onPress={() => setShowPickerFrom(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={13} color={filterDateFrom ? COLORS.primary : COLORS.textMuted} />
                  <Text
                    style={[
                      styles.filterDateText,
                      { color: filterDateFrom ? COLORS.primary : COLORS.textMuted },
                    ]}
                  >
                    {filterDateFrom
                      ? filterDateFrom.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
                      : 'Desde'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterDateBtn, filterDateTo && styles.filterDateActive]}
                  onPress={() => setShowPickerTo(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={13} color={filterDateTo ? COLORS.primary : COLORS.textMuted} />
                  <Text
                    style={[
                      styles.filterDateText,
                      { color: filterDateTo ? COLORS.primary : COLORS.textMuted },
                    ]}
                  >
                    {filterDateTo
                      ? filterDateTo.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
                      : 'Hasta'}
                  </Text>
                </TouchableOpacity>
              </View>
              {hasActiveFilters && (
                <TouchableOpacity style={styles.clearFiltersBtn} onPress={clearAllFilters} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={12} color={COLORS.primary} />
                  <Text style={styles.clearFiltersText}>Limpiar</Text>
                </TouchableOpacity>
              )}
            </View>

            {showPickerFrom && (
              <DateTimePicker
                value={filterDateFrom || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event: DateTimePickerEvent, date?: Date) => {
                  if (event.type === 'dismissed' || Platform.OS !== 'ios') {
                    setShowPickerFrom(false);
                  }
                  if (date && event.type !== 'dismissed') setFilterDateFrom(date);
                }}
                maximumDate={filterDateTo || new Date()}
                themeVariant="dark"
              />
            )}
            {showPickerTo && (
              <DateTimePicker
                value={filterDateTo || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event: DateTimePickerEvent, date?: Date) => {
                  if (event.type === 'dismissed' || Platform.OS !== 'ios') {
                    setShowPickerTo(false);
                  }
                  if (date && event.type !== 'dismissed') setFilterDateTo(date);
                }}
                minimumDate={filterDateFrom || undefined}
                maximumDate={new Date()}
                themeVariant="dark"
              />
            )}

            <SectionList
              sections={historySections}
              keyExtractor={(item) => item.id}
              stickySectionHeadersEnabled
              renderSectionHeader={({ section }) => (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderText}>
                    {formatDateHeader(section.title)}
                  </Text>
                  <View style={styles.sectionBadge}>
                    <Text style={styles.sectionBadgeText}>{section.data.length}</Text>
                  </View>
                </View>
              )}
              renderItem={({ item: log }) => renderLogCard(log)}
              contentContainerStyle={styles.listContent}
              renderSectionFooter={() => <View style={{ height: SPACING.md }} />}
              ListEmptyComponent={
                <View style={styles.centerContent}>
                  <Ionicons name="search-outline" size={36} color={COLORS.textMuted} />
                  <Text style={styles.emptyText}>Sin resultados</Text>
                </View>
              }
            />
          </>
        )}
      </SafeAreaView>
    );
  }

  // ── Main View ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="shield-checkmark" size={18} color={COLORS.primary} />
          </View>
          <Text style={styles.headerTitle}>Control de Acceso</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Voice Section */}
        <View style={styles.voiceSection}>
          {voiceSupported !== false ? (
            <TouchableOpacity
              style={[styles.voiceButton, listening && styles.voiceButtonActive]}
              onPress={handleVoiceCommand}
              disabled={listening}
              activeOpacity={0.85}
            >
              {listening ? (
                <View style={styles.voiceRecording}>
                  <Animated.View
                    style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]}
                  />
                  <Animated.View
                    style={[styles.pulseRingInner, { transform: [{ scale: pulseAnim }] }]}
                  />
                  <View style={styles.micCircleActive}>
                    <Ionicons name="mic" size={26} color={COLORS.textInverse} />
                  </View>
                  <Text style={styles.voiceRecordingText}>Escuchando…</Text>
                  <Text style={styles.voiceRecordingHint}>Di la placa y la acción</Text>
                </View>
              ) : (
                <View style={styles.voiceIdle}>
                  <View style={styles.micCircle}>
                    <Ionicons name="mic" size={26} color={COLORS.primary} />
                  </View>
                  <Text style={styles.voiceIdleText}>Activar voz</Text>
                  <Text style={styles.voiceIdleHint}>Di la placa y la acción</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.voiceUnavailable}>
              <Ionicons name="mic-off" size={16} color={COLORS.textMuted} />
              <Text style={styles.voiceUnavailableText}>
                Comando de voz no disponible en este dispositivo
              </Text>
            </View>
          )}

          {voiceText && !listening && (
            <View style={styles.voiceStatus}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
              <Text style={styles.voiceStatusText} numberOfLines={2}>
                {voiceText}
              </Text>
            </View>
          )}
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionLabel}>Buscar vehículo</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por placa…"
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={handleSearch}
              autoCapitalize="characters"
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setSelectedVehicle(null);
                }}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionLabel}>Resultados</Text>
            {searchResults.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={styles.resultCard}
                onPress={() => setSelectedVehicle(vehicle)}
                activeOpacity={0.7}
              >
                <View style={styles.resultInfo}>
                  <Text style={styles.resultPlate}>{vehicle.license_plate}</Text>
                  <Text style={styles.resultDetails}>
                    Torre {vehicle.tower} - {vehicle.apartment_code} · {vehicle.owner_name}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Selected Vehicle */}
        {selectedVehicle && (
          <View style={styles.selectedSection}>
            <Text style={styles.sectionLabel}>Vehículo seleccionado</Text>
            <View style={styles.selectedCard}>
              <View style={styles.selectedHeader}>
                <View
                  style={[
                    styles.selectedType,
                    {
                      backgroundColor: getVehicleTypeColor(selectedVehicle.vehicle_type) + '18',
                    },
                  ]}
                >
                  <Ionicons
                    name={selectedVehicle.vehicle_type === 'car' ? 'car' : 'bicycle'}
                    size={22}
                    color={getVehicleTypeColor(selectedVehicle.vehicle_type)}
                  />
                </View>
                <View style={styles.selectedTextInfo}>
                  <Text style={styles.selectedPlate}>{selectedVehicle.license_plate}</Text>
                  <Text style={styles.selectedOwner}>{selectedVehicle.owner_name}</Text>
                </View>
              </View>
              <Text style={styles.selectedLocation}>
                Torre {selectedVehicle.tower} · {selectedVehicle.apartment_code}
              </Text>

              <View style={styles.accessButtons}>
                <TouchableOpacity
                  style={[styles.accessBtn, styles.entryBtn]}
                  onPress={() => handleLogAccess(selectedVehicle, 'entry')}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.text} size="small" />
                  ) : (
                    <>
                      <Ionicons name="log-in" size={18} color={COLORS.text} />
                      <Text style={styles.accessBtnText}>Entrada</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.accessBtn, styles.exitBtn]}
                  onPress={() => handleLogAccess(selectedVehicle, 'exit')}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.text} size="small" />
                  ) : (
                    <>
                      <Ionicons name="log-out" size={18} color={COLORS.text} />
                      <Text style={styles.accessBtnText}>Salida</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Recent Activity */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionLabel}>Actividad reciente</Text>
          </View>
          {recentLogs.length === 0 ? (
            <View style={styles.emptyRecent}>
              <Ionicons name="time-outline" size={32} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Sin registros recientes</Text>
            </View>
          ) : (
            <>
              {recentLogs.map((log) => renderLogCard(log))}

              <TouchableOpacity
                style={styles.viewAllBtn}
                onPress={loadFullHistory}
                disabled={loadingHistory}
                activeOpacity={0.7}
              >
                {loadingHistory ? (
                  <ActivityIndicator color={COLORS.primary} size="small" />
                ) : (
                  <>
                    <Text style={styles.viewAllText}>Ver historial completo</Text>
                    <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
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

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ─ Header ─
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // ─ Content ─
  content: {
    paddingBottom: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: SPACING.sm,
  },
  listContent: {
    paddingBottom: 40,
  },

  // ─ Voice ─
  voiceSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  voiceButton: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    paddingVertical: 32,
    alignItems: 'center',
  },
  voiceButtonActive: {
    borderColor: COLORS.danger + '50',
    backgroundColor: COLORS.surfaceElevated,
  },
  voiceIdle: {
    alignItems: 'center',
  },
  micCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primaryGlow,
    borderWidth: 1.5,
    borderColor: COLORS.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  voiceIdleText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  voiceIdleHint: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  voiceRecording: {
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.dangerGlow,
    top: -22,
  },
  pulseRingInner: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.danger + '12',
    top: -11,
  },
  micCircleActive: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.glow(COLORS.danger),
  },
  voiceRecordingText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.danger,
    marginBottom: 4,
  },
  voiceRecordingHint: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  voiceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    backgroundColor: COLORS.primaryGlow,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary + '18',
  },
  voiceStatusText: {
    fontSize: 13,
    color: COLORS.primary,
    flex: 1,
    fontWeight: '500',
  },
  voiceUnavailable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  voiceUnavailableText: {
    fontSize: 13,
    color: COLORS.textMuted,
    flex: 1,
  },

  // ─ Search ─
  searchSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: SPACING.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: COLORS.text,
    fontSize: 15,
  },

  // ─ Results ─
  resultsSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  resultInfo: {
    flex: 1,
  },
  resultPlate: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  resultDetails: {
    fontSize: 13,
    color: COLORS.textMuted,
  },

  // ─ Selected Vehicle ─
  selectedSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  selectedCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: SPACING.lg,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  selectedType: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTextInfo: {
    flex: 1,
  },
  selectedPlate: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.4,
  },
  selectedOwner: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  selectedLocation: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: SPACING.lg,
  },
  accessButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  accessBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
  },
  entryBtn: {
    backgroundColor: COLORS.success,
    ...SHADOWS.glow(COLORS.success),
  },
  exitBtn: {
    backgroundColor: COLORS.danger,
    ...SHADOWS.glow(COLORS.danger),
  },
  accessBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },

  // ─ Recent Activity ─
  recentSection: {
    paddingHorizontal: SPACING.lg,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  emptyRecent: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: SPACING.sm,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  logIcon: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
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
    letterSpacing: 0.2,
  },
  logPlateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  logAction: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  restrictedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.danger,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginLeft: 4,
  },
  restrictedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textInverse,
    letterSpacing: 0.4,
  },
  logOwner: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  logDetails: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 14,
    marginTop: SPACING.xs,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + '25',
    backgroundColor: COLORS.primaryGlow,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // ─ Filters ─
  filterBar: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  filterInput: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: SPACING.sm,
    gap: SPACING.xs,
    height: 36,
  },
  filterInputText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
  },
  filterDateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    height: 36,
  },
  filterDateActive: {
    borderColor: COLORS.primary + '40',
    backgroundColor: COLORS.primaryGlow,
  },
  filterDateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  clearFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryGlow,
  },
  clearFiltersText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // ─ Section Header ─
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    backgroundColor: COLORS.background,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  sectionBadge: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    minWidth: 28,
    alignItems: 'center',
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
});
