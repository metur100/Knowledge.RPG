import type { AreaId, BadgeId, DayKey, GameState, Language } from '@/models';
import { toDayKey } from '@/utils/date';
import { awardBadges } from './badges';
import type { ContentGraph } from './progression';
import { generateQuests, progressQuests, type QuestEvent } from './quests';
import { masterPassed, scoreQuiz, type QuizScore } from './quiz';
import { isDue, recordMistake, recordSuccess } from './review';
import { EMPTY_STREAK, registerActivity } from './streak';
import { XP } from './xp';

export const STATE_VERSION = 1;

export function createInitialState(language: Language = 'en'): GameState {
  return {
    version: STATE_VERSION,
    onboarded: false,
    name: '',
    character: { skinTone: 2, hairStyle: 'short', hairColor: 0, headwear: 'none', outfit: 'jacket', outfitColor: 1, accessory: 'none' },
    settings: {
      language,
      soundEnabled: true,
      hapticsEnabled: true,
      narrationEnabled: false,
      reducedMotion: false,
      largeText: false,
      highContrast: false,
    },
    xp: 0,
    units: {},
    masters: {},
    correctlyAnswered: [],
    badges: {},
    streak: { ...EMPTY_STREAK },
    review: {},
    dailyCompleted: [],
    questDay: null,
    quests: [],
    stats: { questionsAnswered: 0, correctAnswers: 0, reviewsCorrect: 0, perfectQuizzes: 0 },
  };
}

/** Regenerates the quest log once per calendar day. */
export function ensureQuests(state: GameState, day: DayKey, graph: ContentGraph): GameState {
  if (state.questDay === day && state.quests.length > 0) return state;
  return { ...state, questDay: day, quests: generateQuests(day, state, graph) };
}

function withQuestEvent(state: GameState, event: QuestEvent): { state: GameState; questXp: number } {
  const { quests, xp } = progressQuests(state.quests, event);
  return { state: { ...state, quests, xp: state.xp + xp }, questXp: xp };
}

export type AnswerMode = 'practice' | 'test' | 'master' | 'review' | 'daily';

export interface EngineResult {
  state: GameState;
  xp: number;
}

/**
 * Records an answer. Practice answers are never scored. XP for a correct test answer is granted
 * only once per question; mistakes go into the spaced-review queue.
 */
export function applyAnswer(
  state: GameState,
  question: { id: string; topic: string; areaId: AreaId },
  correct: boolean,
  mode: AnswerMode,
  now: Date,
): EngineResult {
  if (mode === 'practice') return { state, xp: 0 };
  const nowIso = now.toISOString();
  const stats = {
    ...state.stats,
    questionsAnswered: state.stats.questionsAnswered + 1,
    correctAnswers: state.stats.correctAnswers + (correct ? 1 : 0),
  };
  const review = { ...state.review };
  const existing = review[question.id];
  let xp = 0;
  let correctlyAnswered = state.correctlyAnswered;

  if (!correct) {
    review[question.id] = recordMistake(existing, question.id, question.topic, nowIso);
  } else {
    if (!state.correctlyAnswered.includes(question.id)) {
      correctlyAnswered = [...state.correctlyAnswered, question.id];
      if (mode !== 'review') xp += XP.correctAnswer;
    }
    if (existing && isDue(existing, nowIso)) {
      review[question.id] = recordSuccess(existing, nowIso);
      if (mode === 'review') {
        xp += XP.reviewCorrect;
        stats.reviewsCorrect += 1;
      }
    }
  }

  const base = { ...state, stats, review, correctlyAnswered, xp: state.xp + xp };
  const { state: next, questXp } = withQuestEvent(base, {
    type: 'answer',
    areaId: question.areaId,
    correct,
    review: mode === 'review',
  });
  return { state: next, xp: xp + questXp };
}

export interface UnitReward {
  state: GameState;
  xp: number;
  score: QuizScore;
  firstCompletion: boolean;
}

export function applyUnitComplete(state: GameState, unitId: string, results: readonly boolean[], now: Date): UnitReward {
  const score = scoreQuiz(results);
  const before = state.units[unitId];
  const firstCompletion = !before?.completed;
  const perfect = score.total > 0 && score.correct === score.total;
  const firstPerfect = perfect && (before?.bestScore ?? 0) < 100;
  let xp = 0;
  if (firstCompletion) xp += XP.unitComplete;
  if (firstPerfect) xp += XP.perfectBonus;

  const base: GameState = {
    ...state,
    xp: state.xp + xp,
    streak: registerActivity(state.streak, toDayKey(now)),
    units: {
      ...state.units,
      [unitId]: {
        completed: true,
        attempts: (before?.attempts ?? 0) + 1,
        bestScore: Math.max(before?.bestScore ?? 0, score.percent),
        completedAt: before?.completedAt ?? now.toISOString(),
      },
    },
    stats: firstPerfect ? { ...state.stats, perfectQuizzes: state.stats.perfectQuizzes + 1 } : state.stats,
  };
  const { state: next, questXp } = withQuestEvent(base, { type: 'unitComplete', unitId });
  return { state: next, xp: xp + questXp, score, firstCompletion };
}

export interface MasterReward {
  state: GameState;
  xp: number;
  score: QuizScore;
  passed: boolean;
  firstPass: boolean;
}

/** Master Challenge: 70% to pass. A failed attempt is a learning moment, not a punishment. */
export function applyMasterComplete(state: GameState, areaId: AreaId, results: readonly boolean[], now: Date): MasterReward {
  const score = scoreQuiz(results);
  const passed = masterPassed(results);
  const before = state.masters[areaId];
  const firstPass = passed && !before?.passed;
  const xp = firstPass ? XP.masterPassed : 0;
  let next: GameState = {
    ...state,
    xp: state.xp + xp,
    streak: registerActivity(state.streak, toDayKey(now)),
    masters: {
      ...state.masters,
      [areaId]: {
        passed: passed || before?.passed === true,
        attempts: (before?.attempts ?? 0) + 1,
        bestScore: Math.max(before?.bestScore ?? 0, score.percent),
      },
    },
  };
  let questXp = 0;
  if (passed) ({ state: next, questXp } = withQuestEvent(next, { type: 'masterPassed', areaId }));
  return { state: next, xp: xp + questXp, score, passed, firstPass };
}

export function applyDailyComplete(state: GameState, day: DayKey, now: Date): EngineResult {
  const streak = registerActivity(state.streak, toDayKey(now));
  if (state.dailyCompleted.includes(day)) return { state: { ...state, streak }, xp: 0 };
  const base = { ...state, streak, dailyCompleted: [...state.dailyCompleted, day], xp: state.xp + XP.dailyChallenge };
  const { state: next, questXp } = withQuestEvent(base, { type: 'dailyComplete' });
  return { state: next, xp: XP.dailyChallenge + questXp };
}

export function applyReviewSessionComplete(state: GameState, now: Date): GameState {
  return { ...state, streak: registerActivity(state.streak, toDayKey(now)) };
}

export function finalizeBadges(state: GameState, graph: ContentGraph, now: Date): { state: GameState; newBadges: BadgeId[] } {
  return awardBadges(state, graph, now.toISOString());
}
