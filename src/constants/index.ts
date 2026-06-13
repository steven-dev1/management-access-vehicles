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
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
    '#14B8A6', '#E11D48', '#A855F7', '#0EA5E9'
  ];
  return colors[(tower - 1) % colors.length];
};

export const getVehicleTypeColor = (type: string): string => {
  return type === 'car' ? '#3B82F6' : '#8B5CF6';
};

export const COLORS = {
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#93C5FD',
  secondary: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: '#0A0A0A',
  surface: '#1A1A1A',
  surfaceLight: '#2A2A2A',
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  border: '#374151',
  success: '#10B981',
  car: '#3B82F6',
  motorcycle: '#8B5CF6',
};
