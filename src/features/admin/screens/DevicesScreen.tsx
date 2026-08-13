import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../../constants';
import { licenseRepository } from '../../../lib/repositories/license.repository';
import { LicenseDevice } from '../../../types';

export default function DevicesScreen() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

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
    Alert.alert(action, `${action} "${device.device_name}" de ${device.complex_name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: action,
        style: newActive ? 'default' : 'destructive',
        onPress: () => toggleMutation.mutate({ id: device.id, active: newActive }),
      },
    ]);
  };

  const filtered = devices.filter((d) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (d.device_name || '').toLowerCase().includes(q) ||
      (d.complex_name || '').toLowerCase().includes(q) ||
      (d.device_id || '').toLowerCase().includes(q)
    );
  });

  const activeDevices = devices.filter((d) => d.active).length;

  const renderDevice = ({ item }: { item: LicenseDevice & { license_key?: string; complex_name?: string } }) => {
    const isRecent = new Date(item.registered_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const isActive = item.active;

    return (
      <View style={[styles.card, !isActive && styles.cardDisabled]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <View
              style={[
                styles.deviceIcon,
                isRecent && isActive && styles.deviceIconRecent,
                !isActive && styles.deviceIconDisabled,
              ]}
            >
              <Ionicons
                name="phone-portrait"
                size={18}
                color={isActive ? (isRecent ? COLORS.success : COLORS.textSecondary) : COLORS.danger}
              />
            </View>
            <View style={styles.deviceInfo}>
              <View style={styles.deviceNameRow}>
                <Text style={[styles.cardTitle, !isActive && styles.textDisabled]} numberOfLines={1}>
                  {item.device_name || 'Desconocido'}
                </Text>
                {!isActive && (
                  <View style={styles.inactiveBadge}>
                    <View style={styles.inactiveDot} />
                    <Text style={styles.inactiveText}>Inactivo</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardSub}>{item.complex_name}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.toggleBtn, isActive ? styles.toggleBtnActive : styles.toggleBtnInactive]}
            onPress={() => handleToggleDevice(item)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive ? 'close-circle' : 'checkmark-circle'}
              size={20}
              color={isActive ? COLORS.danger : COLORS.success}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.deviceIdContainer}>
          <Text style={styles.deviceIdLabel}>DEVICE ID</Text>
          <Text style={styles.deviceId}>{item.device_id.substring(0, 24)}...</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dispositivos</Text>
          <Text style={styles.subtitle}>
            {activeDevices} activos de {devices.length} registrados
          </Text>
        </View>
        <View style={styles.countBadge}>
          <Ionicons name="phone-portrait" size={16} color={COLORS.primary} />
          <Text style={styles.countText}>{devices.length}</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre, conjunto o ID..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderDevice}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="phone-portrait-outline" size={48} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>
              {isLoading
                ? 'Cargando...'
                : search
                  ? 'Sin resultados'
                  : 'Sin dispositivos'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {isLoading
                ? 'Obteniendo datos...'
                : search
                  ? 'No se encontraron dispositivos con ese criterio'
                  : 'Los dispositivos registrados apareceran aqui'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryGlow,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginLeft: SPACING.sm,
    paddingVertical: 0,
  },

  list: {
    padding: SPACING.xl,
    paddingBottom: 100,
    gap: SPACING.md,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  deviceIconRecent: {
    backgroundColor: COLORS.successGlow,
    borderColor: COLORS.success + '30',
  },
  deviceIconDisabled: {
    backgroundColor: COLORS.dangerGlow,
    borderColor: COLORS.danger + '30',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  textDisabled: {
    color: COLORS.textMuted,
  },
  cardSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
    fontWeight: '500',
  },
  toggleBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.dangerGlow,
    borderColor: COLORS.danger + '30',
  },
  toggleBtnInactive: {
    backgroundColor: COLORS.successGlow,
    borderColor: COLORS.success + '30',
  },
  inactiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerGlow,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.danger + '30',
  },
  inactiveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.danger,
  },
  inactiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.danger,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  deviceIdContainer: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  deviceIdLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  deviceId: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: SPACING.md,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: SPACING.xxxl,
  },
});
