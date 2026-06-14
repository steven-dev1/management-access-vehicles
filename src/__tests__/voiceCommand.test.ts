import { extractPlate, extractAction, formatPlate } from '../hooks/useVoiceCommand';

describe('extractPlate', () => {
  it('extracts 6-char plate from "entrada ABC123"', () => {
    expect(extractPlate('entrada ABC123')).toBe('ABC123');
  });

  it('extracts 7-char plate from "salida placa LIJ04F"', () => {
    expect(extractPlate('salida placa LIJ04F')).toBe('LIJ04F');
  });

  it('extracts plate from "auto ABC 123"', () => {
    expect(extractPlate('auto ABC 123')).toBe('ABC123');
  });

  it('returns null for text without plate', () => {
    expect(extractPlate('hola mundo')).toBeNull();
  });

  it('handles plate with dash already (stripped to 6 chars, no re-dash)', () => {
    expect(extractPlate('entrada ABC-123')).toBe('ABC123');
  });

  it('handles lowercase input', () => {
    expect(extractPlate('entrada abc123')).toBe('ABC123');
  });

  it('ignores vehicle keywords in plate detection', () => {
    expect(extractPlate('entrada vehiculo ABC123')).toBe('ABC123');
  });
});

describe('extractAction', () => {
  it('detects "entrada" as entry', () => {
    expect(extractAction('entrada')).toBe('entry');
  });

  it('detects "entra" as entry', () => {
    expect(extractAction('entra')).toBe('entry');
  });

  it('detects "ingresa" as entry', () => {
    expect(extractAction('ingresa')).toBe('entry');
  });

  it('detects "salida" as exit', () => {
    expect(extractAction('salida')).toBe('exit');
  });

  it('detects "sale" as exit', () => {
    expect(extractAction('sale')).toBe('exit');
  });

  it('detects "se va" as exit', () => {
    expect(extractAction('se va')).toBe('exit');
  });

  it('returns null for no action keyword', () => {
    expect(extractAction('ABC123')).toBeNull();
  });

  it('exit takes priority over entry', () => {
    expect(extractAction('entrada y salida')).toBe('exit');
  });
});

describe('formatPlate', () => {
  it('no dash for 6-char total (below threshold)', () => {
    expect(formatPlate('ABC', '123')).toBe('ABC123');
  });

  it('adds dash for 7 char total', () => {
    expect(formatPlate('ABC', '1234')).toBe('ABC-1234');
  });

  it('no dash for short total', () => {
    expect(formatPlate('AB', 'C')).toBe('ABC');
  });
});
