import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { licenseRepository } from '../lib/repositories/license.repository';
import { setCurrentLicenseId } from '../lib/repositories/license-context';
import { License, LicenseValidation } from '../types';
import { supabase } from '../lib/supabase';
import { offlineCacheService } from '../lib/offlineCache.service';

const LICENSE_KEY_STORAGE = 'vehicle_access_license_key';

interface LicenseState {
  isLoading: boolean;
  isLicensed: boolean;
  needsActivation: boolean;
  license: License | null;
  validation: LicenseValidation | null;
  error: string | null;
}

interface LicenseContextType extends LicenseState {
  activateLicense: (licenseKey: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const LicenseContext = createContext<LicenseContextType | null>(null);

export function LicenseProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LicenseState>({
    isLoading: true,
    isLicensed: false,
    needsActivation: false,
    license: null,
    validation: null,
    error: null,
  });

  const validateStoredLicense = useCallback(async () => {
    try {
      const storedKey = await SecureStore.getItemAsync(LICENSE_KEY_STORAGE);

      if (!storedKey) {
        setState(prev => ({ ...prev, isLoading: false, needsActivation: true }));
        return;
      }

      const validation = await licenseRepository.validateLicense(storedKey);

      if (validation.valid && validation.license) {
        if (!validation.deviceRegistered) {
          if (validation.devicesUsed >= validation.maxDevices) {
            setState(prev => ({
              ...prev,
              isLoading: false,
              isLicensed: false,
              needsActivation: true,
              license: validation.license,
              validation,
              error: 'Sin cupo de dispositivos.',
            }));
            return;
          }
          await licenseRepository.registerDevice(validation.license.id);
        }

        setState(prev => ({
          ...prev,
          isLoading: false,
          isLicensed: true,
          needsActivation: false,
          license: validation.license,
          validation,
        }));
        setCurrentLicenseId(validation.license.id);
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          isLicensed: false,
          needsActivation: true,
          license: validation.license,
          validation,
          error: validation.error || null,
        }));
      }
    } catch {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isLicensed: false,
        needsActivation: true,
        error: 'Error de conexión',
      }));
    }
  }, []);

  useEffect(() => {
    validateStoredLicense();
  }, [validateStoredLicense]);

  const activateLicense = async (licenseKey: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const validation = await licenseRepository.validateLicense(licenseKey);

      if (!validation.valid || !validation.license) {
        return { success: false, error: validation.error };
      }

      if (!validation.deviceRegistered) {
        if (validation.devicesUsed >= validation.maxDevices) {
          return { success: false, error: `Sin cupo. ${validation.devicesUsed}/${validation.maxDevices} en uso.` };
        }
        const registered = await licenseRepository.registerDevice(validation.license.id);
        if (!registered) return { success: false, error: 'Error al registrar dispositivo' };
      }

      await SecureStore.setItemAsync(LICENSE_KEY_STORAGE, licenseKey.toUpperCase().trim());

      setState({
        isLoading: false,
        isLicensed: true,
        needsActivation: false,
        license: validation.license,
        validation: { ...validation, deviceRegistered: true },
        error: null,
      });
      setCurrentLicenseId(validation.license.id);

      return { success: true };
    } catch {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(LICENSE_KEY_STORAGE);
    setCurrentLicenseId('');
    try { await offlineCacheService.clearAll(); } catch {}
    try { await supabase.auth.signOut(); } catch {
      try { await supabase.auth.signOut({ scope: 'local' }); } catch {}
    }
    setState({
      isLoading: false,
      isLicensed: false,
      needsActivation: true,
      license: null,
      validation: null,
      error: null,
    });
  };

  const refresh = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    await validateStoredLicense();
  };

  return (
    <LicenseContext.Provider value={{ ...state, activateLicense, logout, refresh }}>
      {children}
    </LicenseContext.Provider>
  );
}

export function useLicense() {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  return context;
}
