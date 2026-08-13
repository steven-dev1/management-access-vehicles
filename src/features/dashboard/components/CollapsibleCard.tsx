import React, { ReactNode, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../../constants';

interface CollapsibleCardProps {
  title?: string;
  collapsed: boolean;
  pinned: boolean;
  onToggleCollapse: () => void;
  onTogglePin: () => void;
  children: ReactNode;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  collapsed,
  pinned,
  onToggleCollapse,
  onTogglePin,
  children,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(collapsed ? 0 : 1)).current;
  const contentHeight = useRef(new Animated.Value(collapsed ? 0 : 1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
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

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: collapsed ? 0 : 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(contentHeight, {
        toValue: collapsed ? 0 : 1,
        useNativeDriver: false,
        speed: 40,
        bounciness: 6,
      }),
    ]).start();
  }, [collapsed]);

  return (
    <Animated.View
      style={[
        styles.container,
        collapsed && styles.containerCollapsed,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        style={[styles.header, collapsed && styles.headerCollapsed]}
        onPress={onToggleCollapse}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.85}
      >
        {pinned && (
          <View style={styles.pinBadge}>
            <Ionicons name="pin" size={10} color={COLORS.primary} />
          </View>
        )}
        {title ? (
          <Text
            style={[styles.title, collapsed && styles.titleCollapsed]}
            numberOfLines={1}
          >
            {title}
          </Text>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onTogglePin}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={pinned ? 'pin' : 'pin-outline'}
              size={14}
              color={pinned ? COLORS.primary : COLORS.textMuted}
            />
          </TouchableOpacity>
          <Animated.View
            style={{
              transform: [
                {
                  rotate: collapsed ? '0deg' : '180deg',
                },
              ],
            }}
          >
            <Ionicons
              name="chevron-down"
              size={16}
              color={COLORS.textMuted}
            />
          </Animated.View>
        </View>
      </TouchableOpacity>
      {!collapsed && (
        <Animated.View
          style={[
            styles.content,
            {
              opacity: contentOpacity,
            },
          ]}
        >
          <View style={styles.contentInner}>{children}</View>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.glass,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...SHADOWS.sm,
  },
  containerCollapsed: {
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerCollapsed: {
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
  },
  pinBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    letterSpacing: 0.2,
  },
  titleCollapsed: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    overflow: 'hidden',
  },
  contentInner: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.md,
  },
});
