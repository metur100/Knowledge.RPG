import type { Question } from '@/models';
import { evaluateAnswer, MASTER_PASS_PERCENT, MASTER_QUESTIONS, masterPassed, scoreQuiz } from '@/services/quiz';

const text = { en: 'x', de: 'x', bs: 'x' };
const base = { id: 'q', areaId: 'salah' as const, topic: 't', prompt: text, explanation: text };

describe('evaluateAnswer', () => {
  it('handles option-based questions', () => {
    const options = [
      { id: 'a', text },
      { id: 'b', text },
    ];
    const types: Question[] = [
      { ...base, type: 'multipleChoice', options, correctOptionId: 'b' },
      { ...base, type: 'scenario', options: options.map((o) => ({ ...o, feedback: text })), correctOptionId: 'b' },
      { ...base, type: 'fillBlank', sentence: { en: 'a ___', de: 'a ___', bs: 'a ___' }, options, correctOptionId: 'b' },
      {
        ...base,
        type: 'imageChoice',
        options: [
          { id: 'a', element: 'mosque', label: text },
          { id: 'b', element: 'kaaba', label: text },
        ],
        correctOptionId: 'b',
      },
    ];
    for (const q of types) {
      expect(evaluateAnswer(q, { type: 'option', optionId: 'b' })).toBe(true);
      expect(evaluateAnswer(q, { type: 'option', optionId: 'a' })).toBe(false);
      expect(evaluateAnswer(q, { type: 'boolean', value: true })).toBe(false);
    }
  });

  it('handles true/false', () => {
    const q: Question = { ...base, type: 'trueFalse', correct: false };
    expect(evaluateAnswer(q, { type: 'boolean', value: false })).toBe(true);
    expect(evaluateAnswer(q, { type: 'boolean', value: true })).toBe(false);
  });

  it('handles ordering', () => {
    const q: Question = { ...base, type: 'ordering', items: ['1', '2', '3'].map((id) => ({ id, text })) };
    expect(evaluateAnswer(q, { type: 'order', ids: ['1', '2', '3'] })).toBe(true);
    expect(evaluateAnswer(q, { type: 'order', ids: ['2', '1', '3'] })).toBe(false);
    expect(evaluateAnswer(q, { type: 'order', ids: ['1', '2'] })).toBe(false);
  });

  it('allows one mistake in matching', () => {
    const q: Question = { ...base, type: 'matching', pairs: [{ id: 'p', left: text, right: text }] };
    expect(evaluateAnswer(q, { type: 'pairs', mistakes: 1 })).toBe(true);
    expect(evaluateAnswer(q, { type: 'pairs', mistakes: 2 })).toBe(false);
  });

  it('handles categorization', () => {
    const q: Question = {
      ...base,
      type: 'categorize',
      categories: [
        { id: 'fard', label: text },
        { id: 'sunnah', label: text },
      ],
      items: [
        { id: 'i1', text, categoryId: 'fard' },
        { id: 'i2', text, categoryId: 'sunnah' },
      ],
    };
    expect(evaluateAnswer(q, { type: 'categories', assignment: { i1: 'fard', i2: 'sunnah' } })).toBe(true);
    expect(evaluateAnswer(q, { type: 'categories', assignment: { i1: 'sunnah', i2: 'sunnah' } })).toBe(false);
    expect(evaluateAnswer(q, { type: 'categories', assignment: { i1: 'fard' } })).toBe(false);
  });
});

describe('scoring', () => {
  it('scores quizzes', () => {
    expect(scoreQuiz([true, true, true, true])).toMatchObject({ correct: 4, total: 4, percent: 100, stars: 3 });
    expect(scoreQuiz([true, true, true, false])).toMatchObject({ percent: 75, stars: 2 });
    expect(scoreQuiz([true, false, false, false])).toMatchObject({ percent: 25, stars: 1 });
  });

  it('passes the Master Challenge at 70 %', () => {
    expect(MASTER_QUESTIONS).toBe(10);
    expect(MASTER_PASS_PERCENT).toBe(70);
    const results = (correct: number) => Array.from({ length: 10 }, (_, i) => i < correct);
    expect(masterPassed(results(7))).toBe(true);
    expect(masterPassed(results(6))).toBe(false);
    expect(masterPassed([])).toBe(false);
  });
});
