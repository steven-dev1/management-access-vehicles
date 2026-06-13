import { VehicleType } from '../types';

export function parseTimestamp(dateString: string): Date {
  if (!dateString) return new Date(0);
  const hasTimezone = /[Zz]$/.test(dateString) || /[+-]\d{2}:\d{2}$/.test(dateString);
  return new Date(hasTimezone ? dateString : dateString + 'Z');
}

export const formatLicensePlate = (plate: string): string => {
  const clean = plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (clean.length <= 3) return clean;
  if (clean.length <= 7) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  return `${clean.slice(0, 3)}-${clean.slice(3, 7)}`;
};

export const getVehicleTypeColor = (type: VehicleType): string => {
  return type === 'car' ? '#3B82F6' : '#8B5CF6';
};

export const getVehicleTypeIcon = (type: VehicleType): string => {
  return type === 'car' ? 'car' : 'bicycle';
};

export const getTowerColor = (tower: number): string => {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
    '#14B8A6', '#E11D48', '#A855F7', '#0EA5E9'
  ];
  return colors[(tower - 1) % colors.length];
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const formatDate = (dateString: string): string => {
  const date = parseTimestamp(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = parseTimestamp(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatRelativeTime = (dateString: string): string => {
  const date = parseTimestamp(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return formatDate(dateString);
};
