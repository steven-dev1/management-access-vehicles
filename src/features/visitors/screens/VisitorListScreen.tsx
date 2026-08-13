import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../../constants';
import { visitorRepository } from '../../../lib/repositories/visitor.repository';
import { parseTimestamp } from '../../../utils';
import { Visitor, VisitorStatus } from '../../../types';
import { useRealtimeVisitors } from '../../../hooks/useRealtime';

const STATUS_COLORS: Record<VisitorStatus, string> = {
  expected: COLORS.warning,
  active: COLORS.success,
  completed: COLORS.textMuted,
  expired: COLORS.danger,
};

const STATUS_LABELS: Record<VisitorStatus, string> = {
  expected: 'En espera',
  active: 'Activo',
  completed: 'Completado',
  expired: 'Expirado',
};

const FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Activos' },
  { key: 'expected', label: 'En espera' },
  { key: 'completed', label: 'Completados' },
  { key: 'expired', label: 'Expirados' },
];

export const VisitorListScreen: React.FC = () => {
  const router = useRouter();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [filteredVisitors, setFilteredVisitors] = useState<Visitor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadVisitors = useCallback(async () => {
    try {
      setLoading(true);
      const data = await visitorRepository.getAll();
      setVisitors(data);
      applyFilters(data, searchQuery, activeFilter);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los visitantes');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeFilter]);

  useRealtimeVisitors(() => { loadVisitors(); });

  const applyFilters = (data: Visitor[], query: string, filter: string) => {
    let result = data;
    if (filter !== 'all') {
      result = result.filter((v) => v.status === filter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (v) =>
          v.visitor_plate.toLowerCase().includes(q) ||
          v.visitor_name.toLowerCase().includes(q)
      );
    }
    setFilteredVisitors(result);
  };

  useFocusEffect(
    useCallback(() => {
      loadVisitors();
    }, [loadVisitors])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVisitors();
    setRefreshing(false);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    applyFilters(visitors, text, activeFilter);
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    applyFilters(visitors, searchQuery, filter);
  };

  const handleCheckIn = async (visitor: Visitor) => {
    try {
      await visitorRepository.checkIn(visitor.id);
      loadVisitors();
    } catch {
      Alert.alert('Error', 'No se pudo realizar el check-in');
    }
  };

  const handleCheckOut = async (visitor: Visitor) => {
    try {
      await visitorRepository.checkOut(visitor.id);
      loadVisitors();
    } catch {
      Alert.alert('Error', 'No se pudo realizar el check-out');
    }
  };

  const handleDelete = (visitor: Visitor) => {
    Alert.alert(
      'Eliminar visitante',
      `¿Estás seguro de eliminar a ${visitor.visitor_name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await visitorRepository.delete(visitor.id);
              loadVisitors();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el visitante');
            }
          },
        },
      ]
    );
  };

  const formatTime = (ts: string | null): string => {
    if (!ts) return '';
    return parseTimestamp(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const renderVisitorCard = ({ item }: { item: Visitor }) => {
    const statusColor = STATUS_COLORS[item.status];

    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
        ]}
      >
        <View style={styles.cardInner}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardLeftSection}>
              <View style={styles.plateContainer}>
                <Ionicons name="car-outline" size={14} color={COLORS.primary} />
                <Text style={styles.plate}>{item.visitor_plate}</Text>
              </View>
              <Text style={styles.visitorName} numberOfLines={1}>
                {item.visitor_name}
              </Text>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: statusColor + '18', borderColor: statusColor + '30' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {STATUS_LABELS[item.status]}
              </Text>
            </View>
          </View>

          <View style={styles.cardDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="business-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.detailText}>Torre {item.host_tower} - {item.host_apartment_code}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.detailText} numberOfLines={1}>{item.host_owner_name}</Text>
            </View>
            {item.purpose ? (
              <View style={styles.detailRow}>
                <Ionicons name="document-text-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.detailText} numberOfLines={1}>{item.purpose}</Text>
              </View>
            ) : null}
            <View style={styles.timeRow}>
              {item.entry_time ? (
                <View style={styles.timeChip}>
                  <Ionicons name="enter-outline" size={12} color={COLORS.success} />
                  <Text style={[styles.timeText, { color: COLORS.success }]}>{formatTime(item.entry_time)}</Text>
                </View>
              ) : null}
              {item.exit_time ? (
                <View style={styles.timeChip}>
                  <Ionicons name="exit-outline" size={12} color={COLORS.warning} />
                  <Text style={[styles.timeText, { color: COLORS.warning }]}>{formatTime(item.exit_time)}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.cardActions}>
            {item.status === 'expected' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.actionCheckIn]}
                activeOpacity={0.7}
                onPress={() => handleCheckIn(item)}
              >
                <Ionicons name="checkmark-circle" size={15} color={COLORS.success} />
                <Text style={[styles.actionText, { color: COLORS.success }]}>Check-in</Text>
              </TouchableOpacity>
            )}
            {item.status === 'active' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.actionCheckOut]}
                activeOpacity={0.7}
                onPress={() => handleCheckOut(item)}
              >
                <Ionicons name="log-out-outline" size={15} color={COLORS.warning} />
                <Text style={[styles.actionText, { color: COLORS.warning }]}>Check-out</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionButton, styles.actionDelete]}
              activeOpacity={0.7}
              onPress={() => handleDelete(item)}
            >
              <Ionicons name="trash-outline" size={15} color={COLORS.danger} />
              <Text style={[styles.actionText, { color: COLORS.danger }]}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Visitantes</Text>
          <Text style={styles.headerCount}>{filteredVisitors.length}</Text>
        </View>
        <TouchableOpacity
          style={styles.headerAction}
          activeOpacity={0.7}
          onPress={() => router.push('/visitor-form')}
        >
          <Ionicons name="person-add" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por placa o nombre..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="characters"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterTab,
                activeFilter === item.key && styles.filterTabActive,
              ]}
              activeOpacity={0.7}
              onPress={() => handleFilterChange(item.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === item.key && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filteredVisitors}
        keyExtractor={(item) => item.id}
        renderItem={renderVisitorCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="people-outline" size={44} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No hay visitantes</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'No se encontraron resultados'
                  : 'Agrega un visitante tocando el botón "+"'}
              </Text>
            </View>
          ) : null
        }
      />

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => router.push('/visitor-form')}
      >
        <Ionicons name="add" size={26} color={COLORS.textInverse} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  headerCount: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: SPACING.md,
    height: 42,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 0,
  },

  // Filters
  filterContainer: {
    paddingBottom: SPACING.sm,
  },
  filterScroll: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  filterTab: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.text,
  },

  // List
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
    paddingBottom: 100,
  },

  // Card
  card: {
    marginBottom: SPACING.md,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardInner: {
    padding: SPACING.lg,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  cardLeftSection: {
    flex: 1,
    marginRight: SPACING.md,
  },
  plateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  plate: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1.2,
  },
  visitorName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Details
  cardDetails: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Card Actions
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.md,
    gap: SPACING.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
  },
  actionCheckIn: {
    backgroundColor: COLORS.successGlow,
  },
  actionCheckOut: {
    backgroundColor: COLORS.warningGlow,
  },
  actionDelete: {
    backgroundColor: COLORS.dangerGlow,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.xxl,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 240,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glow(COLORS.primary),
  },
});
