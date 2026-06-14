import {
  parseTimestamp,
  formatLicensePlate,
  getVehicleTypeColor,
  getVehicleTypeIcon,
  getTowerColor,
  truncateText,
  formatDate,
  formatDateTime,
  formatRelativeTime,
} from '../utils';

describe('parseTimestamp', () => {
  it('returns epoch for empty string', () => {
    expect(parseTimestamp('')).toEqual(new Date(0));
  });

  it('appends Z when no timezone present', () => {
    const date = parseTimestamp('2024-03-15T10:30:00');
    expect(date.toISOString()).toBe('2024-03-15T10:30:00.000Z');
  });

  it('respects Z timezone', () => {
    const date = parseTimestamp('2024-03-15T10:30:00Z');
    expect(date.toISOString()).toBe('2024-03-15T10:30:00.000Z');
  });

  it('respects +05:00 timezone offset', () => {
    const date = parseTimestamp('2024-03-15T10:30:00+05:00');
    expect(date.getUTCHours()).toBe(5);
  });

  it('respects -05:00 timezone offset', () => {
    const date = parseTimestamp('2024-03-15T10:30:00-05:00');
    expect(date.getUTCHours()).toBe(15);
  });
});

describe('formatLicensePlate', () => {
  it('formats 6-char plate with dash', () => {
    expect(formatLicensePlate('ABC123')).toBe('ABC-123');
  });

  it('formats 7-char plate with dash', () => {
    expect(formatLicensePlate('ABC1234')).toBe('ABC-1234');
  });

  it('returns short plate without dash', () => {
    expect(formatLicensePlate('AB')).toBe('AB');
  });

  it('returns 3-char plate without dash', () => {
    expect(formatLicensePlate('ABC')).toBe('ABC');
  });

  it('removes existing dashes and reformats', () => {
    expect(formatLicensePlate('ABC-123')).toBe('ABC-123');
  });

  it('uppercases lowercase input', () => {
    expect(formatLicensePlate('abc123')).toBe('ABC-123');
  });

  it('removes special characters', () => {
    expect(formatLicensePlate('A.B.C 1 2 3')).toBe('ABC-123');
  });
});

describe('getVehicleTypeColor', () => {
  it('returns blue for car', () => {
    expect(getVehicleTypeColor('car')).toBe('#3B82F6');
  });

  it('returns purple for motorcycle', () => {
    expect(getVehicleTypeColor('motorcycle')).toBe('#8B5CF6');
  });
});

describe('getVehicleTypeIcon', () => {
  it('returns car icon for car', () => {
    expect(getVehicleTypeIcon('car')).toBe('car');
  });

  it('returns bicycle icon for motorcycle', () => {
    expect(getVehicleTypeIcon('motorcycle')).toBe('bicycle');
  });
});

describe('getTowerColor', () => {
  it('returns first color for tower 1', () => {
    expect(getTowerColor(1)).toBe('#3B82F6');
  });

  it('returns last color for tower 14', () => {
    expect(getTowerColor(14)).toBe('#0EA5E9');
  });

  it('wraps around for tower 15', () => {
    expect(getTowerColor(15)).toBe(getTowerColor(1));
  });

  it('wraps around for tower 28', () => {
    expect(getTowerColor(28)).toBe(getTowerColor(14));
  });
});

describe('truncateText', () => {
  it('returns text unchanged when shorter than max', () => {
    expect(truncateText('hello', 10)).toBe('hello');
  });

  it('returns text unchanged when equal to max', () => {
    expect(truncateText('hello', 5)).toBe('hello');
  });

  it('truncates and adds ellipsis when longer than max', () => {
    expect(truncateText('hello world', 5)).toBe('hello...');
  });
});

describe('formatRelativeTime', () => {
  it('returns "Ahora" for less than 1 minute ago', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe('Ahora');
  });

  it('returns minutes for < 1 hour ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toBe('5m');
  });

  it('returns hours for < 24 hours ago', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600000).toISOString();
    expect(formatRelativeTime(threeHoursAgo)).toBe('3h');
  });

  it('returns days for < 7 days ago', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
    expect(formatRelativeTime(twoDaysAgo)).toBe('2d');
  });
});
