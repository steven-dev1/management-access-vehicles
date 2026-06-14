jest.mock('../lib/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/img.jpg' } })),
        remove: jest.fn(),
      })),
    },
    from: jest.fn(() => ({
      update: jest.fn(),
    })),
  },
}));

import { vehicleImageService } from '../lib/vehicleImage.service';

describe('vehicleImageService', () => {
  describe('canAddMore', () => {
    it('returns true for 0 images', () => {
      expect(vehicleImageService.canAddMore(0)).toBe(true);
    });

    it('returns true for 1 image', () => {
      expect(vehicleImageService.canAddMore(1)).toBe(true);
    });

    it('returns true for 2 images', () => {
      expect(vehicleImageService.canAddMore(2)).toBe(true);
    });

    it('returns false for 3 images', () => {
      expect(vehicleImageService.canAddMore(3)).toBe(false);
    });

    it('returns false for 4 images', () => {
      expect(vehicleImageService.canAddMore(4)).toBe(false);
    });
  });

  describe('getMaxImages', () => {
    it('returns 3', () => {
      expect(vehicleImageService.getMaxImages()).toBe(3);
    });
  });
});
