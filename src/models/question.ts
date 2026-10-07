import type { LocalizedText, SourceRef } from './common';
import type { AreaId } from './content';
import type { SceneElement } from './scene';

export type QuestionType =
  | 'multipleChoice'
  | 'trueFalse'
  | 'matching'
  | 'ordering'
  | 'memory'
  | 'imageChoice'
  | 'scenario'
  | 'fillBlank'
  | 'categorize';

interface QuestionBase {
  id: string;
  areaId: AreaId;
  /** Topic key used to find weak topics in the review system. */
  topic: string;
  prompt: LocalizedText;
  explanation: LocalizedText;
  sources?: SourceRef[];
}

export interface AnswerOption {
  id: string;
  text: LocalizedText;
}

export interface MultipleChoiceQuestion extends QuestionBase {
  type: 'multipleChoice';
  options: AnswerOption[];
  correctOptionId: string;
}

export interface TrueFalseQuestion extends QuestionBase {
  type: 'trueFalse';
  correct: boolean;
}

export interface MatchingPair {
  id: string;
  left: LocalizedText;
  right: LocalizedText;
}

export interface MatchingQuestion extends QuestionBase {
  type: 'matching';
  pairs: MatchingPair[];
}

export interface MemoryQuestion extends QuestionBase {
  type: 'memory';
  pairs: MatchingPair[];
}

/** Items are listed in the correct order; the UI shuffles them. */
export interface OrderingQuestion extends QuestionBase {
  type: 'ordering';
  items: AnswerOption[];
}

export interface ImageOption {
  id: string;
  element: SceneElement;
  label: LocalizedText;
}

/** Image selection: pick the one illustration that answers the question. */
export interface ImageChoiceQuestion extends QuestionBase {
  type: 'imageChoice';
  options: ImageOption[];
  correctOptionId: string;
}

export interface ScenarioOption extends AnswerOption {
  feedback: LocalizedText;
}

export interface ScenarioQuestion extends QuestionBase {
  type: 'scenario';
  options: ScenarioOption[];
  correctOptionId: string;
}

/**
 * Fill in the blank: `sentence` contains "___" where the missing word goes.
 * Options are short words/phrases; one is correct.
 */
export interface FillBlankQuestion extends QuestionBase {
  type: 'fillBlank';
  sentence: LocalizedText;
  options: AnswerOption[];
  correctOptionId: string;
}

export interface Category {
  id: string;
  label: LocalizedText;
}

export interface CategorizeItem {
  id: string;
  text: LocalizedText;
  categoryId: string;
}

/** Categorization: sort every item into the right group. */
export interface CategorizeQuestion extends QuestionBase {
  type: 'categorize';
  categories: Category[];
  items: CategorizeItem[];
}

export type Question =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | MatchingQuestion
  | OrderingQuestion
  | MemoryQuestion
  | ImageChoiceQuestion
  | ScenarioQuestion
  | FillBlankQuestion
  | CategorizeQuestion;

export type AnswerInput =
  | { type: 'option'; optionId: string }
  | { type: 'boolean'; value: boolean }
  | { type: 'order'; ids: string[] }
  | { type: 'pairs'; mistakes: number }
  | { type: 'memory'; moves: number }
  | { type: 'categories'; assignment: Record<string, string> };
