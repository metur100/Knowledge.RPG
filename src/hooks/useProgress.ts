import { useMemo } from 'react';

import { AREAS, CONTENT, testQuestionsOfArea } from '@/content';
import type { AreaId } from '@/models';
import { completedUnitsIn, isAreaUnlocked, isMasterPassed, knowledgePercent, nextUnit, unitsIn } from '@/services/progression';
import { dueItems } from '@/services/review';
import { displayedStreak, isActiveToday } from '@/services/streak';
import { levelInfo } from '@/services/xp';
import { useGameStore } from '@/store/gameStore';
import { toDayKey } from '@/utils/date';

export interface AreaProgress {
  id: AreaId;
  unlocked: boolean;
  completed: number;
  total: number;
  knowledge: number;
  mastered: boolean;
}

/** Derived progress values shared by the home, map and profile screens. */
export function useProgress() {
  const game = useGameStore((s) => s.game);
  return useMemo(() => {
    const today = toDayKey(new Date());
    const areas: AreaProgress[] = AREAS.map((area) => ({
      id: area.id,
      unlocked: isAreaUnlocked(area, game.units, CONTENT),
      completed: completedUnitsIn(area.id, game.units, CONTENT),
      total: unitsIn(area.id, CONTENT).length,
      knowledge: knowledgePercent(testQuestionsOfArea(area.id), game),
      mastered: isMasterPassed(area.id, game.masters),
    }));
    return {
      today,
      level: levelInfo(game.xp),
      streak: displayedStreak(game.streak, today),
      activeToday: isActiveToday(game.streak, today),
      next: nextUnit(game.units, CONTENT),
      areas,
      dueCount: dueItems(game.review, new Date().toISOString()).length,
      dailyDone: game.dailyCompleted.includes(today),
      unitsCompleted: Object.values(game.units).filter((u) => u.completed).length,
      mastersPassed: areas.filter((a) => a.mastered).length,
    };
  }, [game]);
}
