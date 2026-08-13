import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  COLORS,
  TOWERS,
  SPACING,
  RADIUS,
  SHADOWS,
  generateAllApartments,
  getVehicleTypeColor,
} from '../../../constants';
import { useVehicles } from '../hooks/useVehicles';
import { useSearchHistory } from '../../../hooks/useSearchHistory';
import { LoadingState, EmptyState, ErrorState } from '../../../components/EmptyState';
import { VehicleCardSkeleton } from '../../../components/SkeletonLoader';
import { Vehicle, FilterOptions, SortOption, VehicleType } from '../../../types';

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Más recientes', value: 'newest' },
  { label: 'Más antiguos', value: 'oldest' },
  { label: 'Placa A-Z', value: 'plate_asc' },
  { label: 'Placa Z-A', value: 'plate_desc' },
  { label: 'Torre ↑', value: 'tower_asc' },
  { label: 'Torre ↓', value: 'tower_desc' },
];

const VEHICLE_TYPE_ICONS: Record<string, string> = {
  car: 'car',
  motorcycle: 'bicycle',
};

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  car: 'Carro',
  motorcycle: 'Moto',
};

export const VehicleListScreen: React.FC = () => {
  const router = useRouter();
  const {
    vehicles,
    filters,
    sort,
    loading,
    error,
    hasMore,
    refresh,
    loadMore,
    handleFilter,
    handleClearFilters,
    handleSort,
    handleDelete,
  } = useVehicles();

  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [tempFilters, setTempFilters] = useState<FilterOptions>(filters);
  const [showRecent, setShowRecent] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { recentSearches, addSearch, removeSearch, clearHistory } = useSearchHistory();

  const apartments = generateAllApartments();
  const searchRef = useRef<TextInput>(null);

  const filteredApartments = tempFilters.tower
    ? apartments.filter((a) => a.tower === tempFilters.tower)
    : apartments;

  const displayedVehicles = useMemo(() => {
    if (!search) return vehicles;
    const q = search.toLowerCase();
    return vehicles.filter(
      (v) =>
        v.license_plate.toLowerCase().includes(q) ||
        v.owner_name.toLowerCase().includes(q)
    );
  }, [vehicles, search]);

  const handleSearch = useCallback((text: string) => {
    setSearch(text);
    if (!text) setShowRecent(false);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    if (search.trim()) {
      addSearch(search.trim());
      setShowRecent(false);
    }
  }, [search, addSearch]);

  const handleClearSearch = useCallback(() => {
    setSearch('');
    setTimeout(() => searchRef.current?.focus(), 50);
  }, []);

  const applyFilters = () => {
    handleFilter(tempFilters);
    setShowFilters(false);
  };

  const clearAllFilters = () => {
    setTempFilters({});
    handleClearFilters();
    setSearch('');
    setShowFilters(false);
  };

  const handleVehiclePress = (vehicle: Vehicle) => {
    router.push(`/vehicle/${vehicle.id}`);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const renderVehicleCard = ({ item }: { item: Vehicle }) => {
    const typeColor = getVehicleTypeColor(item.vehicle_type);
    const isMotorcycle = item.vehicle_type === 'motorcycle';

    return (
      <Pressable
        style={({ pressed }) => [
          styles.vehicleCard,
          pressed && styles.vehicleCardPressed,
        ]}
        onPress={() => handleVehiclePress(item)}
      >
        <View style={styles.vehicleCardInner}>
          <View style={styles.vehicleCardHeader}>
            <View style={[styles.vehicleTypeBadge, { backgroundColor: typeColor + '20' }]}>
              <Ionicons
                name={isMotorcycle ? 'bicycle' : 'car' as any}
                size={14}
                color={typeColor}
              />
              <Text style={[styles.vehicleTypeLabel, { color: typeColor }]}>
                {VEHICLE_TYPE_LABELS[item.vehicle_type] || item.vehicle_type}
              </Text>
            </View>
          </View>

          <View style={styles.vehiclePlateContainer}>
            <Text style={styles.vehiclePlate}>{item.license_plate}</Text>
          </View>

          <View style={styles.vehicleInfo}>
            <Ionicons name="person-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.vehicleOwner} numberOfLines={1}>
              {item.owner_name}
            </Text>
          </View>

          <View style={styles.vehicleLocation}>
            <Ionicons name="business-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.vehicleLocationText}>
              T{item.tower} · {item.apartment_code}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  if (loading && !vehicles.length) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Vehículos</Text>
          </View>
        </View>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={COLORS.textMuted} />
            <View style={styles.searchPlaceholder} />
          </View>
        </View>
        <View style={styles.gridRow}>
          <VehicleCardSkeleton />
          <VehicleCardSkeleton />
          <VehicleCardSkeleton />
          <VehicleCardSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !vehicles.length) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Vehículos</Text>
          <Text style={styles.headerCount}>{displayedVehicles.length}</Text>
        </View>
        <TouchableOpacity style={styles.headerAction} onPress={() => router.push('/vehicle/create')}>
          <Ionicons name="add-circle" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            ref={searchRef}
            style={styles.searchInput}
            placeholder="Buscar placa o propietario..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={handleSearch}
            onFocus={() => { if (recentSearches.length > 0) setShowRecent(true); }}
            onBlur={() => setTimeout(() => setShowRecent(false), 200)}
            onSubmitEditing={handleSearchSubmit}
            blurOnSubmit={false}
          />
          {search ? (
            <TouchableOpacity onPress={handleClearSearch}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={[
            styles.iconButton,
            Object.keys(filters).length > 0 && styles.iconButtonActive,
          ]}
          onPress={() => {
            setTempFilters(filters);
            setShowFilters(true);
          }}
        >
          <Ionicons
            name="filter"
            size={18}
            color={Object.keys(filters).length > 0 ? COLORS.primary : COLORS.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={() => setShowSort(true)}>
          <Ionicons name="swap-vertical" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {showRecent && recentSearches.length > 0 && !search && (
        <View style={styles.recentDropdown}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Búsquedas recientes</Text>
            <TouchableOpacity onPress={clearHistory}>
              <Text style={styles.recentClear}>Limpiar</Text>
            </TouchableOpacity>
          </View>
          {recentSearches.map((term, i) => (
            <TouchableOpacity
              key={i}
              style={styles.recentItem}
              onPress={() => { setSearch(term); setShowRecent(false); }}
            >
              <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.recentItemText}>{term}</Text>
              <TouchableOpacity onPress={() => removeSearch(term)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={12} color={COLORS.textMuted} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {Object.keys(filters).length > 0 && (
        <View style={styles.activeFilters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsContainer}>
            {filters.tower && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>Torre {filters.tower}</Text>
                <TouchableOpacity onPress={() => handleFilter({ ...filters, tower: undefined })}>
                  <Ionicons name="close-circle" size={14} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            )}
            {filters.apartment && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>Apt {filters.apartment}</Text>
                <TouchableOpacity onPress={() => handleFilter({ ...filters, apartment: undefined })}>
                  <Ionicons name="close-circle" size={14} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            )}
            {filters.vehicle_type && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>{filters.vehicle_type === 'car' ? 'Carro' : 'Moto'}</Text>
                <TouchableOpacity onPress={() => handleFilter({ ...filters, vehicle_type: undefined })}>
                  <Ionicons name="close-circle" size={14} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity style={styles.clearAllChip} onPress={clearAllFilters}>
              <Text style={styles.clearAllText}>Limpiar todo</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      <FlatList
        data={displayedVehicles}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        renderItem={renderVehicleCard}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="car-sport-outline" size={48} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No se encontraron vehículos</Text>
            <Text style={styles.emptySubtitle}>Agrega vehículos o cambia los filtros</Text>
            <TouchableOpacity style={styles.emptyAction} onPress={clearAllFilters}>
              <Text style={styles.emptyActionText}>Limpiar filtros</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          loading && vehicles.length > 0 ? (
            <ActivityIndicator style={{ padding: SPACING.lg }} color={COLORS.primary} />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
      />

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => router.push('/vehicle/create')}
      >
        <Ionicons name="add" size={26} color={COLORS.textInverse} />
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal visible={showFilters} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFilters(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>Torre</Text>
              <View style={styles.optionsGrid}>
                {TOWERS.map((tower) => (
                  <TouchableOpacity
                    key={tower}
                    style={[
                      styles.optionButton,
                      tempFilters.tower === tower && styles.optionButtonActive,
                    ]}
                    onPress={() =>
                      setTempFilters({
                        ...tempFilters,
                        tower: tempFilters.tower === tower ? undefined : tower,
                        apartment: undefined,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.optionText,
                        tempFilters.tower === tower && styles.optionTextActive,
                      ]}
                    >
                      T{tower}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {tempFilters.tower && (
                <>
                  <Text style={[styles.sectionTitle, { marginTop: SPACING.xl }]}>Apartamento</Text>
                  <View style={styles.optionsGrid}>
                    {filteredApartments.map((apt) => (
                      <TouchableOpacity
                        key={apt.code}
                        style={[
                          styles.optionButton,
                          tempFilters.apartment === apt.code && styles.optionButtonActive,
                        ]}
                        onPress={() =>
                          setTempFilters({
                            ...tempFilters,
                            apartment: tempFilters.apartment === apt.code ? undefined : apt.code,
                          })
                        }
                      >
                        <Text
                          style={[
                            styles.optionText,
                            tempFilters.apartment === apt.code && styles.optionTextActive,
                          ]}
                        >
                          {apt.code}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <Text style={[styles.sectionTitle, { marginTop: SPACING.xl }]}>Tipo de vehículo</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    tempFilters.vehicle_type === 'car' && styles.typeButtonActive,
                  ]}
                  onPress={() =>
                    setTempFilters({
                      ...tempFilters,
                      vehicle_type: tempFilters.vehicle_type === 'car' ? undefined : 'car',
                    })
                  }
                >
                  <Ionicons
                    name="car"
                    size={20}
                    color={tempFilters.vehicle_type === 'car' ? COLORS.text : COLORS.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeText,
                      tempFilters.vehicle_type === 'car' && styles.typeTextActive,
                    ]}
                  >
                    Carro
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    tempFilters.vehicle_type === 'motorcycle' && styles.typeButtonActive,
                  ]}
                  onPress={() =>
                    setTempFilters({
                      ...tempFilters,
                      vehicle_type: tempFilters.vehicle_type === 'motorcycle' ? undefined : 'motorcycle',
                    })
                  }
                >
                  <Ionicons
                    name="bicycle"
                    size={20}
                    color={tempFilters.vehicle_type === 'motorcycle' ? COLORS.text : COLORS.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeText,
                      tempFilters.vehicle_type === 'motorcycle' && styles.typeTextActive,
                    ]}
                  >
                    Moto
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.resetButton} onPress={clearAllFilters}>
                <Text style={styles.resetButtonText}>Resetear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.applyButtonText}>Aplicar filtros</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Sort Modal */}
      <Modal visible={showSort} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSort(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.sortModalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ordenar por</Text>
              <TouchableOpacity onPress={() => setShowSort(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.sortOptions}>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortOption,
                    sort === option.value && styles.sortOptionActive,
                  ]}
                  onPress={() => {
                    handleSort(option.value);
                    setShowSort(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      sort === option.value && styles.sortOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {sort === option.value && (
                    <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = SPACING.md;
const CARD_WIDTH = (SCREEN_WIDTH - SPACING.lg * 2 - CARD_GAP) / 2;

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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  searchBar: {
    flex: 1,
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
  searchPlaceholder: {
    width: 80,
    height: 14,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceHighlight,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonActive: {
    backgroundColor: COLORS.primaryGlow,
    borderColor: COLORS.primary,
  },

  // Recent Searches
  recentDropdown: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: SPACING.md,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  recentTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recentClear: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  recentItemText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },

  // Active Filters
  activeFilters: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  filterChipsContainer: {
    gap: SPACING.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primaryGlow,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  clearAllChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clearAllText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '600',
  },

  // Grid
  list: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: 100,
  },
  gridRow: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },

  // Vehicle Card (Bento)
  vehicleCard: {
    width: CARD_WIDTH,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
  },
  vehicleCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  vehicleCardInner: {
    padding: SPACING.md,
  },
  vehicleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  vehicleTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  vehicleTypeLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  vehiclePlateContainer: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  vehiclePlate: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  vehicleOwner: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  vehicleLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  vehicleLocationText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
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
    marginBottom: SPACING.xl,
    maxWidth: 240,
  },
  emptyAction: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryGlow,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  emptyActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
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

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    maxHeight: '80%',
  },
  sortModalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.surfaceHighlight,
    alignSelf: 'center',
    marginTop: SPACING.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalBody: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    maxHeight: 400,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  optionButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  optionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  optionTextActive: {
    color: COLORS.text,
    fontWeight: '700',
  },
  typeRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  typeTextActive: {
    color: COLORS.text,
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  resetButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  applyButton: {
    flex: 2,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Sort Options
  sortOptions: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  sortOptionActive: {
    backgroundColor: COLORS.primaryGlow,
    marginHorizontal: -SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderBottomColor: 'transparent',
  },
  sortOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  sortOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
