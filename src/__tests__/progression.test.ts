import { CONTENT, getArea, testQuestionsOfArea, unitsOfArea } from '@/content';
import type { GameState, UnitProgress } from '@/models';
import { applyAnswer, createInitialState } from '@/services/gameEngine';
import {
  isAreaUnlocked,
  isMasterUnlocked,
  knowledgePercent,
  nextUnit,
  pickMasterQuestions,
  unitStatus,
} from '@/services/progression';

const done: UnitProgress = { completed: true, attempts: 1, bestScore: 100, completedAt: '2026-10-01T00:00:00.000Z' };
const complete = (...ids: string[]) => Object.fromEntries(ids.map((id) => [id, done]));
const NOW = new Date('2026-10-06T10:00:00.000Z');

describe('unlocking', () => {
  it('opens only the first area at the start', () => {
    expect(isAreaUnlocked(getArea('salah')!, {}, CONTENT)).toBe(true);
    expect(isAreaUnlocked(getArea('quran')!, {}, CONTENT)).toBe(false);
  });

  it('opens the next area after two units of the previous one', () => {
    const [u1, u2] = unitsOfArea('salah');
    expect(isAreaUnlocked(getArea('quran')!, complete(u1.id), CONTENT)).toBe(false);
    expect(isAreaUnlocked(getArea('quran')!, complete(u1.id, u2.id), CONTENT)).toBe(true);
    expect(isAreaUnlocked(getArea('seerah')!, complete(u1.id, u2.id), CONTENT)).toBe(false);
  });

  it('unlocks units one after another', () => {
    const [u1, u2, u3] = unitsOfArea('salah');
    expect(unitStatus(u1, {}, CONTENT)).toBe('available');
    expect(unitStatus(u2, {}, CONTENT)).toBe('locked');
    expect(unitStatus(u2, complete(u1.id), CONTENT)).toBe('available');
    expect(unitStatus(u1, complete(u1.id), CONTENT)).toBe('completed');
    expect(unitStatus(u3, complete(u1.id), CONTENT)).toBe('locked');
  });

  it('suggests the next unit in map order', () => {
    const [u1, u2] = unitsOfArea('salah');
    expect(nextUnit({}, CONTENT)?.id).toBe(u1.id);
    expect(nextUnit(complete(u1.id), CONTENT)?.id).toBe(u2.id);
  });

  it('opens the Master Challenge when every unit of the area is done', () => {
    const ids = unitsOfArea('salah').map((u) => u.id);
    expect(isMasterUnlocked('salah', complete(...ids.slice(0, -1)), CONTENT)).toBe(false);
    expect(isMasterUnlocked('salah', complete(...ids), CONTENT)).toBe(true);
  });
});

describe('master questions', () => {
  it('picks 10 unique questions from the area, weak ones first', () => {
    const pool = testQuestionsOfArea('salah');
    let state: GameState = createInitialState();
    const weak = pool[pool.length - 1];
    state = applyAnswer(state, weak, false, 'test', NOW).state;
    const picked = pickMasterQuestions(pool, state, 0);
    expect(picked).toHaveLength(10);
    expect(new Set(picked.map((q) => q.id)).size).toBe(10);
    expect(picked[0].id).toBe(weak.id);
    expect(picked.every((q) => q.areaId === 'salah')).toBe(true);
  });

  it('is stable for one attempt and varies between attempts', () => {
    const pool = testQuestionsOfArea('quran');
    const state = createInitialState();
    expect(pickMasterQuestions(pool, state, 1).map((q) => q.id)).toEqual(pickMasterQuestions(pool, state, 1).map((q) => q.id));
    const a = pickMasterQuestions(pool, state, 1).map((q) => q.id).join();
    const variants = new Set([2, 3, 4, 5].map((n) => pickMasterQuestions(pool, state, n).map((q) => q.id).join()));
    expect([...variants].some((v) => v !== a)).toBe(true);
  });
});

describe('knowledge stats', () => {
  it('measures understood content and drops while a question is pending review', () => {
    const pool = testQuestionsOfArea('salah');
    let state = createInitialState();
    expect(knowledgePercent(pool, state)).toBe(0);
    state = applyAnswer(state, pool[0], true, 'test', NOW).state;
    expect(knowledgePercent(pool, state)).toBe(Math.round(100 / pool.length));
    state = applyAnswer(state, pool[0], false, 'master', NOW).state;
    expect(knowledgePercent(pool, state)).toBe(0);
  });
});
