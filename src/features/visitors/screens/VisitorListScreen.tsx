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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { COLORS } from '../../../constants';
import { visitorRepository } from '../../../lib/repositories/visitor.repository';
import { parseTimestamp } from '../../../utils';
import { Visitor, VisitorStatus } from '../../../types';

const STATUS_COLORS: Record<VisitorStatus, string> = {
  expected: '#F59E0B',
  active: '#10B981',
  completed: '#6B7280',
  expired: '#EF4444',
};

const STATUS_LABELS: Record<VisitorStatus, string> = {
  expected: 'Espera',
  active: 'Activo',
  completed: 'Completado',
  expired: 'Expirado',
};

const FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Activos' },
  { key: 'expected', label: 'Espera' },
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

  const renderVisitorCard = ({ item }: { item: Visitor }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.plateContainer}>
          <Ionicons name="car-outline" size={16} color={COLORS.primary} />
          <Text style={styles.plate}>{item.visitor_plate}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
            {STATUS_LABELS[item.status]}
          </Text>
        </View>
      </View>

      <Text style={styles.visitorName}>{item.visitor_name}</Text>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="business-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.detailText}>Torre {item.host_tower} - {item.host_apartment_code}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.detailText}>{item.host_owner_name}</Text>
        </View>
        {item.purpose ? (
          <View style={styles.detailRow}>
            <Ionicons name="document-text-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{item.purpose}</Text>
          </View>
        ) : null}
        {item.entry_time ? (
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>Entrada: {formatTime(item.entry_time)}</Text>
          </View>
        ) : null}
        {item.exit_time ? (
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>Salida: {formatTime(item.exit_time)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardActions}>
        {item.status === 'expected' && (
          <TouchableOpacity style={styles.actionButton} onPress={() => handleCheckIn(item)}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
            <Text style={[styles.actionText, { color: '#10B981' }]}>Check-in</Text>
          </TouchableOpacity>
        )}
        {item.status === 'active' && (
          <TouchableOpacity style={styles.actionButton} onPress={() => handleCheckOut(item)}>
            <Ionicons name="log-out-outline" size={18} color="#F59E0B" />
            <Text style={[styles.actionText, { color: '#F59E0B' }]}>Check-out</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item)}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
          <Text style={[styles.actionText, { color: '#EF4444' }]}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>Visitantes</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/visitor-form')}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por placa o nombre..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="characters"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        style={styles.filterContainer}
        horizontal
        showsHorizontalScrollIndicator={false}
        data={FILTERS}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === item.key && styles.filterTabActive]}
            onPress={() => handleFilterChange(item.key)}
          >
            <Text style={[styles.filterText, activeFilter === item.key && styles.filterTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filteredVisitors}
        keyExtractor={(item) => item.id}
        renderItem={renderVisitorCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={COLORS.textSecondary} />
              <Text style={styles.emptyTitle}>No hay visitantes</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'No se encontraron resultados' : 'Agrega un visitante tocando "+"'}
              </Text>
            </View>
          ) : null
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/visitor-form')}>
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  addButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 12, marginBottom: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: COLORS.surface, borderRadius: 12,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: COLORS.text },
  filterContainer: { paddingHorizontal: 16, paddingBottom: 8, maxHeight: 48 },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 7, marginRight: 8,
    borderRadius: 20, backgroundColor: COLORS.surface,
  },
  filterTabActive: { backgroundColor: COLORS.primary },
  filterText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  filterTextActive: { color: '#FFF' },
  listContent: { padding: 16, paddingBottom: 80 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 12,
    padding: 14, marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
  },
  plateContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  plate: { fontSize: 15, fontWeight: '700', color: COLORS.primary, letterSpacing: 1 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, gap: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  visitorName: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  cardDetails: { gap: 4, marginBottom: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: COLORS.textSecondary },
  cardActions: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingTop: 10, gap: 16,
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 12, fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: COLORS.text },
  emptySubtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', maxWidth: 260 },
  fab: {
    position: 'absolute', right: 20, bottom: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
});
