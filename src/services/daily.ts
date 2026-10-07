import type { DayKey, Question } from '@/models';
import { dayNumber } from '@/utils/date';
import { seededRandom, shuffle } from '@/utils/random';

export type DailyKind = 'question' | 'scenario' | 'miniGame' | 'memory' | 'review';

export const DAILY_ROTATION: readonly DailyKind[] = ['question', 'scenario', 'miniGame', 'memory', 'review'];

export interface DailyChallenge {
  day: DayKey;
  kind: DailyKind;
  questionIds: string[];
}

const QUICK = new Set<Question['type']>(['multipleChoice', 'trueFalse', 'fillBlank', 'imageChoice']);
const GAMES = new Set<Question['type']>(['ordering', 'matching', 'categorize']);

/**
 * One challenge per calendar day from local content. "Review" days use a question the player
 * struggled with when there is one; otherwise every kind falls back to a quick question.
 */
export function dailyChallengeFor(day: DayKey, pool: readonly Question[], reviewIds: readonly string[]): DailyChallenge {
  const n = dayNumber(day);
  const random = seededRandom(n * 104729 + 13);
  const pick = (items: readonly Question[]) => items[Math.floor(random() * items.length)];
  const kind = DAILY_ROTATION[((n % DAILY_ROTATION.length) + DAILY_ROTATION.length) % DAILY_ROTATION.length];
  const quick = pool.filter((q) => QUICK.has(q.type));
  const byType = (types: Set<Question['type']> | Question['type']) =>
    pool.filter((q) => (typeof types === 'string' ? q.type === types : types.has(q.type)));

  if (kind === 'review') {
    const pending = shuffle(reviewIds, random).filter((id) => pool.some((q) => q.id === id));
    if (pending.length > 0) return { day, kind, questionIds: pending.slice(0, 3) };
  }
  if (kind === 'scenario' && byType('scenario').length) return { day, kind, questionIds: [pick(byType('scenario')).id] };
  if (kind === 'miniGame' && byType(GAMES).length) return { day, kind, questionIds: [pick(byType(GAMES)).id] };
  if (kind === 'memory' && byType('memory').length) return { day, kind, questionIds: [pick(byType('memory')).id] };
  return { day, kind: 'question', questionIds: [pick(quick).id] };
}
