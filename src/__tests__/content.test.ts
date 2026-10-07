import { AREAS, CONTENT, getQuestion, QUESTIONS, testQuestionsOfArea, UNITS, unitsOfArea } from '@/content';
import { LANGUAGES, type LocalizedText, type Question } from '@/models';
import { MASTER_QUESTIONS } from '@/services/quiz';
import { isAreaUnlocked } from '@/services/progression';

/** Collects every LocalizedText-looking object inside a value. */
function localizedTexts(value: unknown, path = ''): { path: string; text: LocalizedText }[] {
  if (!value || typeof value !== 'object') return [];
  const obj = value as Record<string, unknown>;
  if ('en' in obj && 'de' in obj && 'bs' in obj) return [{ path, text: obj as unknown as LocalizedText }];
  return Object.entries(obj).flatMap(([k, v]) => localizedTexts(v, `${path}.${k}`));
}

function checkQuestionShape(q: Question) {
  switch (q.type) {
    case 'multipleChoice':
    case 'scenario':
    case 'fillBlank':
    case 'imageChoice': {
      const ids = q.options.map((o) => o.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids).toContain(q.correctOptionId);
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      if (q.type === 'fillBlank') for (const lang of LANGUAGES) expect(q.sentence[lang]).toContain('___');
      break;
    }
    case 'ordering':
      expect(q.items.length).toBeGreaterThanOrEqual(3);
      break;
    case 'matching':
    case 'memory':
      expect(q.pairs.length).toBeGreaterThanOrEqual(2);
      break;
    case 'categorize': {
      const cats = q.categories.map((c) => c.id);
      expect(cats.length).toBeGreaterThanOrEqual(2);
      for (const item of q.items) expect(cats).toContain(item.categoryId);
      break;
    }
    case 'trueFalse':
      expect(typeof q.correct).toBe('boolean');
      break;
  }
}

describe('content integrity', () => {
  it('has the eight areas in order with a reachable unlock chain', () => {
    expect(AREAS.map((a) => a.id)).toEqual(['salah', 'quran', 'seerah', 'prophets', 'akhlaq', 'ramadan', 'history', 'arabic']);
    expect(AREAS[0].unlock).toBeNull();
    for (const area of AREAS.slice(1)) {
      expect(area.unlock).not.toBeNull();
      expect(unitsOfArea(area.unlock!.areaId).length).toBeGreaterThanOrEqual(area.unlock!.unitsCompleted);
    }
    // Completing everything opens every area.
    const all = Object.fromEntries(UNITS.map((u) => [u.id, { completed: true, attempts: 1, bestScore: 100, completedAt: '' }]));
    expect(AREAS.every((a) => isAreaUnlocked(a, all, CONTENT))).toBe(true);
  });

  it('uses unique ids everywhere', () => {
    const unitIds = UNITS.map((u) => u.id);
    expect(new Set(unitIds).size).toBe(unitIds.length);
    const questionIds = QUESTIONS.map((q) => q.id);
    expect(new Set(questionIds).size).toBe(questionIds.length);
  });

  it('gives every unit a lesson, a practice question, test questions and sources', () => {
    for (const unit of UNITS) {
      expect(unit.lesson.length).toBeGreaterThan(0);
      expect(unit.sources.length).toBeGreaterThan(0);
      expect(unit.questions.map((q) => q.id)).toContain(unit.practiceId);
      expect(unit.testIds.length).toBeGreaterThanOrEqual(3);
      expect(unit.testIds).not.toContain(unit.practiceId);
      for (const id of unit.testIds) expect(unit.questions.map((q) => q.id)).toContain(id);
      for (const q of unit.questions) expect(q.areaId).toBe(unit.areaId);
    }
  });

  it('has enough test questions in every area for a Master Challenge', () => {
    for (const area of AREAS) expect(testQuestionsOfArea(area.id).length).toBeGreaterThanOrEqual(MASTER_QUESTIONS);
  });

  it('has valid question shapes and topics', () => {
    for (const q of QUESTIONS) {
      expect(q.topic.length).toBeGreaterThan(0);
      checkQuestionShape(q);
      expect(getQuestion(q.id)).toBe(q);
    }
  });

  it('uses all the required question types', () => {
    const types = new Set(QUESTIONS.map((q) => q.type));
    for (const type of ['multipleChoice', 'trueFalse', 'matching', 'ordering', 'memory', 'imageChoice', 'scenario', 'fillBlank', 'categorize']) {
      expect(types).toContain(type);
    }
  });

  it('is fully translated', () => {
    for (const item of [...AREAS, ...UNITS]) {
      for (const { path, text } of localizedTexts(item)) {
        for (const lang of LANGUAGES) {
          expect({ path, lang, ok: typeof text[lang] === 'string' && text[lang].trim().length > 0 }).toEqual({ path, lang, ok: true });
        }
      }
    }
  });

  it('never invents source links', () => {
    for (const unit of UNITS) {
      for (const source of unit.sources) expect(JSON.stringify(source)).not.toMatch(/https?:\/\//);
    }
  });
});
