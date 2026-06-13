import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../src/constants';
import { licenseRepository } from '../src/lib/repositories/license.repository';
import { LicenseDevice } from '../src/types';
import { useLicense } from '../src/hooks/useLicense';
import * as Device from 'expo-device';

export default function DevicesScreen() {
  const router = useRouter();
  const { license, logout } = useLicense();
  const [devices, setDevices] = useState<LicenseDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');

  useEffect(() => {
    loadDevices();
    setCurrentDeviceId(Device.osInternalBuildId || Device.modelId || '');
  }, []);

  const loadDevices = async () => {
    if (!license) return;
    try {
      const data = await licenseRepository.getDevicesByLicense(license.id);
      setDevices(data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los dispositivos');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDevice = (device: LicenseDevice) => {
    if (device.device_id === currentDeviceId) {
      Alert.alert(
        'Este dispositivo',
        '¿Desactivar la licencia aquí? La app se cerrará.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Desactivar y salir',
            style: 'destructive',
            onPress: async () => {
              await licenseRepository.removeDevice(device.id);
              logout();
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Desactivar',
        `¿Desactivar "${device.device_name || 'Dispositivo'}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Desactivar',
            style: 'destructive',
            onPress: async () => {
              await licenseRepository.removeDevice(device.id);
              loadDevices();
            },
          },
        ]
      );
    }
  };

  const renderDevice = ({ item }: { item: LicenseDevice }) => {
    const isCurrentDevice = item.device_id === currentDeviceId;
    return (
      <View style={[styles.deviceCard, isCurrentDevice && styles.deviceCardCurrent]}>
        <View style={styles.deviceIcon}>
          <Ionicons
            name={isCurrentDevice ? 'phone-portrait' : 'phone-portrait-outline'}
            size={24}
            color={isCurrentDevice ? COLORS.primary : COLORS.textSecondary}
          />
        </View>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>
            {item.device_name || 'Desconocido'}{isCurrentDevice && ' (este)'}
          </Text>
          <Text style={styles.deviceDate}>
            {new Date(item.registered_at).toLocaleDateString('es-ES')}
          </Text>
        </View>
        <TouchableOpacity onPress={() => handleRemoveDevice(item)}>
          <Ionicons name="close-circle" size={20} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Dispositivos</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.usage}>
        {devices.length}/{license?.max_devices || 2} dispositivos en uso
      </Text>

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={renderDevice}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{loading ? 'Cargando...' : 'Sin dispositivos'}</Text>
        }
      />

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
        <Text style={styles.logoutText}>Cerrar licencia</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '600', color: COLORS.text },
  usage: { fontSize: 13, color: COLORS.textSecondary, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  list: { padding: 16, gap: 10 },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  deviceCardCurrent: { borderWidth: 1, borderColor: COLORS.primary + '40', backgroundColor: COLORS.primary + '08' },
  deviceIcon: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center',
  },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  deviceDate: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 40 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    margin: 16, paddingVertical: 14, borderRadius: 12,
    backgroundColor: COLORS.danger + '10', borderWidth: 1, borderColor: COLORS.danger + '30',
  },
  logoutText: { fontSize: 14, fontWeight: '600', color: COLORS.danger },
});
