import { useRef, useState, useCallback } from 'react';

interface VoiceCommandResult {
  action: 'entry' | 'exit' | null;
  plate: string | null;
  rawText: string;
}

const ENTRY_KEYWORDS = ['entrada', 'entra', 'ingresa', 'ingreso', 'llega', 'llegó', 'arriba'];
const EXIT_KEYWORDS = ['salida', 'sale', 'egresa', 'egreso', 'se va', 'retira', 'retiro'];
const VEHICLE_KEYWORDS = ['vehículo', 'vehiculo', 'auto', 'carro', 'moto', 'placa'];

function extractPlate(text: string): string | null {
  let cleaned = text.toUpperCase().replace(/[^A-Z0-9\s\-]/g, '');

  const stripWords = [...ENTRY_KEYWORDS, ...EXIT_KEYWORDS, ...VEHICLE_KEYWORDS,
    'del', 'de', 'la', 'el', 'los', 'las', 'un', 'una', 'y', 'para', 'por'].join('|');
  cleaned = cleaned.replace(new RegExp(`\\b(${stripWords})\\b`, 'gi'), '');

  const noSpaces = cleaned.replace(/\s+/g, '');

  const plateStrict = /^([A-Z]{3})(\d{3}|\d{2,3}[A-Z]?|[A-Z]{3})$/;

  const m1 = noSpaces.match(plateStrict);
  if (m1) return formatPlate(m1[1], m1[2]);

  const words = cleaned.split(/\s+/);
  const singleLetters = words.filter(w => /^[A-Z]$/.test(w));
  if (singleLetters.length >= 3) {
    const joined = singleLetters.join('');
    const m2 = joined.match(plateStrict);
    if (m2) return formatPlate(m2[1], m2[2]);
  }

  const allAlphaNum = noSpaces.replace(/[^A-Z0-9]/g, '');
  const m3 = allAlphaNum.match(plateStrict);
  if (m3) return formatPlate(m3[1], m3[2]);

  for (const word of words) {
    const clean = word.replace(/[^A-Z0-9]/g, '');
    const m4 = clean.match(plateStrict);
    if (m4) return formatPlate(m4[1], m4[2]);
  }

  const digitMatch = noSpaces.match(/(\d{2,3}[A-Z]?)/);
  if (digitMatch) {
    const idx = noSpaces.indexOf(digitMatch[0]);
    const before = noSpaces.slice(Math.max(0, idx - 4), idx).replace(/[^A-Z]/g, '');
    if (before.length >= 3) {
      const letters = before.slice(-3);
      return formatPlate(letters, digitMatch[1]);
    }
  }

  return null;
}

function formatPlate(letters: string, rest: string): string {
  const totalLen = letters.length + rest.length;
  return totalLen >= 7 ? `${letters}-${rest}` : `${letters}${rest}`;
}

function extractAction(text: string): 'entry' | 'exit' | null {
  const lower = text.toLowerCase();

  for (const keyword of EXIT_KEYWORDS) {
    if (lower.includes(keyword)) return 'exit';
  }
  for (const keyword of ENTRY_KEYWORDS) {
    if (lower.includes(keyword)) return 'entry';
  }

  return null;
}

let SpeechModule: any = null;
let moduleChecked = false;
let moduleAvailable = false;
let isExpoGo = false;

async function getSpeechModule(): Promise<any> {
  if (moduleChecked) return SpeechModule;
  moduleChecked = true;
  try {
    const Constants = await import('expo-constants');
    isExpoGo = Constants.default?.executionEnvironment === 'storeClient';
  } catch {}
  try {
    const mod = await import('expo-speech-recognition');
    SpeechModule = mod.ExpoSpeechRecognitionModule;
    moduleAvailable = !!SpeechModule;
  } catch {
    SpeechModule = null;
    moduleAvailable = false;
  }
  return SpeechModule;
}

export function isExpoGoEnvironment() {
  return isExpoGo;
}

function resolveBestResult(bestText: string): VoiceCommandResult {
  const action = extractAction(bestText);
  const plate = extractPlate(bestText);
  return { action, plate, rawText: bestText };
}

