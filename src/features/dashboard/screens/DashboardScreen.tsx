import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../../constants';
import { StatsCard } from '../components/StatsCard';
import { ViolationsCard } from '../components/ViolationsCard';
import { OccupancyCard } from '../components/OccupancyCard';
import { ParkingAlertsCard } from '../components/ParkingAlertsCard';
import { RestrictedVehiclesCard } from '../components/RestrictedVehiclesCard';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { ActivityHeatmap } from '../components/ActivityHeatmap';
import { WeeklyPatterns } from '../components/WeeklyPatterns';
import { RecentActivity } from '../components/RecentActivity';
import { useDashboard } from '../hooks/useDashboard';
import { useLicense } from '../../../hooks/useLicense';
import { LoadingState, ErrorState } from '../../../components/EmptyState';
import { FadeInView } from '../../../components/FadeInView';
import { Vehicle, AccessLog } from '../../../types';
import { parseTimestamp } from '../../../utils';

export const DashboardScreen: React.FC = () => {
  const router = useRouter();
  const { stats, violations, recentVehicles, occupancyStats, parkingAlerts, restrictedVehicles, accessLogs, loading, error, refresh } = useDashboard();
  const { license, logout } = useLicense();
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('all');

  const filterLogsByRange = (logs: AccessLog[], range: string): AccessLog[] => {
    if (range === 'all') return logs;
    const now = new Date();
    let cutoff: Date;
    switch (range) {
      case 'today':
        cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        cutoff = new Date(now);
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff = new Date(now);
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        cutoff = new Date(now);
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return logs;
    }
    return logs.filter(log => {
      const ts = parseTimestamp(log.timestamp);
      return ts >= cutoff;
    });
  };

  const filteredLogs = filterLogsByRange(accessLogs, dateRange);
  const filteredRecentVehicles = (
    filterLogsByRange(accessLogs.slice(0, 20), dateRange)
      .map(log => log.vehicle)
      .filter((v): v is Vehicle => !!v)
      .filter((vehicle, index, self) =>
        index === self.findIndex(v => v.id === vehicle.id)
      )
      .slice(0, 5)
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

  if (loading && !stats) {
    return <LoadingState message="Cargando dashboard..." />;
  }

  if (error && !stats) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoIcon}>
            <Ionicons name="car-sport" size={20} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Control de Vehículos</Text>
            <Text style={styles.headerSubtitle}>{license?.complex_name || 'Villas del Encanto 1'}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeText}>{stats?.total_vehicles || 0}</Text>
            <Text style={styles.totalBadgeLabel}>vehículos</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        <DateRangeFilter selected={dateRange} onSelect={setDateRange} />
        <StatsCard stats={stats} />
        {parkingAlerts.length > 0 && <ParkingAlertsCard alerts={parkingAlerts} />}
        {violations.length > 0 && <ViolationsCard violations={violations} />}
        {restrictedVehicles.length > 0 && <RestrictedVehiclesCard vehicles={restrictedVehicles} onPress={handleVehiclePress} />}
        <OccupancyCard occupancyStats={occupancyStats} />
        {filteredLogs.length > 0 && (
          <>
            <FadeInView delay={100}>
              <ActivityHeatmap logs={filteredLogs} />
            </FadeInView>
            <FadeInView delay={200}>
              <WeeklyPatterns logs={filteredLogs} />
            </FadeInView>
          </>
        )}
        <RecentActivity vehicles={filteredRecentVehicles.length > 0 ? filteredRecentVehicles : recentVehicles} onPress={handleVehiclePress} />
      </ScrollView>
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.danger + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalBadge: {
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  totalBadgeText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  totalBadgeLabel: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '500',
  },
  content: {
    paddingBottom: 32,
  },
});
