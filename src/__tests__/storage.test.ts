import AsyncStorage from '@react-native-async-storage/async-storage';

import { QUESTIONS, testQuestionsOfArea, unitsOfArea } from '@/content';
import { applyAnswer, applyUnitComplete, createInitialState, STATE_VERSION } from '@/services/gameEngine';
import { dailyChallengeFor } from '@/services/daily';
import { clearGameState, loadGameState, migrateState, saveGameState, STORAGE_KEY } from '@/storage/persistence';
import { useGameStore } from '@/store/gameStore';

const NOW = new Date('2026-10-06T10:00:00.000Z');

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('persistence', () => {
  it('round-trips progress', async () => {
    let state = { ...createInitialState('de'), name: 'Amina', onboarded: true };
    state = applyAnswer(state, testQuestionsOfArea('salah')[0], false, 'test', NOW).state;
    state = applyUnitComplete(state, unitsOfArea('salah')[0].id, [true, false], NOW).state;
    await saveGameState(state);
    expect(await loadGameState()).toEqual(state);
  });

  it('handles empty, corrupt and future data', async () => {
    expect(await loadGameState()).toBeNull();
    await AsyncStorage.setItem(STORAGE_KEY, 'nope{');
    expect(await loadGameState()).toBeNull();
    expect(migrateState({ version: STATE_VERSION + 1 })).toBeNull();
    expect(migrateState(null)).toBeNull();
  });

  it('fills in defaults for older data', () => {
    const migrated = migrateState({ version: 1, xp: 12, settings: { language: 'bs' } })!;
    expect(migrated.xp).toBe(12);
    expect(migrated.settings.language).toBe('bs');
    expect(migrated.settings.highContrast).toBe(false);
    expect(migrated.stats.perfectQuizzes).toBe(0);
  });

  it('clears data', async () => {
    await saveGameState(createInitialState());
    await clearGameState();
    expect(await AsyncStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe('store', () => {
  it('hydrates with the device language and builds the quest log', async () => {
    await useGameStore.getState().hydrate('de');
    const game = useGameStore.getState().game;
    expect(game.settings.language).toBe('de');
    expect(game.quests.length).toBeGreaterThan(0);
  });

  it('queues badge celebrations and resets', async () => {
    await useGameStore.getState().hydrate('en');
    const unit = unitsOfArea('salah')[0];
    const outcome = useGameStore.getState().completeUnit(unit.id, [true, true, true, true], 0);
    expect(outcome.firstCompletion).toBe(true);
    expect(useGameStore.getState().celebrations).toContainEqual({ kind: 'badge', id: 'first_lesson' });
    await useGameStore.getState().resetProgress();
    expect(useGameStore.getState().game.units).toEqual({});
    expect(useGameStore.getState().celebrations).toEqual([]);
  });
});

describe('daily challenge', () => {
  it('is deterministic per day and rotates kinds', () => {
    expect(dailyChallengeFor('2026-10-06', QUESTIONS, [])).toEqual(dailyChallengeFor('2026-10-06', QUESTIONS, []));
    const kinds = new Set(
      Array.from({ length: 10 }, (_, i) => dailyChallengeFor(`2026-10-${String(i + 1).padStart(2, '0')}`, QUESTIONS, []).kind),
    );
    expect(kinds.size).toBeGreaterThanOrEqual(3);
  });

  it('uses pending review questions on review days', () => {
    const reviewDay = Array.from({ length: 10 }, (_, i) => `2026-11-${String(i + 1).padStart(2, '0')}`).find(
      (d) => dailyChallengeFor(d, QUESTIONS, [QUESTIONS[3].id]).kind === 'review',
    )!;
    expect(dailyChallengeFor(reviewDay, QUESTIONS, [QUESTIONS[3].id]).questionIds).toEqual([QUESTIONS[3].id]);
  });
});
