import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { getArea, getUnit } from '@/content';
import { useI18n } from '@/hooks/useI18n';
import type { Quest, QuestKind } from '@/models';
import { colors, radius, spacing } from '@/theme';

const ICONS: Record<QuestKind, IconName> = {
  daily: 'sun',
  learning: 'book',
  knowledge: 'sparkle',
  review: 'refresh',
  challenge: 'trophy',
};

/** Human-readable quest description. */
export function useQuestText() {
  const { t, l } = useI18n();
  return (quest: Quest): string => {
    const goal = quest.goal;
    switch (goal.type) {
      case 'dailyChallenge':
        return t('quests.daily');
      case 'completeUnit':
        return t('quests.learning', { title: l(getUnit(goal.unitId)?.title) });
      case 'correctAnswers':
        return t('quests.knowledge', { count: goal.count, area: l(getArea(goal.areaId)?.name) });
      case 'reviewAnswers':
        return t('quests.review', { count: goal.count });
      case 'passMaster':
        return t('quests.challenge', { area: l(getArea(goal.areaId)?.name) });
    }
  };
}

export function QuestCard({ quest }: { quest: Quest }) {
  const { t } = useI18n();
  const describe = useQuestText();
  const text = describe(quest);
  const status = quest.completed ? t('quests.done') : `${quest.progress}/${quest.target}`;

  return (
    <View
      style={[styles.card, quest.completed && styles.done]}
      accessible
      accessibilityLabel={`${t(`quests.kind.${quest.kind}`)}: ${text}. ${status}. +${quest.xp} XP`}
    >
      <View style={[styles.icon, quest.completed && styles.iconDone]}>
        <Icon name={quest.completed ? 'check' : ICONS[quest.kind]} size={22} color={quest.completed ? colors.textOnDark : colors.primaryDark} />
      </View>
      <View style={styles.texts}>
        <AppText variant="label" color={colors.goldDeep}>
          {t(`quests.kind.${quest.kind}`).toUpperCase()}
        </AppText>
        <AppText variant="bodyBold">{text}</AppText>
        <View style={styles.row}>
          <ProgressBar progress={quest.progress / quest.target} color={quest.completed ? colors.success : colors.primary} style={styles.bar} />
          <AppText variant="tiny" color={colors.textMuted}>
            {status}
          </AppText>
        </View>
      </View>
      <AppText variant="small" color={colors.goldDeep}>
        +{quest.xp}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  done: { backgroundColor: colors.successSoft, borderColor: '#BFE5CC' },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  iconDone: { backgroundColor: colors.success },
  texts: { flex: 1, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  bar: { flex: 1, width: undefined },
});
