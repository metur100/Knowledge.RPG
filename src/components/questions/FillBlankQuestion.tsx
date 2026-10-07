import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AnswerOption, type OptionState } from '@/components/game/AnswerOption';
import { AppText } from '@/components/ui/AppText';
import { useI18n } from '@/hooks/useI18n';
import type { FillBlankQuestion as FillBlank } from '@/models';
import { evaluateAnswer } from '@/services/quiz';
import { colors, radius, spacing } from '@/theme';
import { hashString, seededRandom, shuffle } from '@/utils/random';

import type { QuestionComponentProps } from './types';

const BLANK = '___';

/** Fill in the blank: the sentence shows a gap; choosing a word fills it in. */
export function FillBlankQuestion({ question, onAnswered, locked }: QuestionComponentProps<FillBlank>) {
  const { l } = useI18n();
  const [picked, setPicked] = useState<string | null>(null);
  const options = useMemo(() => shuffle(question.options, seededRandom(hashString(question.id))), [question.id, question.options]);
  const correct = question.options.find((o) => o.id === question.correctOptionId);
  const filled = picked ? question.options.find((o) => o.id === picked) : undefined;
  const sentence = l(question.sentence);
  const [before, after] = sentence.includes(BLANK) ? sentence.split(BLANK) : [sentence, ''];

  const choose = (id: string) => {
    if (picked || locked) return;
    setPicked(id);
    onAnswered({
      correct: evaluateAnswer(question, { type: 'option', optionId: id }),
      correctAnswer: correct ? l(correct.text) : '',
    });
  };

  const stateFor = (id: string): OptionState => {
    if (!picked) return 'idle';
    if (id === question.correctOptionId) return 'correct';
    if (id === picked) return 'incorrect';
    return 'dimmed';
  };

  return (
    <View style={styles.root}>
      <View style={styles.sentence}>
        <AppText variant="heading" color={colors.text}>
          {before}
          <AppText variant="heading" color={picked ? (picked === question.correctOptionId ? colors.success : colors.error) : colors.primary}>
            {filled ? ` ${l(filled.text)} ` : ' ______ '}
          </AppText>
          {after}
        </AppText>
      </View>
      <View style={styles.options}>
        {options.map((option) => (
          <AnswerOption key={option.id} label={l(option.text)} state={stateFor(option.id)} onPress={() => choose(option.id)} disabled={!!picked || locked} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  sentence: {
    backgroundColor: colors.goldSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#F0D49A',
  },
  options: { gap: spacing.sm },
});
