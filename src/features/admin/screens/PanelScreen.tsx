import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../../constants';
import { licenseRepository } from '../../../lib/repositories/license.repository';
import { useAdminLogout } from '../../../hooks/useAdmin';

export default function PanelScreen({ navigation }: any) {
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
    Alert.alert('Cerrar sesion', 'Salir del panel de administracion?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const activeLicenses = licenses.filter((l) => l.active).length;
  const expiredLicenses = licenses.filter(
    (l) => l.active && l.trial_ends_at && new Date(l.trial_ends_at) < new Date(),
  ).length;
  const totalDevices = devices.length;

  const stats = [
    {
      label: 'Licencias',
      value: licenses.length,
      icon: 'key' as const,
      color: COLORS.primary,
      glow: COLORS.primaryGlow,
    },
    {
      label: 'Activas',
      value: activeLicenses,
      icon: 'checkmark-circle' as const,
      color: COLORS.success,
      glow: COLORS.successGlow,
    },
    {
      label: 'Expiradas',
      value: expiredLicenses,
      icon: 'time' as const,
      color: COLORS.warning,
      glow: COLORS.warningGlow,
    },
    {
      label: 'Dispositivos',
      value: totalDevices,
      icon: 'phone-portrait' as const,
      color: '#A78BFA',
      glow: 'rgba(167, 139, 250, 0.15)',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Panel de Control</Text>
          <Text style={styles.subtitle}>Gestion administrativa</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: stat.glow }]}>
              <View style={[styles.statIconContainer, { backgroundColor: stat.color + '25' }]}>
                <Ionicons name={stat.icon} size={20} color={stat.color} />
              </View>
              <Text style={[styles.statNumber, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.navCard}
          onPress={() => navigation?.navigate?.('Licenses')}
          activeOpacity={0.7}
        >
          <View style={[styles.navIconContainer, { backgroundColor: COLORS.primaryGlow }]}>
            <Ionicons name="key" size={22} color={COLORS.primary} />
          </View>
          <View style={styles.navInfo}>
            <Text style={styles.navTitle}>Licencias</Text>
            <Text style={styles.navSubtitle}>Gestionar licencias y suscripciones</Text>
          </View>
          <View style={styles.navArrow}>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navCard}
          onPress={() => navigation?.navigate?.('Devices')}
          activeOpacity={0.7}
        >
          <View style={[styles.navIconContainer, { backgroundColor: 'rgba(167, 139, 250, 0.15)' }]}>
            <Ionicons name="phone-portrait" size={22} color="#A78BFA" />
          </View>
          <View style={styles.navInfo}>
            <Text style={styles.navTitle}>Dispositivos</Text>
            <Text style={styles.navSubtitle}>Administrar dispositivos registrados</Text>
          </View>
          <View style={styles.navArrow}>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Licencias Recientes</Text>
            <TouchableOpacity
              onPress={() => navigation?.navigate?.('Licenses')}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionLink}>Ver todo</Text>
            </TouchableOpacity>
          </View>
          {licenses.slice(0, 5).map((lic) => {
            const isExpired = lic.trial_ends_at && new Date(lic.trial_ends_at) < new Date();
            const isActive = lic.active && !isExpired;
            const isInactive = !lic.active;

            return (
              <View key={lic.id} style={styles.listItem}>
                <View style={styles.listItemLeft}>
                  <View
                    style={[
                      styles.listItemIcon,
                      {
                        backgroundColor: isActive
                          ? COLORS.successGlow
                          : isExpired
                            ? COLORS.warningGlow
                            : COLORS.dangerGlow,
                      },
                    ]}
                  >
                    <Ionicons
                      name="business"
                      size={16}
                      color={isActive ? COLORS.success : isExpired ? COLORS.warning : COLORS.danger}
                    />
                  </View>
                  <View style={styles.listItemInfo}>
                    <Text style={styles.listItemTitle}>{lic.complex_name}</Text>
                    <Text style={styles.listItemSub}>{lic.license_key}</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: isActive
                        ? COLORS.successGlow
                        : isExpired
                          ? COLORS.warningGlow
                          : COLORS.dangerGlow,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color: isActive ? COLORS.success : isExpired ? COLORS.warning : COLORS.danger,
                      },
                    ]}
                  >
                    {isExpired ? 'Expirada' : isActive ? 'Activa' : 'Inactiva'}
                  </Text>
                </View>
              </View>
            );
          })}
          {licenses.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Sin licencias registradas</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dispositivos Recientes</Text>
            <TouchableOpacity
              onPress={() => navigation?.navigate?.('Devices')}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionLink}>Ver todo</Text>
            </TouchableOpacity>
          </View>
          {devices.slice(0, 5).map((dev) => (
            <View key={dev.id} style={styles.listItem}>
              <View style={styles.listItemLeft}>
                <View
                  style={[
                    styles.listItemIcon,
                    {
                      backgroundColor: dev.active ? COLORS.successGlow : COLORS.dangerGlow,
                    },
                  ]}
                >
                  <Ionicons
                    name="phone-portrait"
                    size={16}
                    color={dev.active ? COLORS.success : COLORS.danger}
                  />
                </View>
                <View style={styles.listItemInfo}>
                  <Text style={styles.listItemTitle}>{dev.device_name || 'Desconocido'}</Text>
                  {dev.complex_name && (
                    <Text style={styles.listItemComplex}>{dev.complex_name}</Text>
                  )}
                  <Text style={styles.listItemSub}>ID: {dev.device_id.substring(0, 12)}...</Text>
                </View>
              </View>
              <Text style={styles.listItemDate}>
                {new Date(dev.registered_at).toLocaleDateString('es-ES')}
              </Text>
            </View>
          ))}
          {devices.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Sin dispositivos registrados</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  greeting: {
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
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.dangerGlow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.danger + '30',
  },

  scroll: {
    padding: SPACING.xl,
    paddingBottom: 100,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  statCard: {
    width: '47%',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    gap: SPACING.lg,
  },
  navIconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navInfo: {
    flex: 1,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  navSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  navArrow: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },

  section: {
    marginBottom: SPACING.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },

  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  listItemIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItemInfo: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  listItemComplex: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 1,
  },
  listItemSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  listItemDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
});
