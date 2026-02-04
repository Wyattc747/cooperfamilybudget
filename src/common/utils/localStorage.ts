import type { AppState } from '../types/index.ts';

const STORAGE_KEY = 'budget-app-state';

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable
  }
}

export function loadState(): AppState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as AppState;
    }
  } catch {
    // Corrupted data
  }
  return null;
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}
