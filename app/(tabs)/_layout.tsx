import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 88,
          paddingBottom: 24,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{
        title: 'Dashboard',
        tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} />,
      }} />
      <Tabs.Screen name="vehicles" options={{
        title: 'Vehículos',
        tabBarIcon: ({ color, size }) => <Ionicons name="car" size={size} color={color} />,
      }} />
      <Tabs.Screen name="access" options={{
        title: 'Acceso',
        tabBarIcon: ({ color, size }) => <Ionicons name="swap-horizontal" size={size} color={color} />,
      }} />
      <Tabs.Screen name="visitors" options={{
        title: 'Visitantes',
        tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
      }} />
    </Tabs>
  );
}
