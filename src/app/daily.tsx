import { router } from 'expo-router';
import { useState } from 'react';

import { RewardAnimation } from '@/components/game/RewardAnimation';
import { QuestionView } from '@/components/questions/QuestionView';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { EmptyState } from '@/components/ui/States';
import { TopBar } from '@/components/ui/TopBar';
import { getQuestion, QUESTIONS } from '@/content';
import { useI18n } from '@/hooks/useI18n';
import type { Question } from '@/models';
import { dailyChallengeFor } from '@/services/daily';
import { useGameStore } from '@/store/gameStore';
import { colors } from '@/theme';
import { toDayKey } from '@/utils/date';

/** One small challenge per day, chosen deterministically from local content. */
export default function DailyScreen() {
  const { t } = useI18n();
  const recordAnswer = useGameStore((s) => s.recordAnswer);
  const completeDaily = useGameStore((s) => s.completeDaily);

  const [setup] = useState(() => {
    const game = useGameStore.getState().game;
    const day = toDayKey(new Date());
    const pending = Object.values(game.review)
      .filter((r) => !r.mastered)
      .map((r) => r.questionId);
    const challenge = dailyChallengeFor(day, QUESTIONS, pending);
    return {
      day,
      challenge,
      alreadyDone: game.dailyCompleted.includes(day),
      questions: challenge.questionIds.map((id) => getQuestion(id)).filter((q): q is Question => q !== undefined),
    };
  });
  const [index, setIndex] = useState(0);
  const [xp, setXp] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);
  const mode = setup.challenge.kind === 'review' ? 'review' : 'daily';

  if (setup.alreadyDone && !done) {
    return (
      <Screen header={<TopBar title={t('daily.title')} />}>
        <EmptyState icon="check" title={t('daily.doneTitle')} body={t('daily.already')} actionLabel={t('common.back')} onAction={() => router.back()} />
      </Screen>
    );
  }

  if (done) {
    return (
      <Screen header={<TopBar title={t('daily.title')} />}>
        <AppText variant="title" align="center">
          {t('daily.doneTitle')}
        </AppText>
        <RewardAnimation xp={xp} label={t('reward.score', { correct: results.filter(Boolean).length, total: results.length })} />
        <Button label={t('common.done')} onPress={() => router.back()} />
      </Screen>
    );
  }

  const question = setup.questions[index];
  if (!question) {
    return (
      <Screen header={<TopBar title={t('daily.title')} />}>
        <EmptyState icon="sun" title={t('error.title')} actionLabel={t('common.back')} onAction={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen header={<TopBar title={t('daily.title')} />}>
      <Card tone="gold">
        <AppText variant="label" color={colors.goldDeep}>
          {t(`daily.kind.${setup.challenge.kind}`).toUpperCase()}
          {setup.questions.length > 1 ? ` · ${index + 1}/${setup.questions.length}` : ''}
        </AppText>
      </Card>
      <QuestionView
        key={`${index}-${question.id}`}
        question={question}
        label={mode}
        onResult={(correct) => {
          setResults((r) => [...r, correct]);
          setXp((x) => x + recordAnswer(question, correct, mode));
        }}
        onContinue={() => {
          if (index + 1 < setup.questions.length) {
            setIndex(index + 1);
            return;
          }
          setXp((x) => x + completeDaily(setup.day));
          setDone(true);
        }}
      />
    </Screen>
  );
}
