import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { COLORS } from '../src/constants';
import Providers from './providers';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { notificationService } from '../src/lib/notification.service';
import { LicenseProvider, useLicense } from '../src/hooks/useLicense';
import { AdminProvider } from '../src/hooks/useAdmin';
import { LicenseActivationScreen } from '../src/features/license/screens/LicenseActivationScreen';
import { supabase } from '../src/lib/supabase';
import PanelScreen from '../src/features/admin/screens/PanelScreen';
import LicensesScreen from '../src/features/admin/screens/LicensesScreen';
import DevicesScreen from '../src/features/admin/screens/DevicesScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

async function clearAdminSession() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    }
  } catch {}
}

function LicenseGate() {
  const { isLoading, isLicensed, needsActivation, error, activateLicense } = useLicense();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    clearAdminSession().finally(() => setReady(true));
  }, [isLoading]);

  const handleAdminLogin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setIsAdminMode(true);
      setShowAdminLogin(false);
    }
  };

  const handleAdminLogout = async () => {
    await clearAdminSession();
    setIsAdminMode(false);
  };

  const handleActivateLicense = async (key: string) => {
    await clearAdminSession();
    const result = await activateLicense(key);
    if (result.success) {
      await clearAdminSession();
      setIsAdminMode(false);
    }
    return result;
  };

  if (isLoading || !ready) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (isAdminMode) {
    return <AdminApp onLogout={handleAdminLogout} />;
  }

  if (showAdminLogin) {
    const AdminLoginScreen = require('./admin-login').default;
    return (
      <AdminLoginScreen
        onLogin={handleAdminLogin}
        onBack={() => setShowAdminLogin(false)}
      />
    );
  }

  if (needsActivation || !isLicensed) {
    return (
      <LicenseActivationScreen
        onActivate={handleActivateLicense}
        onAdminBypass={() => setShowAdminLogin(true)}
        error={error}
      />
    );
  }

  return <AppContent />;
}

function AdminApp({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'panel' | 'licenses' | 'devices'>('panel');

  useEffect(() => {
    notificationService.requestPermissions();
  }, []);

  return (
    <AdminProvider onLogout={onLogout}>
      <StatusBar style="light" />
      {activeTab === 'panel' && <PanelScreen />}
      {activeTab === 'licenses' && <LicensesScreen />}
      {activeTab === 'devices' && <DevicesScreen />}
      <View style={adminStyles.tabBar}>
        <TouchableOpacity style={[adminStyles.tab, activeTab === 'panel' && adminStyles.tabActive]} onPress={() => setActiveTab('panel')}>
          <Ionicons name="stats-chart" size={20} color={activeTab === 'panel' ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[adminStyles.tabLabel, activeTab === 'panel' && adminStyles.tabLabelActive]}>Panel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[adminStyles.tab, activeTab === 'licenses' && adminStyles.tabActive]} onPress={() => setActiveTab('licenses')}>
          <Ionicons name="key" size={20} color={activeTab === 'licenses' ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[adminStyles.tabLabel, activeTab === 'licenses' && adminStyles.tabLabelActive]}>Licencias</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[adminStyles.tab, activeTab === 'devices' && adminStyles.tabActive]} onPress={() => setActiveTab('devices')}>
          <Ionicons name="phone-portrait" size={20} color={activeTab === 'devices' ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[adminStyles.tabLabel, activeTab === 'devices' && adminStyles.tabLabelActive]}>Dispositivos</Text>
        </TouchableOpacity>
      </View>
    </AdminProvider>
  );
}

function AppContent() {
  useEffect(() => {
    notificationService.requestPermissions();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="vehicle/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="vehicle/create" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="vehicle/edit/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="apartment-history" options={{ presentation: 'modal', animation: 'slide_from_right' }} />
        <Stack.Screen name="visitor-form" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="devices" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Providers>
          <LicenseProvider>
            <LicenseGate />
          </LicenseProvider>
        </Providers>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});

const adminStyles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    paddingBottom: 24,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  tabActive: {},
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabLabelActive: {
    color: COLORS.primary,
  },
});
