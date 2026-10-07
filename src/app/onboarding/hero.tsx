import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { CharacterEditor } from '@/components/character/CharacterEditor';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/hooks/useI18n';
import { useOnboardingDraft } from '@/store/onboardingDraft';
import { colors, fonts, radius, spacing } from '@/theme';
import { isValidName, MAX_NAME_LENGTH } from '@/utils/validation';

/** Step 2: create the hero and give it a name. */
export default function HeroStep() {
  const { t } = useI18n();
  const name = useOnboardingDraft((s) => s.name);
  const setName = useOnboardingDraft((s) => s.setName);
  const character = useOnboardingDraft((s) => s.character);
  const setCharacter = useOnboardingDraft((s) => s.setCharacter);
  const [touched, setTouched] = useState(false);
  const valid = isValidName(name);

  const next = () => {
    setTouched(true);
    if (valid) router.push('/onboarding/start');
  };

  return (
    <OnboardingFrame
      step={2}
      title={t('onboarding.hero')}
      footer={<Button label={t('onboarding.next')} variant="gold" iconRight="chevron" onPress={next} disabled={touched && !valid} />}
    >
      <AppText variant="heading" color={colors.textOnDark}>
        {t('onboarding.name')}
      </AppText>
      <TextInput
        value={name}
        onChangeText={(v) => setName(v.slice(0, MAX_NAME_LENGTH))}
        placeholder={t('onboarding.namePlaceholder')}
        placeholderTextColor="#8E92B8"
        accessibilityLabel={t('onboarding.name')}
        autoCapitalize="words"
        autoCorrect={false}
        maxLength={MAX_NAME_LENGTH}
        returnKeyType="done"
        onSubmitEditing={next}
        onBlur={() => setTouched(true)}
        style={styles.input}
      />
      {touched && !valid ? (
        <AppText variant="small" color={colors.gold} align="center" accessibilityLiveRegion="polite">
          {t('onboarding.nameError')}
        </AppText>
      ) : null}
      <View style={styles.editor}>
        <CharacterEditor character={character} onChange={setCharacter} />
      </View>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  editor: { backgroundColor: colors.sand, borderRadius: radius.xl, padding: spacing.lg },
  input: {
    minHeight: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: 'center',
  },
});
