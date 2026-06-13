import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants';

interface DateRangeFilterProps {
  selected: string;
  onSelect: (range: string) => void;
}

const RANGES = [
  { key: 'all', label: 'Todo', icon: 'apps' as const },
  { key: 'today', label: 'Hoy', icon: 'calendar' as const },
  { key: 'week', label: 'Esta semana', icon: 'calendar-outline' as const },
  { key: 'month', label: 'Este mes', icon: 'calendar' as const },
  { key: 'year', label: 'Este año', icon: 'calendar' as const },
];

export function DateRangeFilter({ selected, onSelect }: DateRangeFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {RANGES.map((range) => {
        const isSelected = selected === range.key;
        return (
          <TouchableOpacity
            key={range.key}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onSelect(range.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={range.icon}
              size={16}
              color={isSelected ? '#FFF' : COLORS.textSecondary}
            />
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {range.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  labelSelected: {
    color: '#FFF',
  },
});
