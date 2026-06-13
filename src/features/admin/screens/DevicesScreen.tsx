import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants';
import { licenseRepository } from '../../../lib/repositories/license.repository';
import { LicenseDevice } from '../../../types';

export default function DevicesScreen() {
  const [devices, setDevices] = useState<(LicenseDevice & { license_key?: string; complex_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDevices(); }, []);

  const loadDevices = async () => {
    try {
      const dev = await licenseRepository.getAllDevices();
      setDevices(dev);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los dispositivos');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDevice = async (device: LicenseDevice & { complex_name?: string }) => {
    Alert.alert('Desactivar', `¿Desactivar "${device.device_name}" de ${device.complex_name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desactivar', style: 'destructive',
        onPress: async () => {
          try {
            await licenseRepository.removeDevice(device.id);
            setDevices(prev => prev.filter(d => d.id !== device.id));
          } catch {
            Alert.alert('Error', 'No se pudo desactivar');
          }
        },
      },
    ]);
  };

  const renderDevice = ({ item }: { item: LicenseDevice & { license_key?: string; complex_name?: string } }) => {
    const isRecent = new Date(item.registered_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <View style={[styles.deviceIcon, isRecent && styles.deviceIconRecent]}>
              <Ionicons name="phone-portrait" size={18} color={isRecent ? '#10B981' : COLORS.textSecondary} />
            </View>
            <View>
              <Text style={styles.cardTitle}>{item.device_name || 'Dispositivo desconocido'}</Text>
              <Text style={styles.cardSub}>{item.complex_name}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveDevice(item)}>
            <Ionicons name="close-circle" size={22} color={COLORS.danger} />
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
        ListEmptyComponent={<Text style={styles.emptyText}>{loading ? 'Cargando...' : 'Sin dispositivos registrados'}</Text>}
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  deviceIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  deviceIconRecent: { backgroundColor: '#10B98115' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  cardSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  removeBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  cardMeta: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: COLORS.textSecondary },
  deviceId: { fontSize: 10, color: COLORS.textSecondary, opacity: 0.6 },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 40 },
});
