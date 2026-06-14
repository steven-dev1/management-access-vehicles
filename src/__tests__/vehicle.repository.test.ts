jest.mock('../lib/supabase', () => {
  const mockFrom = jest.fn();
  return {
    supabase: { from: mockFrom },
    __mockFrom: mockFrom,
  };
});

jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(),
}));

jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn(),
}));

jest.mock('expo-file-system/legacy', () => ({
  writeAsStringAsync: jest.fn(),
  cacheDirectory: '/cache/',
  EncodingType: { Base64: 'base64' },
}));

jest.mock('xlsx', () => ({
  utils: {
    json_to_sheet: jest.fn(() => ({})),
    book_new: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
  },
  write: jest.fn(() => 'base64data'),
}));

import { vehicleRepository } from '../lib/repositories/vehicle.repository';
const { __mockFrom: mockFrom } = require('../lib/supabase');

function createChainable(data: any[] = [], error: any = null) {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: data[0] || null, error }),
  };
  chain.then = (resolve: any) => resolve({ data, error });
  return chain;
}

describe('vehicleRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getApartmentViolations', () => {
    it('filters apartments with >2 vehicles', async () => {
      const mockData = [
        { apartment_code: '101', tower: 1, floor: 1, apartment: 1, vehicle_type: 'car' },
        { apartment_code: '101', tower: 1, floor: 1, apartment: 1, vehicle_type: 'car' },
        { apartment_code: '101', tower: 1, floor: 1, apartment: 1, vehicle_type: 'motorcycle' },
        { apartment_code: '102', tower: 1, floor: 1, apartment: 2, vehicle_type: 'car' },
      ];
      mockFrom.mockReturnValue(createChainable(mockData));

      const result = await vehicleRepository.getApartmentViolations();
      expect(result).toHaveLength(1);
      expect(result[0].vehicle_count).toBe(3);
    });

    it('filters apartments with >1 car', async () => {
      const mockData = [
        { apartment_code: '101', tower: 1, floor: 1, apartment: 1, vehicle_type: 'car' },
        { apartment_code: '101', tower: 1, floor: 1, apartment: 1, vehicle_type: 'car' },
      ];
      mockFrom.mockReturnValue(createChainable(mockData));

      const result = await vehicleRepository.getApartmentViolations();
      expect(result).toHaveLength(1);
      expect(result[0].car_count).toBe(2);
    });

    it('excludes apartments within limits', async () => {
      const mockData = [
        { apartment_code: '101', tower: 1, floor: 1, apartment: 1, vehicle_type: 'car' },
        { apartment_code: '102', tower: 1, floor: 1, apartment: 2, vehicle_type: 'motorcycle' },
      ];
      mockFrom.mockReturnValue(createChainable(mockData));

      const result = await vehicleRepository.getApartmentViolations();
      expect(result).toHaveLength(0);
    });
  });

  describe('getOccupancyByTower', () => {
    it('computes occupancy rate correctly', async () => {
      const mockData = [
        { tower: 1, floor: 1, apartment: 1, vehicle_type: 'car', apartment_code: '101' },
        { tower: 1, floor: 1, apartment: 2, vehicle_type: 'car', apartment_code: '102' },
        { tower: 2, floor: 1, apartment: 1, vehicle_type: 'motorcycle', apartment_code: '101' },
      ];
      mockFrom.mockReturnValue(createChainable(mockData));

      const result = await vehicleRepository.getOccupancyByTower();
      const tower1 = result.find(r => r.tower === 1);
      const tower2 = result.find(r => r.tower === 2);

      expect(tower1?.occupied_apartments).toBe(2);
      expect(tower1?.occupancy_rate).toBe(10);
      expect(tower2?.occupied_apartments).toBe(1);
      expect(tower2?.occupancy_rate).toBe(5);
    });

    it('returns all 14 towers', async () => {
      mockFrom.mockReturnValue(createChainable([]));

      const result = await vehicleRepository.getOccupancyByTower();
      expect(result).toHaveLength(14);
    });
  });

  describe('create', () => {
    it('computes apartment_code from floor and apartment', async () => {
      const chain = createChainable([{ apartment_code: '203' }]);
      chain.select = jest.fn().mockReturnValue(chain);
      chain.single = jest.fn().mockResolvedValue({ data: { apartment_code: '203' }, error: null });
      mockFrom.mockReturnValue(chain);

      await vehicleRepository.create({
        tower: 1, floor: 2, apartment: 3,
        vehicle_type: 'car', license_plate: 'ABC-123', owner_name: 'Test',
      });

      expect(mockFrom).toHaveBeenCalledWith('vehicles');
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ apartment_code: '203' })
      );
    });
  });
});
