import type { LocalizedText, SourceRef } from './common';
import type { Question } from './question';
import type { SceneSpec } from './scene';

export type AreaId = 'salah' | 'quran' | 'seerah' | 'prophets' | 'akhlaq' | 'ramadan' | 'history' | 'arabic';

/** A location on the RPG world map; each represents one learning category. */
export interface Area {
  id: AreaId;
  order: number;
  name: LocalizedText;
  /** Knowledge stat shown on the profile (e.g. "Salah", "Seerah"). */
  statName: LocalizedText;
  description: LocalizedText;
  scene: SceneSpec;
  /** Position on the world map (0..100 percent). */
  map: { x: number; y: number };
  /** Units of the previous area that must be completed to unlock this area. */
  unlock: { areaId: AreaId; unitsCompleted: number } | null;
}

export interface LessonSection {
  heading?: LocalizedText;
  body: LocalizedText;
  arabic?: string;
  transliteration?: string;
}

/**
 * A learning unit: LEARN (lesson) → PRACTICE (one easy interaction, not scored)
 * → TEST (scored questions) → EXPLANATION (summary) → REWARD.
 */
export interface Unit {
  id: string;
  areaId: AreaId;
  order: number;
  title: LocalizedText;
  description: LocalizedText;
  difficulty: 1 | 2 | 3;
  lesson: LessonSection[];
  /** Shown when scholars hold different valid positions. */
  differenceNote?: LocalizedText;
  practiceId: string;
  testIds: string[];
  /** Short "why it matters" summary shown after the test. */
  explanation: LocalizedText;
  sources: SourceRef[];
  questions: Question[];
}

export type BadgeId =
  | 'first_lesson'
  | 'first_perfect_quiz'
  | 'learner_7'
  | 'learner_30'
  | 'salah_scholar'
  | 'quran_explorer'
  | 'seerah_explorer'
  | 'akhlaq_champion'
  | 'arabic_beginner'
  | 'knowledge_seeker'
  | 'knowledge_master';

export type QuestKind = 'daily' | 'learning' | 'knowledge' | 'review' | 'challenge';
