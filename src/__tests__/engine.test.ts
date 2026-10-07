import { CONTENT, testQuestionsOfArea, unitsOfArea } from '@/content';
import type { GameState } from '@/models';
import {
  applyAnswer,
  applyDailyComplete,
  applyMasterComplete,
  applyUnitComplete,
  createInitialState,
  ensureQuests,
  finalizeBadges,
} from '@/services/gameEngine';
import { QUEST_XP } from '@/services/quests';
import { XP } from '@/services/xp';

const NOW = new Date('2026-10-06T10:00:00.000Z');
const DAY = '2026-10-06';
const pool = testQuestionsOfArea('salah');
const q = pool[0];

/** A state without quests so XP checks are not affected by quest rewards. */
const bare = (): GameState => createInitialState('en');

describe('answers', () => {
  it('never scores practice', () => {
    const state = bare();
    expect(applyAnswer(state, q, true, 'practice', NOW)).toEqual({ state, xp: 0 });
  });

  it('gives XP for a correct answer only once (no farming)', () => {
    const first = applyAnswer(bare(), q, true, 'test', NOW);
    expect(first.xp).toBe(XP.correctAnswer);
    const second = applyAnswer(first.state, q, true, 'test', NOW);
    expect(second.xp).toBe(0);
    expect(second.state.stats.correctAnswers).toBe(2);
    expect(second.state.correctlyAnswered).toEqual([q.id]);
  });

  it('puts mistakes into review and rewards remembering them', () => {
    const wrong = applyAnswer(bare(), q, false, 'test', NOW);
    expect(wrong.xp).toBe(0);
    expect(wrong.state.review[q.id]).toMatchObject({ incorrectCount: 1, box: 0, topic: q.topic });
    const fixed = applyAnswer(wrong.state, q, true, 'review', NOW);
    expect(fixed.xp).toBe(XP.reviewCorrect);
    expect(fixed.state.review[q.id].box).toBe(1);
    expect(fixed.state.stats.reviewsCorrect).toBe(1);
  });
});

describe('units', () => {
  it('rewards first completion and a perfect score once', () => {
    const unit = unitsOfArea('salah')[0];
    const first = applyUnitComplete(bare(), unit.id, [true, true, true, true], NOW);
    expect(first.firstCompletion).toBe(true);
    expect(first.xp).toBe(XP.unitComplete + XP.perfectBonus);
    expect(first.state.streak.current).toBe(1);
    const again = applyUnitComplete(first.state, unit.id, [true, true, true, true], NOW);
    expect(again.firstCompletion).toBe(false);
    expect(again.xp).toBe(0);
    expect(again.state.units[unit.id].attempts).toBe(2);
  });
});

describe('master challenge', () => {
  it('fails below 70 % without a penalty and passes later', () => {
    const fail = applyMasterComplete(bare(), 'salah', [true, true, true, true, true, true, false, false, false, false], NOW);
    expect(fail.passed).toBe(false);
    expect(fail.xp).toBe(0);
    expect(fail.state.masters.salah).toMatchObject({ passed: false, attempts: 1, bestScore: 60 });
    expect(fail.state.xp).toBe(0);

    const pass = applyMasterComplete(fail.state, 'salah', [true, true, true, true, true, true, true, false, false, false], NOW);
    expect(pass.passed).toBe(true);
    expect(pass.firstPass).toBe(true);
    expect(pass.xp).toBe(XP.masterPassed);
    const { newBadges } = finalizeBadges(pass.state, CONTENT, NOW);
    expect(newBadges).toContain('salah_scholar');

    const repeat = applyMasterComplete(pass.state, 'salah', Array(10).fill(true), NOW);
    expect(repeat.xp).toBe(0);
    expect(repeat.state.masters.salah?.bestScore).toBe(100);
  });
});

describe('daily challenge and quests', () => {
  it('rewards the daily challenge once per day and completes the daily quest', () => {
    const state = ensureQuests(bare(), DAY, CONTENT);
    const first = applyDailyComplete(state, DAY, NOW);
    expect(first.xp).toBe(XP.dailyChallenge + QUEST_XP.daily);
    expect(first.state.quests.find((x) => x.kind === 'daily')?.completed).toBe(true);
    expect(applyDailyComplete(first.state, DAY, NOW).xp).toBe(0);
  });

  it('progresses knowledge and learning quests', () => {
    let state = ensureQuests(bare(), DAY, CONTENT);
    const learning = state.quests.find((x) => x.kind === 'learning');
    expect(learning?.goal).toEqual({ type: 'completeUnit', unitId: unitsOfArea('salah')[0].id });
    for (const question of pool.slice(0, 5)) state = applyAnswer(state, question, true, 'test', NOW).state;
    expect(state.quests.find((x) => x.kind === 'knowledge')?.completed).toBe(true);
    state = applyUnitComplete(state, unitsOfArea('salah')[0].id, [true], NOW).state;
    expect(state.quests.find((x) => x.kind === 'learning')?.completed).toBe(true);
  });

  it('keeps the quest log for the day and regenerates it the next day', () => {
    const state = ensureQuests(bare(), DAY, CONTENT);
    expect(ensureQuests(state, DAY, CONTENT)).toBe(state);
    const tomorrow = ensureQuests(state, '2026-10-07', CONTENT);
    expect(tomorrow.questDay).toBe('2026-10-07');
    expect(tomorrow.quests[0].id).toBe('2026-10-07-daily');
  });

  it('adds review and challenge quests when relevant', () => {
    let state = applyAnswer(bare(), q, false, 'test', NOW).state;
    for (const unit of unitsOfArea('salah')) state = applyUnitComplete(state, unit.id, [true], NOW).state;
    const quests = ensureQuests(state, DAY, CONTENT).quests;
    expect(quests.map((x) => x.kind)).toEqual(expect.arrayContaining(['daily', 'learning', 'knowledge', 'review', 'challenge']));
    expect(quests.length).toBeLessThanOrEqual(5);
  });
});

describe('badges', () => {
  it('awards the first lesson and first perfect quiz badges once', () => {
    const unit = unitsOfArea('salah')[0];
    const state = applyUnitComplete(bare(), unit.id, [true, true], NOW).state;
    const first = finalizeBadges(state, CONTENT, NOW);
    expect(first.newBadges).toEqual(expect.arrayContaining(['first_lesson', 'first_perfect_quiz']));
    expect(finalizeBadges(first.state, CONTENT, NOW).newBadges).toEqual([]);
  });
});
