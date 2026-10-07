import type { DayKey, Language } from './common';
import type { AreaId, BadgeId, QuestKind } from './content';

export type SkinTone = 0 | 1 | 2 | 3 | 4 | 5;
export type HairStyle = 'short' | 'curly' | 'long' | 'buzz' | 'bun';
export type Headwear = 'none' | 'kufi' | 'hijab' | 'cap';
export type Outfit = 'thobe' | 'hoodie' | 'jacket' | 'abaya';
export type Accessory = 'none' | 'glasses' | 'backpack' | 'scarf' | 'lantern';

export interface Character {
  skinTone: SkinTone;
  hairStyle: HairStyle;
  hairColor: number;
  headwear: Headwear;
  outfit: Outfit;
  outfitColor: number;
  accessory: Accessory;
}

export interface Settings {
  language: Language;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  /** Read lesson text aloud with the device's text-to-speech (optional narration). */
  narrationEnabled: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  highContrast: boolean;
}

export interface ReviewItem {
  questionId: string;
  topic: string;
  box: number;
  correctCount: number;
  incorrectCount: number;
  lastSeen: string;
  nextReviewDate: string;
  mastered: boolean;
}

export interface StreakState {
  current: number;
  longest: number;
  lastActiveDay: DayKey | null;
}

export interface UnitProgress {
  completed: boolean;
  bestScore: number;
  attempts: number;
  completedAt?: string;
}

export interface MasterProgress {
  passed: boolean;
  bestScore: number;
  attempts: number;
}

/** A quest of the day. Quests are regenerated per calendar day from the player's situation. */
export interface Quest {
  id: string;
  kind: QuestKind;
  /** What counts towards the quest. */
  goal:
    | { type: 'dailyChallenge' }
    | { type: 'completeUnit'; unitId: string }
    | { type: 'correctAnswers'; areaId: AreaId; count: number }
    | { type: 'reviewAnswers'; count: number }
    | { type: 'passMaster'; areaId: AreaId };
  progress: number;
  target: number;
  completed: boolean;
  xp: number;
}

export interface Stats {
  questionsAnswered: number;
  correctAnswers: number;
  reviewsCorrect: number;
  perfectQuizzes: number;
}

export interface GameState {
  version: number;
  onboarded: boolean;
  name: string;
  character: Character;
  settings: Settings;
  xp: number;
  units: Record<string, UnitProgress>;
  masters: Partial<Record<AreaId, MasterProgress>>;
  /** Questions answered correctly at least once (XP is granted once per question). */
  correctlyAnswered: string[];
  badges: Partial<Record<BadgeId, string>>;
  streak: StreakState;
  review: Record<string, ReviewItem>;
  dailyCompleted: DayKey[];
  questDay: DayKey | null;
  quests: Quest[];
  stats: Stats;
}
