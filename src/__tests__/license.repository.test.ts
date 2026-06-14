jest.mock('../lib/supabase', () => {
  const mockFrom = jest.fn();
  return {
    supabase: { from: mockFrom },
    __mockFrom: mockFrom,
  };
});

jest.mock('expo-device', () => ({
  osInternalBuildId: 'test-device-id',
  modelId: null,
  deviceName: 'Test Device',
  modelName: 'Test Model',
}));

import { licenseRepository } from '../lib/repositories/license.repository';
const { __mockFrom: mockFrom } = require('../lib/supabase');

function createChainable(data: any = null, error: any = null, count: number | null = null) {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data, error }),
  };
  chain.then = (resolve: any) => resolve({
    data: Array.isArray(data) ? data : data ? [data] : [],
    error,
    count,
  });
  return chain;
}

describe('licenseRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateLicense', () => {
    it('returns error for invalid license key', async () => {
      mockFrom.mockReturnValue(createChainable(null, { message: 'Not found' }));

      const result = await licenseRepository.validateLicense('INVALID-KEY');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Licencia inválida');
    });

    it('returns error for inactive license', async () => {
      const license = { id: '1', license_key: 'TEST-KEY', active: false, max_devices: 2, trial_ends_at: null };
      mockFrom.mockReturnValue(createChainable(license));

      const result = await licenseRepository.validateLicense('TEST-KEY');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Licencia desactivada');
    });

    it('returns error for expired trial', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const license = { id: '1', license_key: 'TEST-KEY', active: true, max_devices: 2, trial_ends_at: pastDate.toISOString() };
      mockFrom.mockReturnValue(createChainable(license));

      const result = await licenseRepository.validateLicense('TEST-KEY');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Periodo de prueba expirado');
    });

    it('returns valid for active license with device slots', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const license = { id: '1', license_key: 'TEST-KEY', active: true, max_devices: 2, trial_ends_at: futureDate.toISOString() };

      mockFrom
        .mockReturnValueOnce(createChainable(license))
        .mockReturnValueOnce(createChainable(null, null, 0))
        .mockReturnValueOnce(createChainable(null, null, 0));

      const result = await licenseRepository.validateLicense('TEST-KEY');
      expect(result.valid).toBe(true);
      expect(result.license).toEqual(license);
    });
  });

  describe('createLicense', () => {
    it('generates key in XXXX-XXXX-XXXX format', async () => {
      mockFrom.mockReturnValue(createChainable({ license_key: 'ABCD1234EFGH5678' }));

      await licenseRepository.createLicense('Test Complex');
      expect(mockFrom().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          license_key: expect.stringMatching(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/),
        })
      );
    });

    it('computes trial_ends_at from trialDays', async () => {
      mockFrom.mockReturnValue(createChainable({}));

      await licenseRepository.createLicense('Test', 2, 30);
      expect(mockFrom().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          trial_ends_at: expect.any(String),
        })
      );
    });
  });
});
