import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RewardAnimation } from '@/components/game/RewardAnimation';
import { QuestionView } from '@/components/questions/QuestionView';
import { LessonView } from '@/components/steps/LessonView';
import { Dialog } from '@/components/ui/AppModal';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LockedContent } from '@/components/ui/LockedContent';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Stars } from '@/components/ui/Stars';
import { EmptyState } from '@/components/ui/States';
import { TopBar } from '@/components/ui/TopBar';
import { CONTENT, getUnit } from '@/content';
import { useI18n } from '@/hooks/useI18n';
import type { Question, Unit } from '@/models';
import { nextUnit, unitStatus } from '@/services/progression';
import { type UnitOutcome, useGameStore } from '@/store/gameStore';
import { areaThemes, colors, spacing } from '@/theme';

type Phase = 'learn' | 'practice' | 'test' | 'explanation' | 'reward';

export default function UnitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Keyed by id so "next unit" always starts with fresh state.
  return <UnitPlayer key={String(id)} id={String(id)} />;
}

function UnitPlayer({ id }: { id: string }) {
  const { t, l } = useI18n();
  const unit = getUnit(id);
  const units = useGameStore((s) => s.game.units);
  const [initialStatus] = useState(() => (unit ? unitStatus(unit, units, CONTENT) : 'locked'));

  if (!unit) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="dark" />
        <TopBar />
        <EmptyState icon="book" title={t('unit.notFound')} />
      </SafeAreaView>
    );
  }

  if (initialStatus === 'locked') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="dark" />
        <TopBar title={l(unit.title)} />
        <View style={styles.content}>
          <LockedContent message={t('unit.locked')} />
          <Button label={t('common.back')} onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return <UnitFlow unit={unit} />;
}

