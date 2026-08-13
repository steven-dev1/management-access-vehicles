import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, Share, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { COLORS, getTowerColor } from '../../../constants';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchVehicleById, deleteVehicle } from '../../../store/vehicleSlice';
import { accessLogRepository } from '../../../lib/repositories/accessLog.repository';
import { vehicleRepository } from '../../../lib/repositories/vehicle.repository';
import { LoadingState, ErrorState } from '../../../components/EmptyState';
import { VehicleImageGallery } from '../components/VehicleImageGallery';
import { getVehicleTypeColor, formatDate, formatDateTime, formatRelativeTime, parseTimestamp } from '../../../utils';
import { AccessLog } from '../../../types';

export const VehicleDetailScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { selectedVehicle: vehicle, loading, error } = useAppSelector((state) => state.vehicles);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [vehicleImages, setVehicleImages] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);
  const [restrictionReason, setRestrictionReason] = useState('');
  const [isTogglingRestriction, setIsTogglingRestriction] = useState(false);

  const filteredLogs = useMemo(() => {
    if (!selectedDate) return accessLogs;
    const selected = selectedDate.toDateString();
    return accessLogs.filter((log) => parseTimestamp(log.timestamp).toDateString() === selected);
  }, [accessLogs, selectedDate]);

  const handleExportVehicleHistory = () => {
    Alert.alert('Exportar historial', `${vehicle?.license_plate} - Selecciona el formato:`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'PDF', onPress: () => exportVehicleAs('pdf') },
      { text: 'Excel', onPress: () => exportVehicleAs('excel') },
      { text: 'CSV', onPress: () => exportVehicleAs('csv') },
    ]);
  };

  const exportVehicleAs = async (format: 'pdf' | 'excel' | 'csv') => {
    if (!vehicle) return;
    try {
      if (format === 'csv') {
        const header = 'Fecha,Hora,Accion\n';
        const rows = filteredLogs.map(log => {
          const date = parseTimestamp(log.timestamp);
          return `${date.toLocaleDateString('es-ES')},${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })},${log.access_type === 'entry' ? 'Entrada' : 'Salida'}`;
        }).join('\n');
        await Share.share({ message: header + rows, title: `Historial ${vehicle.license_plate}` });
      } else if (format === 'excel') {
        const XLSX = await import('xlsx');
        const data = filteredLogs.map(log => {
          const date = parseTimestamp(log.timestamp);
          return {
            'Fecha': date.toLocaleDateString('es-ES'),
            'Hora': date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            'Accion': log.access_type === 'entry' ? 'Entrada' : 'Salida',
          };
        });
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Historial');
        const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        const FileSystem = await import('expo-file-system/legacy');
        const uri = `${FileSystem.cacheDirectory}historial_${vehicle.license_plate}.xlsx`;
        await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
        await (await import('expo-sharing')).shareAsync(uri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: `Historial ${vehicle.license_plate}`,
        });
      } else {
        const Print = await import('expo-print');
        const Sharing = await import('expo-sharing');
        const rows = filteredLogs.map(log => {
          const date = parseTimestamp(log.timestamp);
          const isEntry = log.access_type === 'entry';
          return `<tr><td>${date.toLocaleDateString('es-ES')}</td><td>${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</td><td style="color:${isEntry ? '#10B981' : '#EF4444'};font-weight:bold">${isEntry ? 'Entrada' : 'Salida'}</td></tr>`;
        }).join('');
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,sans-serif;padding:20px;color:#333}h1{font-size:20px}table{width:100%;border-collapse:collapse;font-size:12px;margin-top:16px}th{background:#1A1A1A;color:white;padding:8px;text-align:left}td{padding:6px;border-bottom:1px solid #eee}</style></head><body><h1>${vehicle.license_plate}</h1><p>${vehicle.owner_name} - Torre ${vehicle.tower} - ${vehicle.apartment_code}</p><table><thead><tr><th>Fecha</th><th>Hora</th><th>Accion</th></tr></thead><tbody>${rows}</tbody></table><p style="margin-top:16px;font-size:10px;color:#999">Total: ${filteredLogs.length} registros</p></body></html>`;
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Historial ${vehicle.license_plate}` });
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo exportar el historial');
    }
  };

  const onDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowCalendar(false);
    }
    if (event.type === 'set' && date) {
      setSelectedDate(date);
      setShowAllLogs(false);
    }
    if (event.type === 'dismissed') {
      setShowCalendar(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (id) {
        dispatch(fetchVehicleById(id));
        accessLogRepository.getLogsByVehicle(id).then(setAccessLogs).catch(() => {});
      }
    }, [dispatch, id])
  );

  useEffect(() => {
    if (vehicle) {
      setVehicleImages(vehicle.images || []);
    }
  }, [vehicle]);

  const handleDelete = () => {
    if (!vehicle) return;

    Alert.alert(
      'Eliminar vehículo',
      `¿Estás seguro de eliminar ${vehicle.license_plate}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteVehicle(vehicle.id)).unwrap();
              router.back();
            } catch (err) {
              Alert.alert('Error', 'Error al eliminar el vehículo');
            }
          },
        },
      ]
    );
  };

  const handleToggleRestriction = async () => {
    if (!vehicle) return;

    if (vehicle.is_restricted) {
      Alert.alert(
        'Remover restricción',
        `¿Deseas quitar la restricción a ${vehicle.license_plate}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Quitar restricción',
            onPress: async () => {
              setIsTogglingRestriction(true);
              try {
                await vehicleRepository.toggleRestriction(vehicle.id, false);
                await dispatch(fetchVehicleById(vehicle.id)).unwrap();
                Alert.alert('Éxito', 'Restricción removida');
              } catch {
                Alert.alert('Error', 'No se pudo quitar la restricción');
              } finally {
                setIsTogglingRestriction(false);
              }
            },
          },
        ]
      );
    } else {
      setRestrictionReason('');
      setShowRestrictionModal(true);
    }
  };

  const handleConfirmRestriction = async () => {
    if (!vehicle) return;
    if (!restrictionReason.trim()) {
      Alert.alert('Error', 'Debes ingresar un motivo para la restricción');
      return;
    }
    setIsTogglingRestriction(true);
    try {
      await vehicleRepository.toggleRestriction(vehicle.id, true, restrictionReason.trim());
      await dispatch(fetchVehicleById(vehicle.id)).unwrap();
      setShowRestrictionModal(false);
      Alert.alert('Éxito', 'Vehículo restringido');
    } catch {
      Alert.alert('Error', 'No se pudo restringir el vehículo');
    } finally {
      setIsTogglingRestriction(false);
    }
  };

  if (loading && !vehicle) {
    return <LoadingState message="Cargando detalles del vehículo..." />;
  }

  if (error && !vehicle) {
    return <ErrorState message={error} onRetry={() => id && dispatch(fetchVehicleById(id))} />;
  }

  if (!vehicle) {
    return <ErrorState message="Vehículo no encontrado" onRetry={() => router.back()} />;
  }

  const typeColor = getVehicleTypeColor(vehicle.vehicle_type);
  const towerColor = getTowerColor(vehicle.tower);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Detalles del vehículo</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash" size={20} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroSection}>
          <View style={[styles.typeBadge, { backgroundColor: typeColor + '20' }]}>
            <Ionicons
              name={vehicle.vehicle_type === 'car' ? 'car' : 'bicycle'}
              size={32}
              color={typeColor}
            />
          </View>
          <Text style={styles.plate}>{vehicle.license_plate}</Text>
          <Text style={styles.typeLabel}>
            {vehicle.vehicle_type === 'car' ? 'Carro' : 'Moto'}
          </Text>

          <TouchableOpacity
            style={[styles.restrictToggle, vehicle.is_restricted && styles.restrictToggleActive]}
            onPress={handleToggleRestriction}
            disabled={isTogglingRestriction}
            activeOpacity={0.7}
          >
            <Ionicons
              name={vehicle.is_restricted ? 'shield-checkmark' : 'shield-outline'}
              size={20}
              color={vehicle.is_restricted ? COLORS.danger : COLORS.textSecondary}
            />
            <Text style={[styles.restrictToggleText, vehicle.is_restricted && styles.restrictToggleTextActive]}>
              {vehicle.is_restricted ? 'Restringido' : 'Restringir'}
            </Text>
            {vehicle.is_restricted && (
              <Ionicons name="close-circle" size={16} color={COLORS.danger} />
            )}
          </TouchableOpacity>

          {vehicle.is_restricted && vehicle.restriction_reason && (
            <View style={styles.restrictionBanner}>
              <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
              <Text style={styles.restrictionBannerText}>{vehicle.restriction_reason}</Text>
            </View>
          )}
        </View>

        <VehicleImageGallery
          vehicleId={vehicle.id}
          images={vehicleImages}
          onImagesUpdate={setVehicleImages}
        />

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="location" size={20} color={towerColor} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Ubicación</Text>
              <Text style={styles.detailValue}>Torre {vehicle.tower} - Apartamento {vehicle.apartment_code}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="person" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Propietario</Text>
              <Text style={styles.detailValue}>{vehicle.owner_name}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="calendar" size={20} color={COLORS.secondary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Fecha de registro</Text>
              <Text style={styles.detailValue}>{formatDate(vehicle.created_at)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="time" size={20} color={COLORS.warning} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Última actualización</Text>
              <Text style={styles.detailValue}>{formatDate(vehicle.updated_at)}</Text>
            </View>
          </View>
        </View>

        {accessLogs.length > 0 && (
          <View style={styles.accessSection}>
            <View style={styles.accessHeader}>
              <Text style={styles.sectionTitle}>
                {selectedDate
                  ? `Historial - ${formatDate(selectedDate.toISOString())}`
                  : 'Historial de accesos'}
              </Text>
              <TouchableOpacity onPress={handleExportVehicleHistory} style={styles.exportBtn}>
                <Ionicons name="download-outline" size={18} color={COLORS.primary} />
                <Text style={styles.exportBtnText}>Exportar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateFilterRow}>
              <TouchableOpacity
                style={styles.calendarBtn}
                onPress={() => setShowCalendar(true)}
              >
                <Ionicons name="calendar" size={18} color={COLORS.primary} />
                <Text style={styles.calendarBtnText}>
                  {selectedDate ? formatDate(selectedDate.toISOString()) : 'Seleccionar fecha'}
                </Text>
              </TouchableOpacity>
              {selectedDate && (
                <TouchableOpacity
                  style={styles.clearDateBtn}
                  onPress={() => { setSelectedDate(null); setShowAllLogs(false); }}
                >
                  <Ionicons name="close-circle" size={18} color={COLORS.danger} />
                  <Text style={styles.clearDateText}>Limpiar</Text>
                </TouchableOpacity>
              )}
            </View>

            {showCalendar && (
              <View>
                <DateTimePicker
                  value={selectedDate || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity style={styles.closeCalendarBtn} onPress={() => setShowCalendar(false)}>
                    <Text style={styles.closeCalendarText}>Cerrar</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {filteredLogs.slice(0, showAllLogs ? filteredLogs.length : 5).map((log) => (
              <View key={log.id} style={styles.logRow}>
                <View style={[styles.logIcon, { backgroundColor: log.access_type === 'entry' ? COLORS.success + '20' : COLORS.danger + '20' }]}>
                  <Ionicons
                    name={log.access_type === 'entry' ? 'log-in' : 'log-out'}
                    size={14}
                    color={log.access_type === 'entry' ? COLORS.success : COLORS.danger}
                  />
                </View>
                <View style={styles.logContent}>
                  <Text style={styles.logType}>{log.access_type === 'entry' ? 'Entrada' : 'Salida'}</Text>
                  <Text style={styles.logTimestamp}>{formatDateTime(log.timestamp)}</Text>
                </View>
              </View>
            ))}
            {filteredLogs.length === 0 && selectedDate && (
              <View style={styles.emptyLogs}>
                <Ionicons name="document-text" size={32} color={COLORS.textSecondary} />
                <Text style={styles.emptyLogsText}>Sin registros para esta fecha</Text>
              </View>
            )}
            {filteredLogs.length > 5 && !showAllLogs && (
              <TouchableOpacity style={styles.showMoreBtn} onPress={() => setShowAllLogs(true)}>
                <Text style={styles.showMoreText}>Ver todo ({filteredLogs.length})</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.accessButtons}>
          <TouchableOpacity
            style={[styles.accessButton, styles.entryButton]}
            onPress={async () => {
              try {
                await accessLogRepository.logAccess(vehicle.id, 'entry', vehicle.license_plate);
                Alert.alert('Entrada registrada', vehicle.license_plate);
                accessLogRepository.getLogsByVehicle(vehicle.id).then(setAccessLogs);
              } catch (err: any) {
                Alert.alert('Error', err.message || 'Error al registrar entrada');
              }
            }}
          >
            <Ionicons name="log-in" size={20} color={COLORS.text} />
            <Text style={styles.accessButtonText}>Entrada</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.accessButton, styles.exitButton]}
            onPress={async () => {
              try {
                await accessLogRepository.logAccess(vehicle.id, 'exit', vehicle.license_plate);
                Alert.alert('Salida registrada', vehicle.license_plate);
                accessLogRepository.getLogsByVehicle(vehicle.id).then(setAccessLogs);
              } catch (err: any) {
                Alert.alert('Error', err.message || 'Error al registrar salida');
              }
            }}
          >
            <Ionicons name="log-out" size={20} color={COLORS.text} />
            <Text style={styles.accessButtonText}>Salida</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push(`/vehicle/edit/${vehicle.id}`)}
        >
          <Ionicons name="create" size={20} color={COLORS.text} />
          <Text style={styles.editButtonText}>Editar vehículo</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showRestrictionModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="shield" size={24} color={COLORS.danger} />
              <Text style={styles.modalTitle}>Restringir vehículo</Text>
            </View>
            <Text style={styles.modalSubtitle}>
              Ingresa el motivo para restringir {vehicle.license_plate}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Motivo de restricción..."
              placeholderTextColor={COLORS.textSecondary}
              value={restrictionReason}
              onChangeText={setRestrictionReason}
              multiline
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowRestrictionModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, isTogglingRestriction && styles.modalConfirmBtnDisabled]}
                onPress={handleConfirmRestriction}
                disabled={isTogglingRestriction}
              >
                <Ionicons name="shield-checkmark" size={18} color="#FFF" />
                <Text style={styles.modalConfirmText}>
                  {isTogglingRestriction ? 'Restringiendo...' : 'Restringir'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 24,
  },
  typeBadge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  plate: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 2,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  detailsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  accessButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  accessButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  accessSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  logIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logType: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  logTimestamp: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  accessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.primary + '15',
    borderRadius: 8,
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  dateFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  calendarBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  calendarBtnText: {
    fontSize: 13,
    color: COLORS.text,
  },
  clearDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.danger + '15',
  },
  clearDateText: {
    fontSize: 13,
    color: COLORS.danger,
    fontWeight: '600',
  },
  emptyLogs: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyLogsText: {
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  closeCalendarBtn: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginTop: 8,
  },
  closeCalendarText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  showMoreBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  showMoreText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  restrictToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  restrictToggleActive: {
    backgroundColor: COLORS.danger + '15',
    borderColor: COLORS.danger + '40',
  },
  restrictToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  restrictToggleTextActive: {
    color: COLORS.danger,
  },
  restrictionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.danger + '10',
    borderRadius: 8,
  },
  restrictionBannerText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '500',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modalConfirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.danger,
  },
  modalConfirmBtnDisabled: {
    opacity: 0.6,
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});
