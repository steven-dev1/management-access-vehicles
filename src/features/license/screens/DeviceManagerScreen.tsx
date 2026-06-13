import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants';
import { licenseRepository } from '../../../lib/repositories/license.repository';
import { LicenseDevice } from '../../../types';
import * as Device from 'expo-device';

interface DeviceManagerScreenProps {
  licenseId: string;
  maxDevices: number;
  onLogout: () => void;
}

export const DeviceManagerScreen: React.FC<DeviceManagerScreenProps> = ({ licenseId, maxDevices, onLogout }) => {
  const [devices, setDevices] = useState<LicenseDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');

  useEffect(() => {
    loadDevices();
    setCurrentDeviceId(Device.osInternalBuildId || Device.modelId || '');
  }, []);

  const loadDevices = async () => {
    try {
      const data = await licenseRepository.getDevicesByLicense(licenseId);
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
        '¿Quieres desactivar la licencia en este dispositivo? La app se cerrará.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Desactivar y salir',
            style: 'destructive',
            onPress: async () => {
              await licenseRepository.removeDevice(device.id);
              onLogout();
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Desactivar dispositivo',
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
            {item.device_name || 'Dispositivo desconocido'}
            {isCurrentDevice && ' (este)'}
          </Text>
          <Text style={styles.deviceDate}>
            Registrado: {new Date(item.registered_at).toLocaleDateString('es-ES')}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveDevice(item)}
        >
          <Ionicons name="close-circle" size={20} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Dispositivos</Text>
        <Text style={styles.subtitle}>
          {devices.length}/{maxDevices} dispositivos en uso
        </Text>
      </View>

      <View style={styles.usageBar}>
        <View style={styles.usageTrack}>
          <View
            style={[
              styles.usageFill,
              { width: `${(devices.length / maxDevices) * 100}%` },
              devices.length >= maxDevices && styles.usageFillFull,
            ]}
          />
        </View>
        <Text style={styles.usageText}>{devices.length} de {maxDevices}</Text>
      </View>

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={renderDevice}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {loading ? 'Cargando dispositivos...' : 'No hay dispositivos registrados'}
          </Text>
        }
      />

      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
        <Text style={styles.logoutText}>Cerrar licencia</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  usageBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  usageTrack: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  usageFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  usageFillFull: {
    backgroundColor: COLORS.danger,
  },
  usageText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  list: {
    padding: 16,
    gap: 10,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  deviceCardCurrent: {
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
    backgroundColor: COLORS.primary + '08',
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  deviceDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: 40,
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.danger + '10',
    borderWidth: 1,
    borderColor: COLORS.danger + '30',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.danger,
  },
});
