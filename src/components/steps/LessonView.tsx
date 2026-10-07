import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { SceneView } from '@/components/scene/SceneView';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { DifferenceNote, SourceList } from '@/components/ui/SourceList';
import { getArea } from '@/content';
import { useI18n } from '@/hooks/useI18n';
import type { Unit } from '@/models';
import { deviceNarration, speakArabic, stopSpeaking } from '@/services/speech';
import { useGameStore } from '@/store/gameStore';
import { colors, radius, spacing } from '@/theme';

/** LEARN step: a short lesson with optional narration and Arabic pronunciation. */
export function LessonView({ unit }: { unit: Unit }) {
  const { t, l, language } = useI18n();
  const narration = useGameStore((s) => s.game.settings.narrationEnabled);
  const area = getArea(unit.areaId);

  useEffect(() => () => stopSpeaking(), []);

  const readAloud = () =>
    deviceNarration.speak(
      [l(unit.title), ...unit.lesson.map((s) => `${s.heading ? `${l(s.heading)}. ` : ''}${l(s.body)}`)].join('. '),
      language,
    );

  return (
    <View style={styles.root}>
      {area ? <SceneView scene={area.scene} height={140} /> : null}
      <View style={styles.titleBlock}>
        <AppText variant="label" color={colors.goldDeep}>
          {t('unit.learn').toUpperCase()}
        </AppText>
        <AppText variant="title" accessibilityRole="header">
          {l(unit.title)}
        </AppText>
        <AppText variant="body" color={colors.textMuted}>
          {l(unit.description)}
        </AppText>
      </View>
      {narration ? <Button label={t('unit.readAloud')} icon="speaker" variant="secondary" onPress={readAloud} /> : null}

      {unit.lesson.map((section, index) => (
        <View key={index} style={styles.section}>
          {section.heading ? (
            <AppText variant="heading" color={colors.primaryDark}>
              {l(section.heading)}
            </AppText>
          ) : null}
          {section.arabic ? (
            <View style={styles.arabicRow}>
              <View style={styles.flex}>
                <AppText variant="title" script="arabic" align="center">
                  {section.arabic}
                </AppText>
                {section.transliteration ? (
                  <AppText variant="small" color={colors.textMuted} align="center">
                    {section.transliteration}
                  </AppText>
                ) : null}
              </View>
              <Pressable
                onPress={() => speakArabic(section.arabic ?? '')}
                accessibilityRole="button"
                accessibilityLabel={t('a11y.speak')}
                style={styles.speak}
              >
                <Icon name="speaker" size={22} color={colors.primary} />
              </Pressable>
            </View>
          ) : null}
          <AppText variant="body">{l(section.body)}</AppText>
        </View>
      ))}
      <DifferenceNote note={unit.differenceNote} />
      <SourceList sources={unit.sources} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.lg },
  titleBlock: { gap: spacing.xs },
  section: {
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  arabicRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.goldSoft, borderRadius: radius.md, padding: spacing.sm, gap: spacing.sm },
  flex: { flex: 1 },
  speak: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
});
