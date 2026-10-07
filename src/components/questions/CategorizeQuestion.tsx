import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useFeedback } from '@/hooks/useFeedback';
import { useI18n } from '@/hooks/useI18n';
import type { CategorizeQuestion as Categorize } from '@/models';
import { evaluateAnswer } from '@/services/quiz';
import { colors, radius, spacing } from '@/theme';
import { hashString, seededRandom, shuffle } from '@/utils/random';

import type { QuestionComponentProps } from './types';

/**
 * Categorization: pick an item, then tap the group it belongs to. Tapping a placed item
 * returns it to the pool. Uses taps rather than drag-and-drop for accessibility.
 */
export function CategorizeQuestion({ question, onAnswered, locked }: QuestionComponentProps<Categorize>) {
  const { t, l } = useI18n();
  const feedback = useFeedback();
  const items = useMemo(() => shuffle(question.items, seededRandom(hashString(question.id))), [question.id, question.items]);
  const [assignment, setAssignment] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const unplaced = items.filter((i) => !assignment[i.id]);

  const place = (categoryId: string) => {
    if (!selected || submitted || locked) return;
    feedback.tap();
    setAssignment((a) => ({ ...a, [selected]: categoryId }));
    setSelected(null);
  };

  const unplace = (itemId: string) => {
    if (submitted || locked) return;
    setAssignment((a) => {
      const next = { ...a };
      delete next[itemId];
      return next;
    });
  };

  const submit = () => {
    setSubmitted(true);
    onAnswered({
      correct: evaluateAnswer(question, { type: 'categories', assignment }),
      correctAnswer: question.categories
        .map((c) => `${l(c.label)}: ${question.items.filter((i) => i.categoryId === c.id).map((i) => l(i.text)).join(', ')}`)
        .join(' · '),
    });
  };

  return (
    <View style={styles.root}>
      <AppText variant="small" color={colors.textMuted}>
        {t('q.categorize.hint')}
      </AppText>
      {unplaced.length > 0 ? (
        <View style={styles.pool}>
          {unplaced.map((item) => {
            const active = selected === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  feedback.tap();
                  setSelected(active ? null : item.id);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${l(item.text)}${active ? `, ${t('a11y.selected')}` : ''}`}
                style={[styles.chip, active && styles.chipActive]}
              >
                <AppText variant="bodyBold" color={active ? colors.textOnDark : colors.text}>
                  {l(item.text)}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {question.categories.map((category) => {
        const placed = items.filter((i) => assignment[i.id] === category.id);
        return (
          <Pressable
            key={category.id}
            onPress={() => place(category.id)}
            disabled={!selected || submitted || locked}
            accessibilityRole="button"
            accessibilityLabel={`${l(category.label)}: ${placed.map((p) => l(p.text)).join(', ')}`}
            style={[styles.bucket, selected && !submitted && styles.bucketReady]}
          >
            <AppText variant="label" color={colors.primaryDark}>
              {l(category.label).toUpperCase()}
            </AppText>
            <View style={styles.placed}>
              {placed.map((item) => {
                const right = submitted && item.categoryId === category.id;
                const wrong = submitted && item.categoryId !== category.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => unplace(item.id)}
                    disabled={submitted || locked}
                    accessibilityRole="button"
                    accessibilityLabel={`${l(item.text)}${right ? `, ${t('a11y.correct')}` : wrong ? `, ${t('a11y.incorrect')}` : ''}`}
                    style={[styles.placedChip, right && styles.right, wrong && styles.wrong]}
                  >
                    <AppText variant="small">{l(item.text)}</AppText>
                    {right ? <Icon name="check" size={14} color={colors.success} strokeWidth={3} /> : null}
                    {wrong ? <Icon name="close" size={14} color={colors.error} strokeWidth={3} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        );
      })}

      {!submitted ? <Button label={t('common.check')} onPress={submit} disabled={unplaced.length > 0 || locked} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  pool: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: '#F0D49A',
    backgroundColor: colors.goldSoft,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  bucket: {
    minHeight: 84,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.card,
  },
  bucketReady: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  placed: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  placedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.cardAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  right: { borderColor: colors.success, backgroundColor: colors.successSoft },
  wrong: { borderColor: colors.error, backgroundColor: colors.errorSoft },
});
