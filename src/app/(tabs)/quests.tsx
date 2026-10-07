import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { QuestCard } from '@/components/rpg/QuestCard';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { HeroHeader } from '@/components/ui/HeroHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useI18n } from '@/hooks/useI18n';
import { LOCALE_TAGS } from '@/localization/i18n';
import { BADGES } from '@/services/badges';
import { useGameStore } from '@/store/gameStore';
import { colors, spacing } from '@/theme';

export default function QuestsTab() {
  const { t, language } = useI18n();
  const quests = useGameStore((s) => s.game.quests);
  const badges = useGameStore((s) => s.game.badges);
  const refreshQuests = useGameStore((s) => s.refreshQuests);

  useFocusEffect(
    useCallback(() => {
      refreshQuests();
    }, [refreshQuests]),
  );

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <HeroHeader>
        <AppText variant="display" color={colors.textOnDark} accessibilityRole="header">
          {t('quests.title')}
        </AppText>
        <AppText variant="body" color={colors.textOnDarkMuted}>
          {t('quests.subtitle')}
        </AppText>
      </HeroHeader>
      <View style={styles.body}>
        {quests.map((q) => (
          <QuestCard key={q.id} quest={q} />
        ))}

        <SectionHeader title={t('quests.achievements')} />
        {BADGES.map((b) => {
          const earnedAt = badges[b.id];
          return (
            <Card key={b.id} style={!earnedAt && styles.lockedCard}>
              <View style={styles.badgeRow}>
                <Badge id={b.id} earned={!!earnedAt} size={56} showLabel={false} />
                <View style={styles.flex}>
                  <AppText variant="bodyBold">{t(`badge.${b.id}.name`)}</AppText>
                  <AppText variant="small" color={colors.textMuted}>
                    {t(`badge.${b.id}.desc`)}
                  </AppText>
                  <AppText variant="tiny" color={earnedAt ? colors.success : colors.textMuted}>
                    {earnedAt
                      ? t('badges.earnedOn', { date: new Date(earnedAt).toLocaleDateString(LOCALE_TAGS[language]) })
                      : t('badges.locked')}
                  </AppText>
                </View>
              </View>
            </Card>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand },
  scroll: { paddingBottom: spacing.xxl },
  body: { padding: spacing.lg, gap: spacing.md },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  lockedCard: { opacity: 0.75 },
  flex: { flex: 1, gap: 2 },
});
