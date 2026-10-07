import { create } from 'zustand';

import { CONTENT } from '@/content';
import type { AreaId, BadgeId, Character, GameState, Language, Settings } from '@/models';
import {
  type AnswerMode,
  applyAnswer,
  applyDailyComplete,
  applyMasterComplete,
  applyReviewSessionComplete,
  applyUnitComplete,
  createInitialState,
  ensureQuests,
  finalizeBadges,
  type MasterReward,
  type UnitReward,
} from '@/services/gameEngine';
import { levelFromXp } from '@/services/xp';
import { clearGameState, loadGameState, saveGameState } from '@/storage/persistence';
import { toDayKey } from '@/utils/date';

export type Celebration = { kind: 'badge'; id: BadgeId } | { kind: 'level'; level: number };

export type UnitOutcome = Omit<UnitReward, 'state'> & { learningXp: number };
export type MasterOutcome = Omit<MasterReward, 'state'> & { learningXp: number };

interface GameStore {
  hydrated: boolean;
  game: GameState;
  celebrations: Celebration[];
  /** While true (e.g. inside a unit), queued celebrations wait instead of interrupting. */
  celebrationsPaused: boolean;

  hydrate: (deviceLanguage: Language) => Promise<void>;
  refreshQuests: () => void;
  completeOnboarding: (input: { name: string; character: Character; language: Language }) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setCharacter: (character: Character) => void;
  setName: (name: string) => void;
  recordAnswer: (question: { id: string; topic: string; areaId: AreaId }, correct: boolean, mode: AnswerMode) => number;
  completeUnit: (unitId: string, results: boolean[], learningXp: number) => UnitOutcome;
  completeMaster: (areaId: AreaId, results: boolean[], learningXp: number) => MasterOutcome;
  completeDaily: (day: string) => number;
  completeReviewSession: () => void;
  resetProgress: () => Promise<void>;
  dismissCelebration: () => void;
  setCelebrationsPaused: (paused: boolean) => void;
}

/** Applies badges and queues celebrations (new badges, level-ups) after every engine step. */
function commit(get: () => GameStore, set: (partial: Partial<GameStore>) => void, next: GameState) {
  const before = get().game;
  const { state, newBadges } = finalizeBadges(next, CONTENT, new Date());
  const levelBefore = levelFromXp(before.xp);
  const levelAfter = levelFromXp(state.xp);
  set({
    game: state,
    celebrations: [
      ...get().celebrations,
      ...(levelAfter > levelBefore ? [{ kind: 'level' as const, level: levelAfter }] : []),
      ...newBadges.map((id) => ({ kind: 'badge' as const, id })),
    ],
  });
}

export const useGameStore = create<GameStore>((set, get) => ({
  hydrated: false,
  game: createInitialState('en'),
  celebrations: [],
  celebrationsPaused: false,

  hydrate: async (deviceLanguage) => {
    const stored = await loadGameState();
    const game = ensureQuests(stored ?? createInitialState(deviceLanguage), toDayKey(new Date()), CONTENT);
    set({ game, hydrated: true });
  },

  refreshQuests: () => set({ game: ensureQuests(get().game, toDayKey(new Date()), CONTENT) }),

  completeOnboarding: ({ name, character, language }) => {
    const game = get().game;
    set({
      game: ensureQuests(
        { ...game, onboarded: true, name: name.trim(), character, settings: { ...game.settings, language } },
        toDayKey(new Date()),
        CONTENT,
      ),
    });
  },

  updateSettings: (patch) => {
    const game = get().game;
    set({ game: { ...game, settings: { ...game.settings, ...patch } } });
  },

  setCharacter: (character) => set({ game: { ...get().game, character } }),
  setName: (name) => set({ game: { ...get().game, name: name.trim() } }),

  recordAnswer: (question, correct, mode) => {
    const { state, xp } = applyAnswer(get().game, question, correct, mode, new Date());
    commit(get, set, state);
    return xp;
  },

  completeUnit: (unitId, results, learningXp) => {
    const { state, ...rest } = applyUnitComplete(get().game, unitId, results, new Date());
    commit(get, set, state);
    return { ...rest, learningXp };
  },

  completeMaster: (areaId, results, learningXp) => {
    const { state, ...rest } = applyMasterComplete(get().game, areaId, results, new Date());
    commit(get, set, state);
    return { ...rest, learningXp };
  },

  completeDaily: (day) => {
    const { state, xp } = applyDailyComplete(get().game, day, new Date());
    commit(get, set, state);
    return xp;
  },

  completeReviewSession: () => commit(get, set, applyReviewSessionComplete(get().game, new Date())),

  resetProgress: async () => {
    const language = get().game.settings.language;
    await clearGameState();
    set({ game: createInitialState(language), celebrations: [] });
  },

  dismissCelebration: () => set({ celebrations: get().celebrations.slice(1) }),
  setCelebrationsPaused: (paused) => set({ celebrationsPaused: paused }),
}));

let saveTimer: ReturnType<typeof setTimeout> | null = null;

/** Persists the game state shortly after every change (debounced). */
export function startAutoSave(): () => void {
  return useGameStore.subscribe((store, previous) => {
    if (!store.hydrated || store.game === previous.game) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveGameState(useGameStore.getState().game).catch(() => undefined);
    }, 300);
  });
}
