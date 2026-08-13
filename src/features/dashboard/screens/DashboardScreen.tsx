import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../../constants';
import { CollapsibleCard } from '../components/CollapsibleCard';
import { StatsCard } from '../components/StatsCard';
import { ViolationsCard } from '../components/ViolationsCard';
import { OccupancyCard } from '../components/OccupancyCard';
import { ParkingAlertsCard } from '../components/ParkingAlertsCard';
import { RestrictedVehiclesCard } from '../components/RestrictedVehiclesCard';
import { RecentActivity } from '../components/RecentActivity';
import { useDashboard } from '../hooks/useDashboard';
import { useLicense } from '../../../hooks/useLicense';
import { useDashboardLayout, SectionId } from '../../../hooks/useDashboardLayout';
import { useRealtime } from '../../../hooks/useRealtime';
import { LoadingState, ErrorState } from '../../../components/EmptyState';
import { Vehicle } from '../../../types';

export const DashboardScreen: React.FC = () => {
  const router = useRouter();
  const {
    stats,
    violations,
    recentVehicles,
    occupancyStats,
    parkingAlerts,
    restrictedVehicles,
    accessLogs,
    loading,
    error,
    refresh,
  } = useDashboard();
  const { license, logout } = useLicense();
  const { loaded, toggleCollapse, togglePin, isCollapsed, isPinned, sortSections } =
    useDashboardLayout();
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  useRealtime(['vehicles', 'access_logs', 'visitors'], () => {
    refresh();
  });

  const recentVehiclesList = useMemo(
    () =>
      accessLogs
        .slice(0, 20)
        .map((log) => log.vehicle)
        .filter((v): v is Vehicle => !!v)
        .filter(
          (vehicle, index, self) =>
            index === self.findIndex((v) => v.id === vehicle.id)
        )
        .slice(0, 5),
    [accessLogs]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    refresh();
    setRefreshing(false);
  };

  const handleVehiclePress = (vehicle: Vehicle) => {
    router.push(`/vehicle/${vehicle.id}`);
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar licencia',
      '¿Quitar la licencia de este dispositivo? La app volverá a pedir el código de activación.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar licencia',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  const availableSections = useMemo(() => {
    const sections: { id: SectionId; visible: boolean }[] = [
      { id: 'stats', visible: true },
      { id: 'parking-alerts', visible: parkingAlerts.length > 0 },
      { id: 'violations', visible: violations.length > 0 },
      { id: 'restricted', visible: restrictedVehicles.length > 0 },
      { id: 'occupancy', visible: true },
      { id: 'recent', visible: true },
    ];
    return sections.filter((s) => s.visible).map((s) => s.id);
  }, [parkingAlerts, violations, restrictedVehicles]);

  const sortedSections = useMemo(
    () => sortSections(availableSections),
    [availableSections, sortSections]
  );

  const SECTION_LABELS: Record<SectionId, string> = {
    stats: 'Resumen',
    'parking-alerts': 'Alertas de Parqueo',
    violations: 'Infracciones',
    restricted: 'Vehículos Restringidos',
    occupancy: 'Ocupación por Torre',
    recent: 'Actividad Reciente',
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.92],
    extrapolate: 'clamp',
  });

  if (loading && !stats) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <LoadingState message="Cargando dashboard..." />
      </SafeAreaView>
    );
  }

  if (error && !stats) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <ErrorState message={error} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  const renderSection = (sectionId: SectionId) => {
    switch (sectionId) {
      case 'stats':
        return <StatsCard stats={stats} />;
      case 'parking-alerts':
        return <ParkingAlertsCard alerts={parkingAlerts} />;
      case 'violations':
        return <ViolationsCard violations={violations} />;
      case 'restricted':
        return (
          <RestrictedVehiclesCard
            vehicles={restrictedVehicles}
            onPress={handleVehiclePress}
          />
        );
      case 'occupancy':
        return <OccupancyCard occupancyStats={occupancyStats} />;
      case 'recent':
        return (
          <RecentActivity
            vehicles={
              recentVehiclesList.length > 0 ? recentVehiclesList : recentVehicles
            }
            onPress={handleVehiclePress}
          />
        );
      default:
        return null;
    }
  };

  const totalVehicles = stats?.total_vehicles || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <View style={styles.headerBackdrop} />
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.logoMark}>
              <Ionicons name="car-sport" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.headerTextGroup}>
              <Text style={styles.headerTitle}>Control de Vehículos</Text>
              <Text style={styles.headerSubtitle}>
                {license?.complex_name || 'Villas del Encanto 1'}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.vehicleBadge}>
              <View style={styles.vehicleBadgeGlow} />
              <Text style={styles.vehicleBadgeCount}>{totalVehicles}</Text>
              <Text style={styles.vehicleBadgeLabel}>vehículos</Text>
            </View>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Ionicons
                name="log-out-outline"
                size={16}
                color={COLORS.danger}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
            progressBackgroundColor={COLORS.surfaceElevated}
          />
        }
      >
        {sortedSections.map((sectionId) => (
          <CollapsibleCard
            key={sectionId}
            title={SECTION_LABELS[sectionId]}
            collapsed={isCollapsed(sectionId)}
            pinned={isPinned(sectionId)}
            onToggleCollapse={() => toggleCollapse(sectionId)}
            onTogglePin={() => togglePin(sectionId)}
          >
            {renderSection(sectionId)}
          </CollapsibleCard>
        ))}

        <View style={styles.footerSpacer} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ─── Header ──────────────────────────────────────────
  header: {
    position: 'relative',
    zIndex: 10,
  },
  headerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.glass,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? SPACING.sm : SPACING.md,
    paddingBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  logoMark: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryGlow,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  vehicleBadge: {
    alignItems: 'center',
    backgroundColor: COLORS.primaryGlow,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    overflow: 'hidden',
  },
  vehicleBadgeGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.primary,
    opacity: 0.06,
  },
  vehicleBadgeCount: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
    lineHeight: 22,
  },
  vehicleBadgeLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  logoutBtn: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.dangerGlow,
    borderWidth: 1,
    borderColor: COLORS.danger + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Content ─────────────────────────────────────────
  content: {
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  footerSpacer: {
    height: SPACING.xxxl,
  },
});
