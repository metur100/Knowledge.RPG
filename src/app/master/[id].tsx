import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RewardAnimation } from '@/components/game/RewardAnimation';
import { QuestionView } from '@/components/questions/QuestionView';
import { SceneView } from '@/components/scene/SceneView';
import { Dialog } from '@/components/ui/AppModal';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { LockedContent } from '@/components/ui/LockedContent';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/States';
import { TopBar } from '@/components/ui/TopBar';
import { CONTENT, getArea, testQuestionsOfArea, UNITS } from '@/content';
import { useI18n } from '@/hooks/useI18n';
import type { Area, Question } from '@/models';
import { isMasterUnlocked, pickMasterQuestions } from '@/services/progression';
import { MASTER_PASS_PERCENT } from '@/services/quiz';
import { type MasterOutcome, useGameStore } from '@/store/gameStore';
import { areaThemes, colors, spacing } from '@/theme';

export default function MasterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const area = getArea(String(id));
  const units = useGameStore((s) => s.game.units);
  const [unlocked] = useState(() => (area ? isMasterUnlocked(area.id, units, CONTENT) : false));
  // Each attempt gets a fresh run (and a fresh question selection).
  const [run, setRun] = useState(0);

  if (!area) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="dark" />
        <TopBar />
        <EmptyState icon="map" title={t('area.notFound')} />
      </SafeAreaView>
    );
  }

  if (!unlocked) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="dark" />
        <TopBar title={t('master.title')} />
        <View style={styles.content}>
          <LockedContent message={t('area.masterLocked')} />
          <Button label={t('common.back')} onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return <MasterRun key={run} area={area} onRetry={() => setRun((r) => r + 1)} />;
}

function MasterRun({ area, onRetry }: { area: Area; onRetry: () => void }) {
  const { t, l } = useI18n();
  const recordAnswer = useGameStore((s) => s.recordAnswer);
  const completeMaster = useGameStore((s) => s.completeMaster);
  const setPaused = useGameStore((s) => s.setCelebrationsPaused);

  const [questions] = useState<Question[]>(() => {
    const state = useGameStore.getState().game;
    return pickMasterQuestions(testQuestionsOfArea(area.id), state, state.masters[area.id]?.attempts ?? 0);
  });
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [learningXp, setLearningXp] = useState(0);
  const [outcome, setOutcome] = useState<MasterOutcome | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const theme = areaThemes[area.id];

  useEffect(() => {
    setPaused(true);
    return () => setPaused(false);
  }, [setPaused]);

  useEffect(() => {
    if (outcome) setPaused(false);
  }, [outcome, setPaused]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (outcome || !started) return false;
      setConfirmExit(true);
      return true;
    });
    return () => sub.remove();
  }, [outcome, started]);

  if (!started) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="dark" />
        <TopBar title={t('master.title')} />
        <ScrollView contentContainerStyle={styles.content}>
          <SceneView scene={area.scene} height={170} />
          <AppText variant="title" align="center" accessibilityRole="header">
            {l(area.name)}
          </AppText>
          <Card tone="gold">
            <AppText variant="body">
              {t('master.intro', { count: questions.length, area: l(area.name), percent: MASTER_PASS_PERCENT })}
            </AppText>
          </Card>
          <Button label={t('master.start')} variant="gold" icon="trophy" onPress={() => setStarted(true)} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (outcome) {
    // Weak topics are shown as the units whose questions were missed.
    const missedUnits = UNITS.filter((u) => questions.some((q, i) => results[i] === false && u.questions.some((uq) => uq.id === q.id)));
    const totalXp = outcome.xp + outcome.learningXp;
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.content}>
          <AppText variant="display" align="center" accessibilityRole="header">
            {outcome.passed ? t('master.passedTitle') : t('master.failedTitle')}
          </AppText>
          {outcome.passed ? (
            <RewardAnimation xp={totalXp} label={t('master.passedBody', { score: outcome.score.percent, area: l(area.name) })} />
          ) : (
            <Card>
              <AppText variant="body">{t('master.failedBody', { score: outcome.score.percent, percent: MASTER_PASS_PERCENT })}</AppText>
            </Card>
          )}
          {missedUnits.length > 0 ? (
            <Card tone="alt">
              <AppText variant="label" color={colors.textMuted}>
                {t('master.weakTopics').toUpperCase()}
              </AppText>
              {missedUnits.map((u) => (
                <View key={u.id} style={styles.topic}>
                  <Icon name="book" size={18} color={theme.accent} />
                  <AppText variant="bodyBold" style={styles.flex}>
                    {l(u.title)}
                  </AppText>
                </View>
              ))}
            </Card>
          ) : null}
          {!outcome.passed ? (
            <>
              <Button label={t('master.review')} icon="refresh" onPress={() => router.replace('/review')} />
              <Button label={t('master.retry')} variant="secondary" icon="trophy" onPress={onRetry} />
            </>
          ) : null}
          <Button
            label={t('reward.area')}
            variant={outcome.passed ? 'primary' : 'ghost'}
            onPress={() => router.replace({ pathname: '/area/[id]', params: { id: area.id } })}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const question = questions[index];
  const next = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    if (index + 1 < questions.length) setIndex(index + 1);
    else setOutcome(completeMaster(area.id, results, learningXp));
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TopBar backIcon="close" backLabel={t('a11y.close')} onBack={() => setConfirmExit(true)} title={t('master.title')} />
        <View style={styles.progressRow}>
          <ProgressBar progress={index / questions.length} color={theme.accent} style={styles.flex} />
          <AppText variant="tiny" color={colors.textMuted}>
            {index + 1}/{questions.length}
          </AppText>
        </View>
      </View>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        <QuestionView
          key={`${index}-${question.id}`}
          question={question}
          label="master"
          onResult={(correct) => {
            setResults((r) => [...r, correct]);
            setLearningXp((x) => x + recordAnswer(question, correct, 'master'));
          }}
          onContinue={next}
        />
      </ScrollView>
      <Dialog
        visible={confirmExit}
        title={t('unit.exitTitle')}
        body={t('unit.exitBody')}
        confirmLabel={t('unit.exit')}
        cancelLabel={t('unit.stay')}
        onConfirm={() => {
          setConfirmExit(false);
          router.back();
        }}
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
  topic: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.lg },
});
