import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/character/Avatar';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useI18n } from '@/hooks/useI18n';
import { useGameStore } from '@/store/gameStore';
import { useOnboardingDraft } from '@/store/onboardingDraft';
import { colors, radius, spacing } from '@/theme';

const LOOP_ICONS: IconName[] = ['book', 'check', 'eye', 'star', 'trophy', 'lock', 'refresh'];

/** Step 3: the learning loop, then start. */
export default function StartStep() {
  const { t, language } = useI18n();
  const completeOnboarding = useGameStore((s) => s.completeOnboarding);
  const name = useOnboardingDraft((s) => s.name);
  const character = useOnboardingDraft((s) => s.character);
  const steps = t('onboarding.loop')
    .split('→')
    .map((s) => s.trim());

  const finish = () => {
    completeOnboarding({ name, character, language });
    router.replace('/(tabs)');
  };

  return (
    <OnboardingFrame
      step={3}
      title={t('onboarding.loopTitle')}
      footer={<Button label={t('onboarding.start')} variant="gold" icon="play" onPress={finish} />}
    >
      <View style={styles.avatar}>
        <Avatar character={character} size={110} />
      </View>
      <View style={styles.loop} accessible accessibilityLabel={steps.join(', ')}>
        {steps.map((step, i) => (
          <View key={step} style={styles.step}>
            <View style={styles.icon}>
              <Icon name={LOOP_ICONS[i % LOOP_ICONS.length]} size={20} color={colors.night} />
            </View>
            <AppText variant="bodyBold" color={colors.textOnDark}>
              {step}
            </AppText>
          </View>
        ))}
      </View>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignSelf: 'center',
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  loop: { gap: spacing.sm },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
});
