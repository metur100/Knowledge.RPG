import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { SceneView } from '@/components/scene/SceneView';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useFeedback } from '@/hooks/useFeedback';
import { useI18n } from '@/hooks/useI18n';
import { LANGUAGE_NAMES } from '@/localization/i18n';
import { LANGUAGES } from '@/models';
import { useGameStore } from '@/store/gameStore';
import { colors, radius, spacing } from '@/theme';

/** Step 1: welcome and language. */
export default function Welcome() {
  const { t, language } = useI18n();
  const updateSettings = useGameStore((s) => s.updateSettings);
  const feedback = useFeedback();

  return (
    <OnboardingFrame
      step={1}
      showBack={false}
      footer={<Button label={t('onboarding.next')} variant="gold" iconRight="chevron" onPress={() => router.push('/onboarding/hero')} />}
    >
      <SceneView scene={{ sky: 'night', elements: ['stars', 'crescent', 'mountains', 'city', 'book'] }} height={190} />
      <View style={styles.texts}>
        <AppText variant="display" color={colors.gold} align="center" accessibilityRole="header">
          {t('onboarding.welcome.title')}
        </AppText>
        <AppText variant="body" color={colors.textOnDark} align="center">
          {t('onboarding.welcome.body')}
        </AppText>
      </View>
      <AppText variant="heading" color={colors.textOnDark} align="center">
        {t('onboarding.language')}
      </AppText>
      <View style={styles.list} accessibilityRole="radiogroup">
        {LANGUAGES.map((lang) => {
          const active = lang === language;
          return (
            <Pressable
              key={lang}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={LANGUAGE_NAMES[lang]}
              onPress={() => {
                feedback.tap();
                updateSettings({ language: lang });
              }}
              style={[styles.option, active && styles.optionActive]}
            >
              <Icon name="globe" size={22} color={active ? colors.night : colors.textOnDark} />
              <AppText variant="bodyBold" color={active ? colors.night : colors.textOnDark} style={styles.label}>
                {LANGUAGE_NAMES[lang]}
              </AppText>
              {active ? <Icon name="check" size={22} color={colors.night} strokeWidth={3} /> : null}
            </Pressable>
          );
        })}
      </View>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  texts: { gap: spacing.sm },
  list: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  optionActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  label: { flex: 1 },
});
