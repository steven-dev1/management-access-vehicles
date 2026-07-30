import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { COLORS } from '../../../constants';
import { licenseRepository } from '../../../lib/repositories/license.repository';
import { LicenseDevice } from '../../../types';

export default function DevicesScreen() {
  const queryClient = useQueryClient();

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ['admin-devices'],
    queryFn: () => licenseRepository.getAllDevices(),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? licenseRepository.enableDevice(id) : licenseRepository.removeDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-devices'] });
    },
    onError: () => Alert.alert('Error', 'No se pudo cambiar el estado'),
  });

  const handleToggleDevice = (device: LicenseDevice & { complex_name?: string }) => {
    const newActive = !device.active;
    const action = newActive ? 'Habilitar' : 'Deshabilitar';
    Alert.alert(action, `¿${action} "${device.device_name}" de ${device.complex_name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: action, style: newActive ? 'default' : 'destructive', onPress: () => toggleMutation.mutate({ id: device.id, active: newActive }) },
    ]);
  };

  const renderDevice = ({ item }: { item: LicenseDevice & { license_key?: string; complex_name?: string } }) => {
    const isRecent = new Date(item.registered_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const isActive = item.active;
    return (
      <View style={[styles.card, !isActive && styles.cardDisabled]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <View style={[styles.deviceIcon, isRecent && isActive && styles.deviceIconRecent, !isActive && styles.deviceIconDisabled]}>
              <Ionicons name="phone-portrait" size={18} color={isActive ? (isRecent ? '#10B981' : COLORS.textSecondary) : '#EF4444'} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.cardTitle, !isActive && styles.textDisabled]}>{item.device_name || 'Dispositivo desconocido'}</Text>
                {!isActive && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Inactivo</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardSub}>{item.complex_name}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.toggleBtn} onPress={() => handleToggleDevice(item)}>
            <Ionicons
              name={isActive ? 'close-circle' : 'checkmark-circle'}
              size={22}
              color={isActive ? COLORS.danger : '#10B981'}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="key" size={12} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{item.license_key}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar" size={12} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{new Date(item.registered_at).toLocaleDateString('es-ES')}</Text>
          </View>
        </View>
        <Text style={styles.deviceId}>ID: {item.device_id.substring(0, 24)}...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dispositivos</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{devices.length}</Text>
        </View>
      </View>
      <FlatList
        data={devices}
        keyExtractor={i => i.id}
        renderItem={renderDevice}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>{isLoading ? 'Cargando...' : 'Sin dispositivos registrados'}</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  countBadge: { backgroundColor: COLORS.primary + '20', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  countText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  list: { padding: 20, gap: 12 },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16 },
  cardDisabled: { opacity: 0.6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  deviceIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  deviceIconRecent: { backgroundColor: '#10B98115' },
  deviceIconDisabled: { backgroundColor: '#EF444415' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  textDisabled: { color: COLORS.textSecondary },
  cardSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  toggleBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  badge: { backgroundColor: '#EF444420', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: '600', color: '#EF4444' },
  cardMeta: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: COLORS.textSecondary },
  deviceId: { fontSize: 10, color: COLORS.textSecondary, opacity: 0.6 },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 40 },
});
