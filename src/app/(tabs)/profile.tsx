import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { CharacterCard } from '@/components/character/CharacterCard';
import { KnowledgeList, KnowledgeRadar } from '@/components/rpg/KnowledgeRadar';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { HeroHeader } from '@/components/ui/HeroHeader';
import { LinkRow } from '@/components/ui/SettingRow';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StreakDisplay } from '@/components/ui/StreakDisplay';
import { XPBar } from '@/components/ui/XPBar';
import { useI18n } from '@/hooks/useI18n';
import { useProgress } from '@/hooks/useProgress';
import { useGameStore } from '@/store/gameStore';
import { colors, spacing } from '@/theme';

export default function Profile() {
  const { t } = useI18n();
  const game = useGameStore((s) => s.game);
  const progress = useProgress();
  const accuracy = game.stats.questionsAnswered
    ? Math.round((game.stats.correctAnswers / game.stats.questionsAnswered) * 100)
    : 0;

  const stats = [
    { label: t('stats.units'), value: String(progress.unitsCompleted) },
    { label: t('stats.masters'), value: `${progress.mastersPassed}/${progress.areas.length}` },
    { label: t('stats.answers'), value: String(game.stats.correctAnswers) },
    { label: t('stats.accuracy'), value: `${accuracy}%` },
    { label: t('stats.longest'), value: t(game.streak.longest === 1 ? 'streak.day' : 'streak.days', { count: game.streak.longest }) },
    { label: t('stats.reviews'), value: String(game.stats.reviewsCorrect) },
  ];

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <HeroHeader>
        <AppText variant="display" color={colors.textOnDark} accessibilityRole="header">
          {t('profile.title')}
        </AppText>
        <CharacterCard character={game.character} name={game.name} level={progress.level.level} size={104} dark />
        <Button label={t('profile.edit')} variant="light" icon="pencil" onPress={() => router.push('/character')} />
        <XPBar xp={game.xp} dark />
      </HeroHeader>

      <View style={styles.body}>
        <Card>
          <StreakDisplay days={progress.streak} activeToday={progress.activeToday} />
          <AppText variant="tiny" color={colors.textMuted} style={styles.note}>
            {t('streak.note')}
          </AppText>
        </Card>

        <SectionHeader title={t('profile.knowledgeMap')} />
        <Card style={styles.radarCard}>
          <KnowledgeRadar areas={progress.areas} />
          <KnowledgeList areas={progress.areas} />
          <AppText variant="tiny" color={colors.textMuted}>
            {t('profile.knowledgeNote')}
          </AppText>
        </Card>

        <SectionHeader title={t('profile.stats')} />
        <View style={styles.statGrid}>
          {stats.map((s) => (
            <View key={s.label} style={styles.stat} accessible accessibilityLabel={`${s.label}: ${s.value}`}>
              <AppText variant="title" color={colors.primaryDark}>
                {s.value}
              </AppText>
              <AppText variant="tiny" color={colors.textMuted}>
                {s.label}
              </AppText>
            </View>
          ))}
        </View>

        <Card>
          <LinkRow icon="settings" label={t('profile.settings')} onPress={() => router.push('/settings')} />
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand },
  scroll: { paddingBottom: spacing.xxl },
  body: { padding: spacing.lg, gap: spacing.lg },
  note: { marginTop: spacing.sm },
  radarCard: { gap: spacing.md },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stat: {
    width: '48.5%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
