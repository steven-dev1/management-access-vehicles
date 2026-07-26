import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants';
import { Vehicle } from '../../../types';
import { formatRelativeTime, getVehicleTypeColor } from '../../../utils';

interface RecentActivityProps {
  vehicles: Vehicle[];
  onPress?: (vehicle: Vehicle) => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ vehicles, onPress }) => {
  if (!vehicles.length) return null;

  return (
    <View>
      <View style={styles.list}>
        {vehicles.slice(0, 5).map((vehicle) => (
          <TouchableOpacity
            key={vehicle.id}
            style={styles.item}
            onPress={() => onPress?.(vehicle)}
            activeOpacity={onPress ? 0.7 : 1}
          >
            <View style={[styles.iconContainer, { backgroundColor: getVehicleTypeColor(vehicle.vehicle_type) + '20' }]}>
              <Ionicons
                name={vehicle.vehicle_type === 'car' ? 'car' : 'bicycle'}
                size={16}
                color={getVehicleTypeColor(vehicle.vehicle_type)}
              />
            </View>
            <View style={styles.content}>
              <Text style={styles.plate}>{vehicle.license_plate}</Text>
              <Text style={styles.details}>Torre {vehicle.tower} - {vehicle.apartment_code} • {vehicle.owner_name}</Text>
            </View>
            <Text style={styles.time}>{formatRelativeTime(vehicle.created_at)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  plate: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  details: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  time: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
