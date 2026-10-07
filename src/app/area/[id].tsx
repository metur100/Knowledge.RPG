import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { SceneView } from '@/components/scene/SceneView';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { HeroHeader } from '@/components/ui/HeroHeader';
import { Icon } from '@/components/ui/Icon';
import { LockedContent } from '@/components/ui/LockedContent';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Screen } from '@/components/ui/Screen';
import { EmptyState } from '@/components/ui/States';
import { TopBar } from '@/components/ui/TopBar';
import { CONTENT, getArea, testQuestionsOfArea } from '@/content';
import { useI18n } from '@/hooks/useI18n';
import { isAreaUnlocked, isMasterUnlocked, knowledgePercent, unitsIn, unitStatus } from '@/services/progression';
import { MASTER_PASS_PERCENT, MASTER_QUESTIONS } from '@/services/quiz';
import { useGameStore } from '@/store/gameStore';
import { areaThemes, colors, spacing } from '@/theme';

export default function AreaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, l } = useI18n();
  const game = useGameStore((s) => s.game);
  const area = getArea(String(id));

  if (!area) {
    return (
      <Screen header={<TopBar />}>
        <EmptyState icon="map" title={t('area.notFound')} actionLabel={t('common.back')} onAction={() => router.back()} />
      </Screen>
    );
  }

  const theme = areaThemes[area.id];
  const unlocked = isAreaUnlocked(area, game.units, CONTENT);
  const units = unitsIn(area.id, CONTENT);
  const masterOpen = isMasterUnlocked(area.id, game.units, CONTENT);
  const master = game.masters[area.id];
  const knowledge = knowledgePercent(testQuestionsOfArea(area.id), game);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <HeroHeader gradient={theme.gradient}>
        <TopBar dark />
        <SceneView scene={area.scene} height={150} />
        <AppText variant="display" color={colors.textOnDark} accessibilityRole="header">
          {l(area.name)}
        </AppText>
        <AppText variant="body" color={colors.textOnDarkMuted}>
          {l(area.description)}
        </AppText>
        <View style={styles.knowledge}>
          <AppText variant="small" color={colors.textOnDark}>
            {t('area.knowledge', { percent: knowledge })}
          </AppText>
          <ProgressBar progress={knowledge / 100} color={colors.gold} trackColor="rgba(255,255,255,0.2)" />
        </View>
      </HeroHeader>

      <View style={styles.body}>
        {!unlocked ? <LockedContent message={t('common.locked')} /> : null}
        <SectionHeader title={t('area.units')} />
        {units.map((unit, index) => {
          const status = unitStatus(unit, game.units, CONTENT);
          const best = game.units[unit.id]?.bestScore;
          const locked = status === 'locked';
          return (
            <Card
              key={unit.id}
              onPress={locked ? undefined : () => router.push({ pathname: '/unit/[id]', params: { id: unit.id } })}
              disabled={locked}
              style={locked && styles.locked}
              accessibilityLabel={`${index + 1}. ${l(unit.title)}. ${
                locked ? t('area.unitLocked') : status === 'completed' ? `${t('quests.done')}, ${best ?? 0} %` : t('area.difficulty', { level: unit.difficulty })
              }`}
            >
              <View style={styles.row}>
                <View
                  style={[
                    styles.number,
                    { backgroundColor: locked ? colors.locked : status === 'completed' ? colors.success : theme.accent },
                  ]}
                >
                  {locked ? (
                    <Icon name="lock" size={20} color={colors.textOnDark} />
                  ) : status === 'completed' ? (
                    <Icon name="check" size={22} color={colors.textOnDark} strokeWidth={3} />
                  ) : (
                    <AppText variant="heading" color={colors.textOnDark}>
                      {index + 1}
                    </AppText>
                  )}
                </View>
                <View style={styles.flex}>
                  <AppText variant="bodyBold">{l(unit.title)}</AppText>
                  <AppText variant="small" color={colors.textMuted}>
                    {locked ? t('area.unitLocked') : l(unit.description)}
                  </AppText>
                  <AppText variant="tiny" color={colors.goldDeep}>
                    {t('area.difficulty', { level: unit.difficulty })}
                    {status === 'completed' && best !== undefined ? ` · ${best} %` : ''}
                  </AppText>
                </View>
              </View>
            </Card>
          );
        })}

        <SectionHeader title={t('area.master')} />
        <Card tone={master?.passed ? 'gold' : 'dark'}>
          <View style={styles.row}>
            <Icon name="trophy" size={34} color={master?.passed ? colors.goldDeep : colors.gold} />
            <View style={styles.flex}>
              <AppText variant="heading" color={master?.passed ? colors.text : colors.textOnDark}>
                {t('area.master')}
              </AppText>
              <AppText variant="small" color={master?.passed ? colors.textMuted : colors.textOnDarkMuted}>
                {master?.passed
                  ? t('area.masterPassed', { score: master.bestScore })
                  : masterOpen
                    ? t('area.masterBody', { count: MASTER_QUESTIONS, percent: MASTER_PASS_PERCENT })
                    : t('area.masterLocked')}
              </AppText>
            </View>
          </View>
          {masterOpen ? (
            <Button
              label={master?.passed ? t('common.retry') : t('master.start')}
              variant="gold"
              icon="trophy"
              style={styles.masterButton}
              onPress={() => router.push({ pathname: '/master/[id]', params: { id: area.id } })}
            />
          ) : null}
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand },
  scroll: { paddingBottom: spacing.xxl },
  body: { padding: spacing.lg, gap: spacing.md },
  knowledge: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1, gap: 2 },
  number: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  locked: { opacity: 0.7 },
  masterButton: { marginTop: spacing.md },
});