function UnitFlow({ unit }: { unit: Unit }) {
  const { t, l } = useI18n();
  const recordAnswer = useGameStore((s) => s.recordAnswer);
  const completeUnit = useGameStore((s) => s.completeUnit);
  const setPaused = useGameStore((s) => s.setCelebrationsPaused);

  const practice = unit.questions.find((q) => q.id === unit.practiceId);
  const tests = unit.testIds
    .map((qid) => unit.questions.find((q) => q.id === qid))
    .filter((q): q is Question => q !== undefined);

  const [phase, setPhase] = useState<Phase>('learn');
  const [testIndex, setTestIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [learningXp, setLearningXp] = useState(0);
  const [outcome, setOutcome] = useState<UnitOutcome | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setPaused(true);
    return () => setPaused(false);
  }, [setPaused]);

  useEffect(() => {
    if (outcome) setPaused(false);
  }, [outcome, setPaused]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (outcome) return false;
      setConfirmExit(true);
      return true;
    });
    return () => sub.remove();
  }, [outcome]);

  const go = (next: Phase) => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    setPhase(next);
  };

  const exit = () => {
    setConfirmExit(false);
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const theme = areaThemes[unit.areaId];
  const totalSteps = 3 + tests.length;
  const stepNumber =
    phase === 'learn' ? 0 : phase === 'practice' ? 1 : phase === 'test' ? 2 + testIndex : phase === 'explanation' ? totalSteps - 1 : totalSteps;

  if (phase === 'reward' && outcome) {
    const next = nextUnit(useGameStore.getState().game.units, CONTENT);
    const stars = outcome.score.percent === 100 ? 3 : outcome.score.percent >= 50 ? 2 : 1;
    const totalXp = outcome.xp + outcome.learningXp;
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.content}>
          <AppText variant="display" align="center" accessibilityRole="header">
            {t('reward.title')}
          </AppText>
          <View style={styles.center} accessible accessibilityLabel={t('a11y.stars', { count: stars })}>
            <Stars count={stars} size={36} />
          </View>
          <RewardAnimation xp={totalXp} label={t('reward.score', { correct: outcome.score.correct, total: outcome.score.total })} />
          {totalXp === 0 ? (
            <AppText variant="small" color={colors.textMuted} align="center">
              {t('reward.noXp')}
            </AppText>
          ) : null}
          {results.some((r) => !r) ? (
            <Button label={t('home.review')} variant="secondary" icon="refresh" onPress={() => router.replace('/review')} />
          ) : null}
          {next ? (
            <Button
              label={t('reward.next')}
              iconRight="chevron"
              onPress={() => router.replace({ pathname: '/unit/[id]', params: { id: next.id } })}
            />
          ) : null}
          <Button
            label={t('reward.area')}
            variant={next ? 'ghost' : 'primary'}
            onPress={() => router.replace({ pathname: '/area/[id]', params: { id: unit.areaId } })}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const renderPhase = () => {
    switch (phase) {
      case 'learn':
        return (
          <>
            <LessonView unit={unit} />
            <Button label={t('unit.doneReading')} icon="check" onPress={() => go(practice ? 'practice' : 'test')} />
          </>
        );
      case 'practice':
        return practice ? (
          <QuestionView
            key="practice"
            question={practice}
            label="practice"
            showReviewNote={false}
            onResult={() => undefined}
            continueLabel={t('unit.startTest')}
            onContinue={() => go('test')}
          />
        ) : null;
      case 'test': {
        const question = tests[testIndex];
        if (!question) return <Button label={t('common.continue')} onPress={() => go('explanation')} />;
        return (
          <QuestionView
            key={`test-${testIndex}`}
            question={question}
            label="test"
            onResult={(correct) => {
              setResults((r) => [...r, correct]);
              setLearningXp((x) => x + recordAnswer(question, correct, 'test'));
            }}
            onContinue={() => {
              scrollRef.current?.scrollTo({ y: 0, animated: false });
              if (testIndex + 1 < tests.length) setTestIndex(testIndex + 1);
              else setPhase('explanation');
            }}
          />
        );
      }
      case 'explanation':
        return (
          <>
            <AppText variant="label" color={colors.goldDeep}>
              {t('unit.explanation').toUpperCase()}
            </AppText>
            <AppText variant="title" accessibilityRole="header">
              {l(unit.title)}
            </AppText>
            <Card tone="gold">
              <AppText variant="body">{l(unit.explanation)}</AppText>
            </Card>
            <AppText variant="bodyBold" align="center">
              {t('reward.score', { correct: results.filter(Boolean).length, total: results.length })}
            </AppText>
            <Button
              label={t('unit.finish')}
              variant="gold"
              icon="trophy"
              onPress={() => {
                setOutcome(completeUnit(unit.id, results, learningXp));
                go('reward');
              }}
            />
          </>
        );
      default:
        return null;
    }
  };

  const phaseLabel =
    phase === 'learn' ? t('unit.learn') : phase === 'practice' ? t('unit.practice') : phase === 'test' ? t('unit.test') : t('unit.explanation');

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TopBar backIcon="close" backLabel={t('a11y.close')} onBack={() => setConfirmExit(true)} title={phaseLabel} />
        <View style={styles.progressRow}>
          <ProgressBar
            progress={stepNumber / totalSteps}
            color={theme.accent}
            style={styles.flex}
            accessibilityLabel={t('a11y.progress', { percent: Math.round((stepNumber / totalSteps) * 100) })}
          />
          {phase === 'test' ? (
            <AppText variant="tiny" color={colors.textMuted}>
              {testIndex + 1}/{tests.length}
            </AppText>
          ) : null}
        </View>
      </View>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {renderPhase()}
      </ScrollView>
      <Dialog
        visible={confirmExit}
        title={t('unit.exitTitle')}
        body={t('unit.exitBody')}
        confirmLabel={t('unit.exit')}
        cancelLabel={t('unit.stay')}
        onConfirm={exit}
        onCancel={() => setConfirmExit(false)}
        destructive
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand },
  header: { paddingBottom: spacing.sm },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
  flex: { flex: 1, width: undefined },
  center: { alignItems: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.lg },
});
