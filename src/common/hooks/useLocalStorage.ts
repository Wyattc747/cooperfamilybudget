import { useEffect } from 'react';
import type { AppState } from '../types/index.ts';
import { saveState } from '../utils/localStorage.ts';

export function useSyncLocalStorage(state: AppState): void {
  useEffect(() => {
    saveState(state);
  }, [state]);
}
