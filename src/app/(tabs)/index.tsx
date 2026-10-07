import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { CharacterCard } from '@/components/character/CharacterCard';
import { KnowledgeList } from '@/components/rpg/KnowledgeRadar';
import { QuestCard } from '@/components/rpg/QuestCard';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { HeroHeader } from '@/components/ui/HeroHeader';
import { Icon } from '@/components/ui/Icon';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StreakDisplay } from '@/components/ui/StreakDisplay';
import { XPBar } from '@/components/ui/XPBar';
import { getArea, QUESTIONS } from '@/content';
import { useI18n } from '@/hooks/useI18n';
import { useProgress } from '@/hooks/useProgress';
import { dailyChallengeFor } from '@/services/daily';
import { useGameStore } from '@/store/gameStore';
import { areaThemes, colors, spacing } from '@/theme';

export default function Home() {
  const { t, l } = useI18n();
  const game = useGameStore((s) => s.game);
  const progress = useProgress();
  const pendingIds = Object.values(game.review)
    .filter((r) => !r.mastered)
    .map((r) => r.questionId);
  const daily = dailyChallengeFor(progress.today, QUESTIONS, pendingIds);
  const next = progress.next;
  const nextArea = next ? getArea(next.areaId) : undefined;
  const openQuests = game.quests.filter((q) => !q.completed).slice(0, 3);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <HeroHeader>
        <View style={styles.headerRow}>
          <View style={styles.flex}>
            <CharacterCard character={game.character} name={game.name} level={progress.level.level} dark />
          </View>
          <StreakDisplay days={progress.streak} activeToday={progress.activeToday} compact dark />
        </View>
        <AppText variant="heading" color={colors.textOnDark}>
          {t('home.greeting', { name: game.name })}
        </AppText>
        <XPBar xp={game.xp} dark />
      </HeroHeader>

      <View style={styles.body}>
        {next && nextArea ? (
          <Card
            tone="primary"
            onPress={() => router.push({ pathname: '/unit/[id]', params: { id: next.id } })}
            accessibilityLabel={`${t('home.continue')}: ${l(next.title)}, ${l(nextArea.name)}`}
          >
            <View style={styles.row}>
              <View style={[styles.iconCircle, { backgroundColor: areaThemes[next.areaId].accent }]}>
                <Icon name={areaThemes[next.areaId].icon} size={26} color={colors.textOnDark} />
              </View>
              <View style={styles.flex}>
                <AppText variant="label" color={colors.primaryDark}>
                  {t('home.continue').toUpperCase()}
                </AppText>
                <AppText variant="heading">{l(next.title)}</AppText>
                <AppText variant="small" color={colors.textMuted}>
                  {l(nextArea.name)}
                </AppText>
              </View>
              <Icon name="play" size={24} color={colors.primary} />
            </View>
          </Card>
        ) : (
          <Card tone="primary">
            <AppText variant="body">{t('home.allDone')}</AppText>
          </Card>
        )}

        <Card tone="gold" onPress={() => router.push('/daily')} accessibilityLabel={`${t('home.daily')}: ${t(`daily.kind.${daily.kind}`)}`}>
          <View style={styles.row}>
            <View style={[styles.iconCircle, { backgroundColor: colors.gold }]}>
              <Icon name={progress.dailyDone ? 'check' : 'sun'} size={26} color={colors.night} />
            </View>
            <View style={styles.flex}>
              <AppText variant="label" color={colors.goldDeep}>
                {t('home.daily').toUpperCase()}
              </AppText>
              <AppText variant="heading">{t(`daily.kind.${daily.kind}`)}</AppText>
              {progress.dailyDone ? (
                <AppText variant="small" color={colors.textMuted}>
                  {t('home.dailyDone')}
                </AppText>
              ) : null}
            </View>
            <Icon name="chevron" size={22} color={colors.goldDeep} />
          </View>
        </Card>

        <Card onPress={() => router.push('/review')} accessibilityLabel={t('home.review')}>
          <View style={styles.row}>
            <View style={[styles.iconCircle, { backgroundColor: colors.infoSoft }]}>
              <Icon name="refresh" size={24} color={colors.info} />
            </View>
            <View style={styles.flex}>
              <AppText variant="bodyBold">{t('home.review')}</AppText>
              <AppText variant="small" color={colors.textMuted}>
                {progress.dueCount > 0 ? t('home.reviewCount', { count: progress.dueCount }) : t('home.reviewNone')}
              </AppText>
            </View>
            <Icon name="chevron" size={22} color={colors.textMuted} />
          </View>
        </Card>

        {openQuests.length > 0 ? (
          <>
            <SectionHeader title={t('home.quests')} actionLabel={t('tabs.quests')} onAction={() => router.push('/(tabs)/quests')} />
            {openQuests.map((q) => (
              <QuestCard key={q.id} quest={q} />
            ))}
          </>
        ) : null}

        <SectionHeader title={t('home.stats')} actionLabel={t('tabs.map')} onAction={() => router.push('/(tabs)/map')} />
        <Card>
          <KnowledgeList areas={progress.areas} />
        </Card>
        <Button label={t('profile.settings')} variant="ghost" icon="settings" onPress={() => router.push('/settings')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand },
  scroll: { paddingBottom: spacing.xxl },
  body: { padding: spacing.lg, gap: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  iconCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
});
