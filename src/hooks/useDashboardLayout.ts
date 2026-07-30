import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_COLLAPSED = '@dashboard_collapsed';
const STORAGE_KEY_PINNED = '@dashboard_pinned';

export interface PinnedInfo {
  pinned: boolean;
  pinnedAt: number;
}

export interface DashboardLayoutState {
  collapsed: Record<string, boolean>;
  pinned: Record<string, PinnedInfo>;
}

export const SECTION_IDS = [
  'stats',
  'parking-alerts',
  'violations',
  'restricted',
  'occupancy',
  'recent',
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

function sortByPinned(a: SectionId, b: SectionId, pinned: Record<string, PinnedInfo>): number {
  const aPinned = pinned[a];
  const bPinned = pinned[b];
  if (aPinned?.pinned && bPinned?.pinned) return aPinned.pinnedAt - bPinned.pinnedAt;
  if (aPinned?.pinned) return -1;
  if (bPinned?.pinned) return 1;
  return 0;
}

export function useDashboardLayout() {
  const [layout, setLayout] = useState<DashboardLayoutState>({
    collapsed: {},
    pinned: {},
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [collapsedRaw, pinnedRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_COLLAPSED),
          AsyncStorage.getItem(STORAGE_KEY_PINNED),
        ]);
        setLayout({
          collapsed: collapsedRaw ? JSON.parse(collapsedRaw) : {},
          pinned: pinnedRaw ? JSON.parse(pinnedRaw) : {},
        });
      } catch {}
      setLoaded(true);
    })();
  }, []);

  const toggleCollapse = useCallback(async (sectionId: string) => {
    setLayout(prev => {
      const next = {
        ...prev,
        collapsed: { ...prev.collapsed, [sectionId]: !prev.collapsed[sectionId] },
      };
      AsyncStorage.setItem(STORAGE_KEY_COLLAPSED, JSON.stringify(next.collapsed));
      return next;
    });
  }, []);

  const togglePin = useCallback(async (sectionId: string) => {
    setLayout(prev => {
      const current = prev.pinned[sectionId];
      const nextPinned = { ...prev.pinned };
      if (current?.pinned) {
        delete nextPinned[sectionId];
      } else {
        nextPinned[sectionId] = { pinned: true, pinnedAt: Date.now() };
      }
      const next = { ...prev, pinned: nextPinned };
      AsyncStorage.setItem(STORAGE_KEY_PINNED, JSON.stringify(next.pinned));
      return next;
    });
  }, []);

  const isCollapsed = useCallback((sectionId: string) => !!layout.collapsed[sectionId], [layout.collapsed]);
  const isPinned = useCallback((sectionId: string) => !!layout.pinned[sectionId]?.pinned, [layout.pinned]);

  const sortSections = useCallback((sections: SectionId[]) => {
    return [...sections].sort((a, b) => sortByPinned(a, b, layout.pinned));
  }, [layout.pinned]);

  return {
    loaded,
    toggleCollapse,
    togglePin,
    isCollapsed,
    isPinned,
    sortSections,
  };
}
