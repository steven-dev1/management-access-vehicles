import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../../constants';
import { Vehicle } from '../../../types';
import { formatRelativeTime, getVehicleTypeColor } from '../../../utils';

interface RecentActivityProps {
  vehicles: Vehicle[];
  onPress?: (vehicle: Vehicle) => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  vehicles,
  onPress,
}) => {
  if (!vehicles.length) return null;

  return (
    <View>
      <View style={styles.list}>
        {vehicles.slice(0, 5).map((vehicle) => (
          <ActivityItem
            key={vehicle.id}
            vehicle={vehicle}
            onPress={onPress}
          />
        ))}
      </View>
    </View>
  );
};

interface ActivityItemProps {
  vehicle: Vehicle;
  onPress?: (vehicle: Vehicle) => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ vehicle, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const typeColor = getVehicleTypeColor(vehicle.vehicle_type);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <TouchableOpacity
      style={styles.item}
      onPress={() => onPress?.(vehicle)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={onPress ? 0.85 : 1}
    >
      <Animated.View
        style={[styles.itemInner, { transform: [{ scale: scaleAnim }] }]}
      >
        <View style={[styles.iconContainer, { backgroundColor: typeColor + '12' }]}>
          <Ionicons
            name={vehicle.vehicle_type === 'car' ? 'car' : 'bicycle'}
            size={15}
            color={typeColor}
          />
        </View>
        <View style={styles.content}>
          <Text style={styles.plate}>{vehicle.license_plate}</Text>
          <Text style={styles.details}>
            Torre {vehicle.tower} · {vehicle.apartment_code} · {vehicle.owner_name}
          </Text>
        </View>
        <Text style={styles.time}>{formatRelativeTime(vehicle.created_at)}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: SPACING.sm,
  },
  item: {
    overflow: 'hidden',
    borderRadius: RADIUS.md,
  },
  itemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.sm,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
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
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  details: {
    fontSize: 12,
    color: COLORS.textMuted,
    letterSpacing: 0.1,
  },
  time: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});
