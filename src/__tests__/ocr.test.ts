import { ocrService } from '../lib/ocr.service';

describe('ocrService.parsePlates', () => {
  it('extracts 6-char plate (no dash, below threshold)', () => {
    const result = ocrService.parsePlates('ABC123');
    expect(result).toEqual([{ plate: 'ABC123', confidence: 0.9 }]);
  });

  it('extracts 7-char plate with dash', () => {
    const result = ocrService.parsePlates('ABC1234');
    expect(result).toEqual([{ plate: 'ABC-1234', confidence: 0.9 }]);
  });

  it('extracts plate with space separator (6 chars, no dash)', () => {
    const result = ocrService.parsePlates('ABC 123');
    expect(result).toEqual([{ plate: 'ABC123', confidence: 0.9 }]);
  });

  it('extracts plate with dash separator preserved', () => {
    const result = ocrService.parsePlates('ABC-1234');
    expect(result).toEqual([{ plate: 'ABC-1234', confidence: 0.9 }]);
  });

  it('extracts lowercase plate', () => {
    const result = ocrService.parsePlates('abc 1234');
    expect(result).toEqual([{ plate: 'ABC-1234', confidence: 0.9 }]);
  });

  it('returns empty array for no plates', () => {
    expect(ocrService.parsePlates('no plates here')).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(ocrService.parsePlates('')).toEqual([]);
  });

  it('extracts multiple plates', () => {
    const result = ocrService.parsePlates('ABC123\nDEF456');
    expect(result).toHaveLength(2);
    expect(result[0].plate).toBe('ABC123');
    expect(result[1].plate).toBe('DEF456');
  });

  it('deduplicates same plate from line and word match', () => {
    const result = ocrService.parsePlates('ABC123');
    expect(result).toHaveLength(1);
  });

  it('extracts word-level plate from mixed text (confidence 0.7)', () => {
    const result = ocrService.parsePlates('Vehicle: ABC123 Status: OK');
    expect(result).toEqual([{ plate: 'ABC123', confidence: 0.7 }]);
  });

  it('rejects motorcycle all-letter plates (no digits)', () => {
    const result = ocrService.parsePlates('ABCDEF');
    expect(result).toEqual([]);
  });
});
