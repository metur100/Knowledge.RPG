import type { Area, AreaId, GameState, MasterProgress, Question, Unit, UnitProgress } from '@/models';
import { seededRandom, shuffle } from '@/utils/random';
import { MASTER_QUESTIONS } from './quiz';

export interface ContentGraph {
  areas: readonly Area[];
  units: readonly Unit[];
}

type UnitMap = Record<string, UnitProgress>;
type MasterMap = Partial<Record<AreaId, MasterProgress>>;

export type UnitStatus = 'locked' | 'available' | 'completed';

export const unitsIn = (areaId: AreaId, graph: ContentGraph) =>
  graph.units.filter((u) => u.areaId === areaId).sort((a, b) => a.order - b.order);

export function completedUnitsIn(areaId: AreaId, units: UnitMap, graph: ContentGraph): number {
  return unitsIn(areaId, graph).filter((u) => units[u.id]?.completed).length;
}

/** Areas unlock progressively along the map. */
export function isAreaUnlocked(area: Area, units: UnitMap, graph: ContentGraph): boolean {
  if (!area.unlock) return true;
  const previous = graph.areas.find((a) => a.id === area.unlock!.areaId);
  if (!previous || !isAreaUnlocked(previous, units, graph)) return false;
  return completedUnitsIn(area.unlock.areaId, units, graph) >= area.unlock.unitsCompleted;
}

/** Units inside an area unlock one after another. */
export function unitStatus(unit: Unit, units: UnitMap, graph: ContentGraph): UnitStatus {
  if (units[unit.id]?.completed) return 'completed';
  const area = graph.areas.find((a) => a.id === unit.areaId);
  if (!area || !isAreaUnlocked(area, units, graph)) return 'locked';
  const list = unitsIn(unit.areaId, graph);
  const index = list.findIndex((u) => u.id === unit.id);
  return index <= 0 || units[list[index - 1].id]?.completed ? 'available' : 'locked';
}

/** The Master Challenge opens when every unit of the area is completed. */
export function isMasterUnlocked(areaId: AreaId, units: UnitMap, graph: ContentGraph): boolean {
  const list = unitsIn(areaId, graph);
  return list.length > 0 && list.every((u) => units[u.id]?.completed);
}

export function isMasterPassed(areaId: AreaId, masters: MasterMap): boolean {
  return masters[areaId]?.passed === true;
}

/** The next unit to learn (first available, in map order). */
export function nextUnit(units: UnitMap, graph: ContentGraph): Unit | null {
  for (const area of [...graph.areas].sort((a, b) => a.order - b.order)) {
    for (const unit of unitsIn(area.id, graph)) {
      if (unitStatus(unit, units, graph) === 'available') return unit;
    }
  }
  return null;
}

/**
 * Picks the Master Challenge questions: weak (pending review) questions first, then the rest,
 * varied per attempt but stable within one attempt.
 */
export function pickMasterQuestions(pool: readonly Question[], state: GameState, attempt: number): Question[] {
  const random = seededRandom(attempt * 7919 + pool.length);
  const weak = pool.filter((q) => state.review[q.id] && !state.review[q.id].mastered);
  const rest = pool.filter((q) => !weak.includes(q));
  return [...shuffle(weak, random), ...shuffle(rest, random)].slice(0, MASTER_QUESTIONS);
}

/**
 * Knowledge stat (0..100) for an area: share of its test questions the player has answered
 * correctly and is not currently struggling with (not pending in review).
 * It represents covered and understood content, never a "religious skill".
 */
export function knowledgePercent(pool: readonly Question[], state: GameState): number {
  if (pool.length === 0) return 0;
  const understood = pool.filter(
    (q) => state.correctlyAnswered.includes(q.id) && !(state.review[q.id] && !state.review[q.id].mastered),
  ).length;
  return Math.round((understood / pool.length) * 100);
}
