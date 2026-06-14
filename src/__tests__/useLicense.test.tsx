import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { LicenseProvider, useLicense } from '../hooks/useLicense';

const mockGetItem = jest.fn();
const mockSetItem = jest.fn();
const mockRemoveItem = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: (...args: any[]) => mockGetItem(...args),
    setItem: (...args: any[]) => mockSetItem(...args),
    removeItem: (...args: any[]) => mockRemoveItem(...args),
  },
}));

jest.mock('../lib/repositories/license.repository', () => ({
  licenseRepository: {
    validateLicense: jest.fn(),
    registerDevice: jest.fn(),
  },
}));

jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: jest.fn(),
    },
  },
}));

import { licenseRepository } from '../lib/repositories/license.repository';
import { supabase } from '../lib/supabase';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LicenseProvider>{children}</LicenseProvider>
);

describe('useLicense', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetItem.mockResolvedValue(null);
  });

  it('returns needsActivation when no stored key', async () => {
    const { result } = renderHook(() => useLicense(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.needsActivation).toBe(true);
    expect(result.current.isLicensed).toBe(false);
  });

  it('validates stored license on mount', async () => {
    mockGetItem.mockResolvedValue('TEST-KEY');
    (licenseRepository.validateLicense as jest.Mock).mockResolvedValue({
      valid: true,
      license: { id: '1', license_key: 'TEST-KEY', active: true, max_devices: 2 },
      deviceRegistered: true,
      devicesUsed: 1,
      maxDevices: 2,
    });

    const { result } = renderHook(() => useLicense(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.isLicensed).toBe(true);
  });

  it('activateLicense succeeds with valid key', async () => {
    (licenseRepository.validateLicense as jest.Mock).mockResolvedValue({
      valid: true,
      license: { id: '1', license_key: 'NEW-KEY', active: true, max_devices: 2 },
      deviceRegistered: false,
      devicesUsed: 0,
      maxDevices: 2,
    });
    (licenseRepository.registerDevice as jest.Mock).mockResolvedValue(true);

    const { result } = renderHook(() => useLicense(), { wrapper });

    await act(async () => {
      const response = await result.current.activateLicense('NEW-KEY');
      expect(response.success).toBe(true);
    });

    expect(result.current.isLicensed).toBe(true);
    expect(mockSetItem).toHaveBeenCalledWith('@vehicle_access_license_key', 'NEW-KEY');
  });

  it('activateLicense fails with invalid key', async () => {
    (licenseRepository.validateLicense as jest.Mock).mockResolvedValue({
      valid: false,
      license: null,
      error: 'Licencia inválida',
    });

    const { result } = renderHook(() => useLicense(), { wrapper });

    await act(async () => {
      const response = await result.current.activateLicense('INVALID');
      expect(response.success).toBe(false);
      expect(response.error).toBe('Licencia inválida');
    });
  });

  it('activateLicense fails when no device slots', async () => {
    (licenseRepository.validateLicense as jest.Mock).mockResolvedValue({
      valid: true,
      license: { id: '1', license_key: 'FULL-KEY', active: true, max_devices: 2 },
      deviceRegistered: false,
      devicesUsed: 2,
      maxDevices: 2,
    });

    const { result } = renderHook(() => useLicense(), { wrapper });

    await act(async () => {
      const response = await result.current.activateLicense('FULL-KEY');
      expect(response.success).toBe(false);
      expect(response.error).toContain('Sin cupo');
    });
  });

  it('logout clears stored key and resets state', async () => {
    const { result } = renderHook(() => useLicense(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(mockRemoveItem).toHaveBeenCalledWith('@vehicle_access_license_key');
    expect(result.current.needsActivation).toBe(true);
    expect(result.current.isLicensed).toBe(false);
  });
});
