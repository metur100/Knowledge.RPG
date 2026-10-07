import type { AreaId, BadgeId, GameState } from '@/models';
import type { ContentGraph } from './progression';

export interface BadgeDefinition {
  id: BadgeId;
  icon: string;
  color: string;
}

export const BADGES: readonly BadgeDefinition[] = [
  { id: 'first_lesson', icon: 'book', color: '#3BA99C' },
  { id: 'first_perfect_quiz', icon: 'star', color: '#F2B544' },
  { id: 'learner_7', icon: 'flame', color: '#F28C28' },
  { id: 'learner_30', icon: 'flame', color: '#D9480F' },
  { id: 'salah_scholar', icon: 'mosque', color: '#4C7BD9' },
  { id: 'quran_explorer', icon: 'quran', color: '#2E8B57' },
  { id: 'seerah_explorer', icon: 'map', color: '#C8743A' },
  { id: 'akhlaq_champion', icon: 'heart', color: '#E0607E' },
  { id: 'arabic_beginner', icon: 'letter', color: '#D9534F' },
  { id: 'knowledge_seeker', icon: 'sparkle', color: '#6E43AE' },
  { id: 'knowledge_master', icon: 'trophy', color: '#B8860B' },
];

const MASTER_BADGES: Partial<Record<BadgeId, AreaId>> = {
  salah_scholar: 'salah',
  quran_explorer: 'quran',
  seerah_explorer: 'seerah',
  akhlaq_champion: 'akhlaq',
  arabic_beginner: 'arabic',
};

export const KNOWLEDGE_SEEKER_ANSWERS = 50;

export function isBadgeEarned(id: BadgeId, state: GameState, graph: ContentGraph): boolean {
  const area = MASTER_BADGES[id];
  if (area) return state.masters[area]?.passed === true;
  switch (id) {
    case 'first_lesson':
      return Object.values(state.units).some((u) => u.completed);
    case 'first_perfect_quiz':
      return state.stats.perfectQuizzes > 0;
    case 'learner_7':
      return state.streak.longest >= 7;
    case 'learner_30':
      return state.streak.longest >= 30;
    case 'knowledge_seeker':
      return state.correctlyAnswered.length >= KNOWLEDGE_SEEKER_ANSWERS;
    case 'knowledge_master':
      return graph.areas.every((a) => state.masters[a.id]?.passed);
    default:
      return false;
  }
}

export function awardBadges(state: GameState, graph: ContentGraph, nowIso: string): { state: GameState; newBadges: BadgeId[] } {
  const newBadges = BADGES.map((b) => b.id).filter((id) => !state.badges[id] && isBadgeEarned(id, state, graph));
  if (newBadges.length === 0) return { state, newBadges };
  const badges = { ...state.badges };
  for (const id of newBadges) badges[id] = nowIso;
  return { state: { ...state, badges }, newBadges };
}
