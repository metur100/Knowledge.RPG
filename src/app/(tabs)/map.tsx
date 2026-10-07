import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { WorldMap } from '@/components/rpg/WorldMap';
import { AppModal } from '@/components/ui/AppModal';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { HeroHeader } from '@/components/ui/HeroHeader';
import { LockedContent } from '@/components/ui/LockedContent';
import { getArea } from '@/content';
import { useI18n } from '@/hooks/useI18n';
import { useProgress } from '@/hooks/useProgress';
import type { AreaId } from '@/models';
import { colors, spacing } from '@/theme';

export default function MapTab() {
  const { t, l } = useI18n();
  const progress = useProgress();
  const [locked, setLocked] = useState<AreaId | null>(null);

  const open = (id: AreaId) => {
    if (progress.areas.find((a) => a.id === id)?.unlocked) router.push({ pathname: '/area/[id]', params: { id } });
    else setLocked(id);
  };

  const lockedArea = locked ? getArea(locked) : undefined;
  const requirement = lockedArea?.unlock ? getArea(lockedArea.unlock.areaId) : undefined;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <HeroHeader>
        <AppText variant="display" color={colors.textOnDark} accessibilityRole="header">
          {t('map.title')}
        </AppText>
        <AppText variant="body" color={colors.textOnDarkMuted}>
          {t('map.subtitle')}
        </AppText>
      </HeroHeader>
      <View style={styles.body}>
        <WorldMap progress={progress.areas} onSelect={open} />
      </View>
      <AppModal visible={!!lockedArea} onClose={() => setLocked(null)}>
        {lockedArea ? (
          <View style={styles.modal}>
            <AppText variant="title" align="center">
              {l(lockedArea.name)}
            </AppText>
            <AppText variant="body" color={colors.textMuted} align="center">
              {l(lockedArea.description)}
            </AppText>
            {lockedArea.unlock && requirement ? (
              <LockedContent message={t('map.locked', { count: lockedArea.unlock.unitsCompleted, area: l(requirement.name) })} />
            ) : null}
            <Button label={t('common.done')} onPress={() => setLocked(null)} />
          </View>
        ) : null}
      </AppModal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand },
  scroll: { paddingBottom: spacing.xxl },
  body: { padding: spacing.lg },
  modal: { gap: spacing.md },
});
