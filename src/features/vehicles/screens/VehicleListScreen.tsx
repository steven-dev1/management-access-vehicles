import React, { useState, useCallback, useRef, useMemo } from 'react';
import { View, FlatList, StyleSheet, TextInput, TouchableOpacity, Modal, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, TOWERS, generateAllApartments } from '../../../constants';
import { useVehicles } from '../hooks/useVehicles';
import { useSearchHistory } from '../../../hooks/useSearchHistory';
import { VehicleCard } from '../components/VehicleCard';
import { LoadingState, EmptyState, ErrorState } from '../../../components/EmptyState';
import { VehicleCardSkeleton } from '../../../components/SkeletonLoader';
import { Vehicle, FilterOptions, SortOption, VehicleType } from '../../../types';

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Más recientes', value: 'newest' },
  { label: 'Más antiguos', value: 'oldest' },
  { label: 'Placa A-Z', value: 'plate_asc' },
  { label: 'Placa Z-A', value: 'plate_desc' },
  { label: 'Torre ascendente', value: 'tower_asc' },
  { label: 'Torre descendente', value: 'tower_desc' },
];

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

  if (loading && !vehicles.length) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
            <View style={[styles.searchInput, { backgroundColor: COLORS.surfaceLight }]} />
          </View>
        </View>
        <VehicleCardSkeleton />
        <VehicleCardSkeleton />
        <VehicleCardSkeleton />
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
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            ref={searchRef}
            style={styles.searchInput}
            placeholder="Buscar placa o propietario..."
            placeholderTextColor={COLORS.textSecondary}
            value={search}
            onChangeText={handleSearch}
            onFocus={() => { if (recentSearches.length > 0) setShowRecent(true); }}
            onBlur={() => setTimeout(() => setShowRecent(false), 200)}
            onSubmitEditing={handleSearchSubmit}
            blurOnSubmit={false}
          />
          {search ? (
            <TouchableOpacity onPress={handleClearSearch}>
              <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {showRecent && recentSearches.length > 0 && !search && (
          <View style={styles.recentContainer}>
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
                <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.recentItemText}>{term}</Text>
                <TouchableOpacity onPress={() => removeSearch(term)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={14} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.filterButton, Object.keys(filters).length > 0 && styles.filterButtonActive]}
          onPress={() => {
            setTempFilters(filters);
            setShowFilters(true);
          }}
        >
          <Ionicons name="filter" size={20} color={Object.keys(filters).length > 0 ? COLORS.primary : COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.sortButton} onPress={() => setShowSort(true)}>
          <Ionicons name="swap-vertical" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {Object.keys(filters).length > 0 && (
        <View style={styles.activeFilters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filters.tower && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>T{filters.tower}</Text>
                <TouchableOpacity onPress={() => handleFilter({ ...filters, tower: undefined })}>
                  <Ionicons name="close-circle" size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
            {filters.apartment && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>{filters.apartment}</Text>
                <TouchableOpacity onPress={() => handleFilter({ ...filters, apartment: undefined })}>
                  <Ionicons name="close-circle" size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
            {filters.vehicle_type && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>{filters.vehicle_type === 'car' ? 'Carro' : 'Moto'}</Text>
                <TouchableOpacity onPress={() => handleFilter({ ...filters, vehicle_type: undefined })}>
                  <Ionicons name="close-circle" size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity style={styles.clearAllButton} onPress={clearAllFilters}>
              <Text style={styles.clearAllText}>Limpiar todo</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      <FlatList
        data={displayedVehicles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VehicleCard vehicle={item} onPress={handleVehiclePress} onDelete={handleDelete} />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="car"
            title="No se encontraron vehículos"
            message="Agrega vehículos o cambia los filtros."
            actionLabel="Limpiar filtros"
            onAction={clearAllFilters}
          />
        }
        ListFooterComponent={loading && vehicles.length > 0 ? <ActivityIndicator style={{ padding: 16 }} color={COLORS.primary} /> : null}
        onRefresh={refresh}
        refreshing={loading && vehicles.length === 0}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/vehicle/create')}
      >
        <Ionicons name="add" size={28} color={COLORS.text} />
      </TouchableOpacity>

      <Modal visible={showFilters} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
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
                  <Text style={styles.sectionTitle}>Apartamento</Text>
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

              <Text style={styles.sectionTitle}>Tipo de vehículo</Text>
              <View style={styles.optionsRow}>
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
          </View>
        </View>
      </Modal>

      <Modal visible={showSort} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.sortModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ordenar por</Text>
              <TouchableOpacity onPress={() => setShowSort(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
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
                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: COLORS.text,
    fontSize: 16,
  },
  recentContainer: {
    marginHorizontal: 16,
    marginTop: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  recentClear: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  recentItemText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary + '20',
  },
  sortButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFilters: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearAllText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '600',
  },
  list: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  sortModalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalBody: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 12,
    marginTop: 8,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
  },
  optionButtonActive: {
    backgroundColor: COLORS.primary,
  },
  optionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  optionTextActive: {
    color: COLORS.text,
    fontWeight: '600',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  typeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  typeTextActive: {
    color: COLORS.text,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  sortOptions: {
    padding: 16,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sortOptionActive: {
    backgroundColor: COLORS.primary + '10',
  },
  sortOptionText: {
    fontSize: 16,
    color: COLORS.text,
  },
  sortOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
