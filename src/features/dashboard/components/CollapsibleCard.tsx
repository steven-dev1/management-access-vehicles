import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants';

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
  return (
    <View style={[styles.container, collapsed && styles.containerCollapsed]}>
      <TouchableOpacity
        style={[styles.header, collapsed && styles.headerCollapsed]}
        onPress={onToggleCollapse}
        activeOpacity={0.7}
      >
        {pinned && <Ionicons name="pin" size={12} color={COLORS.primary} style={styles.pinIcon} />}
        {title ? <Text style={[styles.title, collapsed && styles.titleCollapsed]} numberOfLines={1}>{title}</Text> : <View style={{ flex: 1 }} />}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={onTogglePin} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons
              name={pinned ? 'pin' : 'pin-outline'}
              size={14}
              color={pinned ? COLORS.primary : COLORS.textSecondary}
            />
          </TouchableOpacity>
          <Ionicons
            name={collapsed ? 'chevron-forward' : 'chevron-down'}
            size={16}
            color={COLORS.textSecondary}
          />
        </View>
      </TouchableOpacity>
      {!collapsed && <View style={styles.content}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    width: '100%',
  },
  containerCollapsed: {
    marginBottom: 6,
    borderRadius: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerCollapsed: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  pinIcon: {
    marginRight: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  titleCollapsed: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
});
