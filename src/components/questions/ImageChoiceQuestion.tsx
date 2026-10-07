import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { SceneView } from '@/components/scene/SceneView';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useFeedback } from '@/hooks/useFeedback';
import { useI18n } from '@/hooks/useI18n';
import type { ImageChoiceQuestion as ImageChoice, SkyKind } from '@/models';
import { evaluateAnswer } from '@/services/quiz';
import { colors, radius, spacing } from '@/theme';
import { hashString, seededRandom, shuffle } from '@/utils/random';

import type { QuestionComponentProps } from './types';

const SKY_FOR: Partial<Record<string, SkyKind>> = { whale: 'sea', rain: 'storm', waves: 'sea', fire: 'dusk', cave: 'night' };

/** Image selection: tap the illustration that answers the question. */
export function ImageChoiceQuestion({ question, onAnswered, locked }: QuestionComponentProps<ImageChoice>) {
  const { l, t } = useI18n();
  const feedback = useFeedback();
  const options = useMemo(() => shuffle(question.options, seededRandom(hashString(question.id))), [question.id, question.options]);
  const [picked, setPicked] = useState<string | null>(null);

  const choose = (id: string) => {
    if (picked || locked) return;
    feedback.tap();
    setPicked(id);
    const correct = question.options.find((o) => o.id === question.correctOptionId);
    onAnswered({
      correct: evaluateAnswer(question, { type: 'option', optionId: id }),
      correctAnswer: correct ? l(correct.label) : '',
    });
  };

  return (
    <View style={styles.grid}>
      {options.map((option) => {
        const isCorrect = picked !== null && option.id === question.correctOptionId;
        const isWrong = picked === option.id && option.id !== question.correctOptionId;
        const state = isCorrect ? `, ${t('a11y.correct')}` : isWrong ? `, ${t('a11y.incorrect')}` : '';
        return (
          <Pressable
            key={option.id}
            onPress={() => choose(option.id)}
            disabled={!!picked || locked}
            accessibilityRole="button"
            accessibilityLabel={`${l(option.label)}${state}`}
            style={[styles.tile, isCorrect && styles.right, isWrong && styles.wrong, picked && !isCorrect && !isWrong && styles.dim]}
          >
            <SceneView scene={{ sky: SKY_FOR[option.element] ?? 'day', elements: [option.element] }} height={90} rounded={false} />
            <View style={styles.label}>
              <AppText variant="small" style={styles.flex} numberOfLines={2}>
                {l(option.label)}
              </AppText>
              {isCorrect ? <Icon name="check" size={18} color={colors.success} strokeWidth={3} /> : null}
              {isWrong ? <Icon name="close" size={18} color={colors.error} strokeWidth={3} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between' },
  tile: {
    width: '48.5%',
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  right: { borderColor: colors.success, backgroundColor: colors.successSoft },
  wrong: { borderColor: colors.error, backgroundColor: colors.errorSoft },
  dim: { opacity: 0.6 },
  label: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: spacing.sm, minHeight: 44 },
  flex: { flex: 1 },
});
