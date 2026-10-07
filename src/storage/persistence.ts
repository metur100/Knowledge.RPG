import AsyncStorage from '@react-native-async-storage/async-storage';

import type { GameState } from '@/models';
import { createInitialState, STATE_VERSION } from '@/services/gameEngine';

export const STORAGE_KEY = 'knowledgerpg:state';

/** Brings stored data up to the current shape; missing fields fall back to defaults. */
export function migrateState(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object') return null;
  const stored = raw as Partial<GameState>;
  if (typeof stored.version !== 'number' || stored.version > STATE_VERSION) return null;
  const base = createInitialState(stored.settings?.language ?? 'en');
  return {
    ...base,
    ...stored,
    version: STATE_VERSION,
    character: { ...base.character, ...stored.character },
    settings: { ...base.settings, ...stored.settings },
    streak: { ...base.streak, ...stored.streak },
    stats: { ...base.stats, ...stored.stats },
  };
}

export async function loadGameState(): Promise<GameState | null> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    return migrateState(JSON.parse(json));
  } catch {
    // Corrupt data must never crash the app; the player starts fresh instead.
    return null;
  }
}

export async function saveGameState(state: GameState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function clearGameState(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
