export const TOWERS = Array.from({ length: 14 }, (_, i) => i + 1);
export const FLOORS = Array.from({ length: 5 }, (_, i) => i + 1);
export const APARTMENTS_PER_FLOOR = Array.from({ length: 4 }, (_, i) => i + 1);

export const MAX_CARS_PER_APARTMENT = 1;
export const MAX_MOTORCYCLES_PER_APARTMENT = 1;

export const VEHICLE_TYPE_LABELS: Record<string, string> = {
  car: 'Carro',
  motorcycle: 'Moto',
};

export const VEHICLE_TYPE_ICONS: Record<string, string> = {
  car: 'car',
  motorcycle: 'bicycle',
};

export const generateApartmentCode = (floor: number, apartment: number): string => {
  return `${floor * 100 + apartment}`;
};

export const generateAllApartments = () => {
  const apartments: Array<{
    tower: number;
    floor: number;
    apartment: number;
    code: string;
    label: string;
  }> = [];

  for (const tower of TOWERS) {
    for (const floor of FLOORS) {
      for (const apartment of APARTMENTS_PER_FLOOR) {
        const code = `${floor * 100 + apartment}`;
        apartments.push({
          tower,
          floor,
          apartment,
          code,
          label: `Torre ${tower} - ${code}`,
        });
      }
    }
  }

  return apartments;
};

export const getTowerColor = (tower: number): string => {
  const colors = [
    '#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA',
    '#F472B6', '#22D3EE', '#A3E635', '#FB923C', '#818CF8',
    '#2DD4BF', '#FB7185', '#C084FC', '#38BDF8'
  ];
  return colors[(tower - 1) % colors.length];
};

export const getVehicleTypeColor = (type: string): string => {
  return type === 'car' ? '#60A5FA' : '#A78BFA';
};

// 2026 Dark-first Design System
// Based on: glassmorphism 2.0, luminance hierarchy, off-black surfaces
export const COLORS = {
  // Brand
  primary: '#60A5FA',
  primaryDark: '#3B82F6',
  primaryLight: '#93C5FD',
  primaryGlow: 'rgba(96, 165, 250, 0.15)',

  // Semantic
  success: '#34D399',
  successGlow: 'rgba(52, 211, 153, 0.15)',
  warning: '#FBBF24',
  warningGlow: 'rgba(251, 191, 36, 0.15)',
  danger: '#F87171',
  dangerGlow: 'rgba(248, 113, 113, 0.15)',
  info: '#22D3EE',
  infoGlow: 'rgba(34, 211, 238, 0.15)',

  // Vehicle
  car: '#60A5FA',
  motorcycle: '#A78BFA',
  secondary: '#34D399',

  // Surfaces (4-level luminance hierarchy)
  background: '#09090B',
  surface: '#18181B',
  surfaceElevated: '#27272A',
  surfaceOverlay: 'rgba(24, 24, 27, 0.85)',
  surfaceHighlight: '#3F3F46',

  // Text
  text: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  textInverse: '#09090B',

  // Borders & Dividers
  border: '#27272A',
  borderLight: '#3F3F46',
  borderFocus: '#60A5FA',
  divider: 'rgba(63, 63, 70, 0.5)',

  // Glass (for glassmorphism effects)
  glass: 'rgba(24, 24, 27, 0.6)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassHighlight: 'rgba(255, 255, 255, 0.04)',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  }),
} as const;
