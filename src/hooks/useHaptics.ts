import { useCallback } from 'react';

let Haptics: any = null;

async function getHaptics(): Promise<any> {
  if (Haptics) return Haptics;
  try {
    const mod = await import('expo-haptics' as any);
    Haptics = mod;
    return Haptics;
  } catch {
    return null;
  }
}

export function useHaptics() {
  const impactLight = useCallback(async () => {
    const H = await getHaptics();
    if (H) {
      try { await H.impactAsync(H.ImpactFeedbackStyle.Light); } catch {}
    }
  }, []);

  const impactMedium = useCallback(async () => {
    const H = await getHaptics();
    if (H) {
      try { await H.impactAsync(H.ImpactFeedbackStyle.Medium); } catch {}
    }
  }, []);

  const impactHeavy = useCallback(async () => {
    const H = await getHaptics();
    if (H) {
      try { await H.impactAsync(H.ImpactFeedbackStyle.Heavy); } catch {}
    }
  }, []);

  const notificationSuccess = useCallback(async () => {
    const H = await getHaptics();
    if (H) {
      try { await H.notificationAsync(H.NotificationFeedbackType.Success); } catch {}
    }
  }, []);

  const notificationWarning = useCallback(async () => {
    const H = await getHaptics();
    if (H) {
      try { await H.notificationAsync(H.NotificationFeedbackType.Warning); } catch {}
    }
  }, []);

  const notificationError = useCallback(async () => {
    const H = await getHaptics();
    if (H) {
      try { await H.notificationAsync(H.NotificationFeedbackType.Error); } catch {}
    }
  }, []);

  return { impactLight, impactMedium, impactHeavy, notificationSuccess, notificationWarning, notificationError };
}
