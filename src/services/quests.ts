import type { AreaId, DayKey, GameState, Quest } from '@/models';
import { dayNumber } from '@/utils/date';
import { type ContentGraph, isAreaUnlocked, isMasterPassed, isMasterUnlocked, nextUnit } from './progression';

export const QUEST_XP = { daily: 15, learning: 20, knowledge: 20, review: 20, challenge: 30 } as const;

/**
 * Builds today's quest log from the player's situation. At most five small quests per day,
 * no timers and no penalties – quests guide learning, they don't pressure.
 */
export function generateQuests(day: DayKey, state: GameState, graph: ContentGraph): Quest[] {
  const quests: Quest[] = [
    { id: `${day}-daily`, kind: 'daily', goal: { type: 'dailyChallenge' }, progress: 0, target: 1, completed: false, xp: QUEST_XP.daily },
  ];

  const unit = nextUnit(state.units, graph);
  if (unit) {
    quests.push({
      id: `${day}-learning`,
      kind: 'learning',
      goal: { type: 'completeUnit', unitId: unit.id },
      progress: 0,
      target: 1,
      completed: false,
      xp: QUEST_XP.learning,
    });
  }

  const open = graph.areas.filter((a) => isAreaUnlocked(a, state.units, graph));
  if (open.length > 0) {
    const area: AreaId = unit?.areaId ?? open[dayNumber(day) % open.length].id;
    quests.push({
      id: `${day}-knowledge`,
      kind: 'knowledge',
      goal: { type: 'correctAnswers', areaId: area, count: 5 },
      progress: 0,
      target: 5,
      completed: false,
      xp: QUEST_XP.knowledge,
    });
  }

  const pending = Object.values(state.review).filter((r) => !r.mastered).length;
  if (pending > 0) {
    const count = Math.min(5, pending);
    quests.push({
      id: `${day}-review`,
      kind: 'review',
      goal: { type: 'reviewAnswers', count },
      progress: 0,
      target: count,
      completed: false,
      xp: QUEST_XP.review,
    });
  }

  const master = graph.areas.find(
    (a) => isMasterUnlocked(a.id, state.units, graph) && !isMasterPassed(a.id, state.masters),
  );
  if (master) {
    quests.push({
      id: `${day}-challenge`,
      kind: 'challenge',
      goal: { type: 'passMaster', areaId: master.id },
      progress: 0,
      target: 1,
      completed: false,
      xp: QUEST_XP.challenge,
    });
  }
  return quests;
}

export type QuestEvent =
  | { type: 'answer'; areaId: AreaId; correct: boolean; review: boolean }
  | { type: 'unitComplete'; unitId: string }
  | { type: 'dailyComplete' }
  | { type: 'masterPassed'; areaId: AreaId };

/** Applies an event to the quest log and returns the updated quests plus XP from newly completed ones. */
export function progressQuests(quests: readonly Quest[], event: QuestEvent): { quests: Quest[]; xp: number; completed: Quest[] } {
  const completed: Quest[] = [];
  const next = quests.map((quest) => {
    if (quest.completed) return quest;
    let gain = 0;
    const goal = quest.goal;
    if (goal.type === 'dailyChallenge' && event.type === 'dailyComplete') gain = 1;
    if (goal.type === 'completeUnit' && event.type === 'unitComplete' && event.unitId === goal.unitId) gain = 1;
    if (goal.type === 'correctAnswers' && event.type === 'answer' && event.correct && !event.review && event.areaId === goal.areaId) gain = 1;
    if (goal.type === 'reviewAnswers' && event.type === 'answer' && event.review && event.correct) gain = 1;
    if (goal.type === 'passMaster' && event.type === 'masterPassed' && event.areaId === goal.areaId) gain = 1;
    if (gain === 0) return quest;
    const progress = Math.min(quest.target, quest.progress + gain);
    const updated = { ...quest, progress, completed: progress >= quest.target };
    if (updated.completed) completed.push(updated);
    return updated;
  });
  return { quests: next, xp: completed.reduce((sum, q) => sum + q.xp, 0), completed };
}
