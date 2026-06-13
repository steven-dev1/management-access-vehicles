import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, I18nManager } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

interface SwipeableCardProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onEdit?: () => void;
  onSwipeEnd?: () => void;
}

const SWIPE_THRESHOLD = -80;

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onDelete,
  onEdit,
  onSwipeEnd,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    const x = Math.min(0, event.nativeEvent.translationX);
    translateX.setValue(x);
  };

  const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    if ((event.nativeEvent as any).oldState === State.ACTIVE) {
      const { translationX } = event.nativeEvent;

      if (translationX < SWIPE_THRESHOLD) {
        Animated.spring(translateX, {
          toValue: -160,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const close = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      <View style={styles.actionsContainer}>
        {onEdit && (
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => { close(); onEdit(); }}
          >
            <Ionicons name="create-outline" size={20} color="#FFF" />
            <Text style={styles.actionText}>Editar</Text>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => { close(); onDelete(); }}
          >
            <Ionicons name="trash-outline" size={20} color="#FFF" />
            <Text style={styles.actionText}>Eliminar</Text>
          </TouchableOpacity>
        )}
      </View>

      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]}
      >
        <Animated.View style={[styles.cardContainer, { transform: [{ translateX }] }]}>
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    overflow: 'hidden',
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  editButton: {
    backgroundColor: COLORS.primary,
  },
  deleteButton: {
    backgroundColor: COLORS.danger,
  },
  actionText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  cardContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
});
