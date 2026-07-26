import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { COLORS } from '../../../constants';
import { licenseRepository } from '../../../lib/repositories/license.repository';
import { useAdminLogout } from '../../../hooks/useAdmin';

export default function PanelScreen() {
  const { logout } = useAdminLogout();

  const { data: licenses = [], refetch: refetchLicenses } = useQuery({
    queryKey: ['admin-licenses'],
    queryFn: () => licenseRepository.getAllLicenses(),
  });

  const { data: devices = [], refetch: refetchDevices } = useQuery({
    queryKey: ['admin-devices'],
    queryFn: () => licenseRepository.getAllDevices(),
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchLicenses(), refetchDevices()]);
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert('Cerrar sesión', '¿Salir del panel de administración?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const activeLicenses = licenses.filter(l => l.active).length;
  const expiredLicenses = licenses.filter(l => l.active && l.trial_ends_at && new Date(l.trial_ends_at) < new Date()).length;
  const totalDevices = devices.length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Panel de Control</Text>
          <Text style={styles.subtitle}>Gestión administrativa</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: COLORS.primary + '15' }]}>
            <Ionicons name="key" size={24} color={COLORS.primary} />
            <Text style={styles.statNumber}>{licenses.length}</Text>
            <Text style={styles.statLabel}>Licencias</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#10B981' + '15' }]}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.statNumber}>{activeLicenses}</Text>
            <Text style={styles.statLabel}>Activas</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.warning + '15' }]}>
            <Ionicons name="time" size={24} color={COLORS.warning} />
            <Text style={styles.statNumber}>{expiredLicenses}</Text>
            <Text style={styles.statLabel}>Expiradas</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#8B5CF6' + '15' }]}>
            <Ionicons name="phone-portrait" size={24} color="#8B5CF6" />
            <Text style={styles.statNumber}>{totalDevices}</Text>
            <Text style={styles.statLabel}>Dispositivos</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Licencias Recientes</Text>
          {licenses.slice(0, 5).map(lic => {
            const isExpired = lic.trial_ends_at && new Date(lic.trial_ends_at) < new Date();
            const badgeStyle = !lic.active
              ? styles.badgeInactive
              : isExpired
                ? styles.badgeExpired
                : styles.badgeActive;
            const badgeLabel = !lic.active
              ? 'Inactiva'
              : isExpired
                ? 'Expirada'
                : 'Activa';
            return (
              <View key={lic.id} style={styles.listItem}>
                <View style={styles.listItemLeft}>
                  <Ionicons name="business" size={18} color={COLORS.primary} />
                  <View>
                    <Text style={styles.listItemTitle}>{lic.complex_name}</Text>
                    <Text style={styles.listItemSub}>{lic.license_key}</Text>
                  </View>
                </View>
                <View style={[styles.badge, badgeStyle]}>
                  <Text style={styles.badgeText}>{badgeLabel}</Text>
                </View>
              </View>
            );
          })}
          {licenses.length === 0 && (
            <Text style={styles.emptyText}>Sin licencias registradas</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dispositivos Recientes</Text>
          {devices.slice(0, 5).map(dev => (
            <View key={dev.id} style={styles.listItem}>
              <View style={styles.listItemLeft}>
                <Ionicons name="phone-portrait" size={18} color={COLORS.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.listItemTitle}>{dev.device_name || 'Desconocido'}</Text>
                  {dev.complex_name && (
                    <Text style={styles.listItemComplex}>{dev.complex_name}</Text>
                  )}
                  <Text style={styles.listItemSub}>ID: {dev.device_id.substring(0, 12)}...</Text>
                </View>
              </View>
              <Text style={styles.listItemDate}>{new Date(dev.registered_at).toLocaleDateString('es-ES')}</Text>
            </View>
          ))}
          {devices.length === 0 && (
            <Text style={styles.emptyText}>Sin dispositivos registrados</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  greeting: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  logoutBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.danger + '15', justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingBottom: 100 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { width: '47%', borderRadius: 16, padding: 16, alignItems: 'center', gap: 6 },
  statNumber: { fontSize: 28, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textSecondary },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 8 },
  listItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  listItemTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  listItemComplex: { fontSize: 12, fontWeight: '600', color: COLORS.primary, marginTop: 1 },
  listItemSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  listItemDate: { fontSize: 11, color: COLORS.textSecondary },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeActive: { backgroundColor: '#10B98120' },
  badgeInactive: { backgroundColor: COLORS.danger + '20' },
  badgeExpired: { backgroundColor: COLORS.warning + '20' },
  badgeText: { fontSize: 11, fontWeight: '600', color: COLORS.text },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 20, fontSize: 13 },
});