export function useVoiceCommand() {
  const [listening, setListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const resolveRef = useRef<((result: VoiceCommandResult) => void) | null>(null);
  const gotResultRef = useRef(false);
  const startTimeRef = useRef(0);
  const bestTextRef = useRef('');
  const bestConfidenceRef = useRef(0);

  const startListening = useCallback(async (): Promise<VoiceCommandResult> => {
    const Speech = await getSpeechModule();

    if (!Speech) {
      return { action: null, plate: null, rawText: '' };
    }

    if (isExpoGo) {
      return { action: null, plate: null, rawText: '' };
    }

    return new Promise(async (resolve) => {
      try {
        const available = await Speech.isRecognitionAvailable();
        console.log('[Voice] Recognition available:', available);
        if (!available) {
          resolve({ action: null, plate: null, rawText: '' });
          return;
        }

        gotResultRef.current = false;
        startTimeRef.current = Date.now();
        bestTextRef.current = '';
        bestConfidenceRef.current = 0;
        resolveRef.current = resolve;
        setListening(true);
        setVoiceText('Escuchando...');

        Speech.start({
          lang: 'es-CO',
          interimResults: true,
          maxAlternatives: 3,
          continuous: true,
        });

        const cleanup = () => {
          try { resultHandler.remove(); } catch {}
          try { endHandler.remove(); } catch {}
          try { errorHandler.remove(); } catch {}
        };

        const timeout = setTimeout(() => {
          if (!gotResultRef.current) {
            gotResultRef.current = true;
            cleanup();
            try { Speech.stop(); } catch {}

            if (bestTextRef.current) {
              const r = resolveBestResult(bestTextRef.current);
              setListening(false);
              setVoiceText('');
              resolveRef.current = null;
              resolve(r);
            } else {
              setListening(false);
              setVoiceText('');
              resolveRef.current = null;
              resolve({ action: null, plate: null, rawText: '' });
            }
          }
        }, 10000);

        const resultHandler = Speech.addListener('result', (event: any) => {
          const alternatives = event.results || [];
          let bestText = '';
          let bestConf = 0;

          for (const result of alternatives) {
            const transcription = result.transcript || '';
            const conf = result.confidence || 0;
            if (conf > bestConf) {
              bestConf = conf;
              bestText = transcription;
            }
          }

          if (bestText) {
            setVoiceText(bestText);

            if (bestConf > bestConfidenceRef.current || bestText.length > bestTextRef.current.length) {
              bestTextRef.current = bestText;
              bestConfidenceRef.current = bestConf;
              console.log('[Voice] Best text updated:', bestText, 'conf:', bestConf);
            }
          }

          if (event.isFinal && bestText && !gotResultRef.current) {
            gotResultRef.current = true;
            clearTimeout(timeout);
            cleanup();
            try { Speech.stop(); } catch {}

            const r = resolveBestResult(bestText);
            setListening(false);
            setVoiceText('');
            resolveRef.current = null;
            resolve(r);
          }
        });

        const endHandler = Speech.addListener('end', () => {
          console.log('[Voice] End event, elapsed:', Date.now() - startTimeRef.current, 'ms');
          if (gotResultRef.current) return;

          const elapsed = Date.now() - startTimeRef.current;
          if (elapsed < 800) {
            gotResultRef.current = true;
            clearTimeout(timeout);
            cleanup();
            setListening(false);
            setVoiceText('');
            resolveRef.current = null;
            resolve({ action: null, plate: null, rawText: '' });
            return;
          }

          gotResultRef.current = true;
          clearTimeout(timeout);
          cleanup();
          try { Speech.stop(); } catch {}

          if (bestTextRef.current) {
            const r = resolveBestResult(bestTextRef.current);
            console.log('[Voice] Using best interim text:', bestTextRef.current);
            setListening(false);
            setVoiceText('');
            resolveRef.current = null;
            resolve(r);
          } else {
            setListening(false);
            setVoiceText('');
            resolveRef.current = null;
            resolve({ action: null, plate: null, rawText: '' });
          }
        });

        const errorHandler = Speech.addListener('error', (event: any) => {
          console.log('[Voice] Error event:', event);
          if (gotResultRef.current) return;

          const elapsed = Date.now() - startTimeRef.current;
          if (elapsed < 800) {
            gotResultRef.current = true;
            clearTimeout(timeout);
            cleanup();
            setListening(false);
            setVoiceText('');
            resolveRef.current = null;
            resolve({ action: null, plate: null, rawText: '' });
            return;
          }

          if (bestTextRef.current) {
            console.log('[Voice] Error but have best text:', bestTextRef.current);
            gotResultRef.current = true;
            clearTimeout(timeout);
            cleanup();
            try { Speech.stop(); } catch {}
            const r = resolveBestResult(bestTextRef.current);
            setListening(false);
            setVoiceText('');
            resolveRef.current = null;
            resolve(r);
          } else {
            gotResultRef.current = true;
            clearTimeout(timeout);
            cleanup();
            setListening(false);
            setVoiceText('');
            resolveRef.current = null;
            resolve({ action: null, plate: null, rawText: '' });
          }
        });
      } catch {
        setListening(false);
        setVoiceText('');
        resolve({ action: null, plate: null, rawText: '' });
      }
    });
  }, []);

  const stopListening = useCallback(() => {
    getSpeechModule().then(Speech => {
      if (Speech) {
        try { Speech.stop(); } catch {}
      }
    });
    setListening(false);
    setVoiceText('');
  }, []);

  const updateVoiceText = useCallback((text: string) => {
    setVoiceText(text);
  }, []);

  const isVoiceAvailable = useCallback(async () => {
    const Speech = await getSpeechModule();
    if (!Speech) return false;
    if (isExpoGo) return false;
    try {
      return await Speech.isRecognitionAvailable();
    } catch {
      return false;
    }
  }, []);

  return {
    listening,
    voiceText,
    startListening,
    stopListening,
    updateVoiceText,
    isVoiceAvailable,
  };
}
