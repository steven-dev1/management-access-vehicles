import { useState, useEffect, useCallback } from 'react';
import * as FileSystem from 'expo-file-system/legacy';

const HISTORY_FILE = 'search_history.json';
const MAX_ITEMS = 10;

function getFilePath(): string {
  return `${FileSystem.cacheDirectory}${HISTORY_FILE}`;
}

async function readHistory(): Promise<string[]> {
  try {
    const path = getFilePath();
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return [];
    const content = await FileSystem.readAsStringAsync(path);
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeHistory(terms: string[]): Promise<void> {
  try {
    const path = getFilePath();
    await FileSystem.writeAsStringAsync(path, JSON.stringify(terms));
  } catch {
    // silently fail on write errors
  }
}

export function useSearchHistory() {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    readHistory().then(setRecentSearches);
  }, []);

  const addSearch = useCallback(async (term: string) => {
    const normalized = term.trim().toLowerCase();
    if (!normalized) return;

    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== normalized);
      const next = [normalized, ...filtered].slice(0, MAX_ITEMS);
      writeHistory(next);
      return next;
    });
  }, []);

  const removeSearch = useCallback(async (term: string) => {
    const normalized = term.trim().toLowerCase();

    setRecentSearches(prev => {
      const next = prev.filter(s => s !== normalized);
      writeHistory(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(async () => {
    setRecentSearches([]);
    try {
      const path = getFilePath();
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists) {
        await FileSystem.deleteAsync(path);
      }
    } catch {
      // silently fail
    }
  }, []);

  return { recentSearches, addSearch, removeSearch, clearHistory };
}
