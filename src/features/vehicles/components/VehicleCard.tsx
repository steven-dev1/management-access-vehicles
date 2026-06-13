import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, PanResponder, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, getVehicleTypeColor } from '../../../constants';
import { Vehicle } from '../../../types';
import { formatRelativeTime } from '../../../utils';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress: (vehicle: Vehicle) => void;
  onDelete?: (vehicle: Vehicle) => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onPress, onDelete }) => {
  const typeColor = getVehicleTypeColor(vehicle.vehicle_type);
  const isRestricted = vehicle.is_restricted;
  const translateX = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -80));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) {
          Animated.spring(translateX, {
            toValue: -80,
            useNativeDriver: true,
          }).start();
          lastOffset.current = -80;
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          lastOffset.current = 0;
        }
      },
    })
  ).current;

  const handleDelete = () => {
    Alert.alert(
      'Eliminar vehículo',
      `¿Estás seguro de eliminar ${vehicle.license_plate}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            Animated.timing(translateX, {
              toValue: -400,
              duration: 300,
              useNativeDriver: true,
            }).start(() => onDelete?.(vehicle));
          },
        },
      ]
    );
  };

  const resetSwipe = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    lastOffset.current = 0;
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.deleteContainer}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash" size={20} color={COLORS.text} />
          <Text style={styles.deleteText}>Eliminar</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[styles.container, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={[styles.content, isRestricted && styles.contentRestricted]}
          onPress={() => onPress(vehicle)}
          activeOpacity={0.7}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.typeBadge, { backgroundColor: typeColor + '20' }]}>
                <Ionicons
                  name={vehicle.vehicle_type === 'car' ? 'car' : 'bicycle'}
                  size={16}
                  color={typeColor}
                />
                <Text style={[styles.typeText, { color: typeColor }]}>
                  {vehicle.vehicle_type === 'car' ? 'Carro' : 'Moto'}
                </Text>
              </View>
              {isRestricted && (
                <View style={styles.restrictedBadge}>
                  <Ionicons name="shield" size={12} color={COLORS.danger} />
                  <Text style={styles.restrictedBadgeText}>RESTRINGIDO</Text>
                </View>
              )}
            </View>
            <Text style={styles.time}>{formatRelativeTime(vehicle.created_at)}</Text>
          </View>

          <Text style={styles.plate}>{vehicle.license_plate}</Text>

          <View style={styles.info}>
            <View style={styles.infoItem}>
              <Ionicons name="location" size={14} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>T{vehicle.tower} - {vehicle.apartment_code}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="person" size={14} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{vehicle.owner_name}</Text>
            </View>
          </View>

          {isRestricted && vehicle.restriction_reason && (
            <View style={styles.restrictionReasonRow}>
              <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
              <Text style={styles.restrictionReasonText}>{vehicle.restriction_reason}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  deleteContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: COLORS.danger,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  content: {
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  contentRestricted: {
    borderLeftColor: COLORS.danger,
    backgroundColor: COLORS.danger + '06',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  restrictedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.danger + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  restrictedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.danger,
    letterSpacing: 0.5,
  },
  time: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  plate: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    letterSpacing: 1,
  },
  info: {
    flexDirection: 'row',
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  restrictionReasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.danger + '20',
  },
  restrictionReasonText: {
    fontSize: 13,
    color: COLORS.danger,
    fontStyle: 'italic',
  },
});
