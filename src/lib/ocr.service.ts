import * as ImageManipulator from 'expo-image-manipulator';

const OCR_API_URL = 'https://api.ocr.space/parse/image';
const OCR_API_KEY = process.env.EXPO_PUBLIC_OCR_API_KEY || '';

interface OcrResult {
  plate: string;
  confidence: number;
}

export const ocrService = {
  async recognizePlate(imageUri: string): Promise<OcrResult[]> {
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1200 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      const formData = new FormData();
      formData.append('file', {
        uri: manipulated.uri,
        type: 'image/jpeg',
        name: 'plate.jpg',
      } as any);
      formData.append('apikey', OCR_API_KEY);
      formData.append('OCREngine', '2');
      formData.append('isOverlayRequired', 'false');
      formData.append('scale', 'true');
      formData.append('isTable', 'true');

      const response = await fetch(OCR_API_URL, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.OCRExitCode === 1 && result.ParsedResults?.length > 0) {
        const text = result.ParsedResults[0].ParsedText;
        return this.parsePlates(text);
      }

      return [];
    } catch (error) {
      console.error('OCR Error:', error);
      return [];
    }
  },

  parsePlates(text: string): OcrResult[] {
    const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);
    const plates: OcrResult[] = [];
    const plateRegex = /^[A-Z]{3}[\s\-]?\d{3,4}$/i;

    for (const line of lines) {
      const cleaned = line.replace(/[^A-Za-z0-9\-]/g, '').toUpperCase();
      if (plateRegex.test(cleaned)) {
        const formatted = cleaned.length === 7
          ? `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
          : cleaned;
        plates.push({ plate: formatted, confidence: 0.9 });
      }
    }

    const wordRegex = /^[A-Z]{3}\d{3,4}$/i;
    for (const line of lines) {
      const words = line.split(/\s+/);
      for (const word of words) {
        const cleaned = word.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        if (wordRegex.test(cleaned) && !plates.some(p => p.plate.replace(/-/g, '') === cleaned)) {
          const formatted = cleaned.length === 7
            ? `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
            : cleaned;
          plates.push({ plate: formatted, confidence: 0.7 });
        }
      }
    }

    return plates;
  },
};
