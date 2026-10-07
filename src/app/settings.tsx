import Constants from 'expo-constants';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Dialog } from '@/components/ui/AppModal';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { LinkRow, ToggleRow } from '@/components/ui/SettingRow';
import { TopBar } from '@/components/ui/TopBar';
import { useFeedback } from '@/hooks/useFeedback';
import { useI18n } from '@/hooks/useI18n';
import { LANGUAGE_NAMES } from '@/localization/i18n';
import { LANGUAGES } from '@/models';
import { stopSpeaking } from '@/services/speech';
import { useGameStore } from '@/store/gameStore';
import { colors, radius, spacing } from '@/theme';

export default function SettingsScreen() {
  const { t } = useI18n();
  const feedback = useFeedback();
  const settings = useGameStore((s) => s.game.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const resetProgress = useGameStore((s) => s.resetProgress);
  const [confirmReset, setConfirmReset] = useState(false);

  const doReset = async () => {
    setConfirmReset(false);
    await resetProgress();
    router.replace('/onboarding');
  };

  return (
    <Screen header={<TopBar title={t('settings.title')} />}>
      <Section title={t('settings.general')}>
        <AppText variant="bodyBold">{t('settings.language')}</AppText>
        <View style={styles.langRow} accessibilityRole="radiogroup">
          {LANGUAGES.map((lang) => {
            const active = settings.language === lang;
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
                style={[styles.lang, active && styles.langActive]}
              >
                <AppText variant="small" color={active ? colors.textOnDark : colors.text}>
                  {LANGUAGE_NAMES[lang]}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <ToggleRow icon="speaker" label={t('settings.sound')} value={settings.soundEnabled} onChange={(v) => updateSettings({ soundEnabled: v })} />
        <ToggleRow icon="sparkle" label={t('settings.haptics')} value={settings.hapticsEnabled} onChange={(v) => updateSettings({ hapticsEnabled: v })} />
        <ToggleRow
          icon="book"
          label={t('settings.narration')}
          description={t('settings.narrationDesc')}
          value={settings.narrationEnabled}
          onChange={(v) => {
            if (!v) stopSpeaking();
            updateSettings({ narrationEnabled: v });
          }}
        />
      </Section>

      <Section title={t('settings.accessibility')}>
        <ToggleRow icon="eye" label={t('settings.largeText')} value={settings.largeText} onChange={(v) => updateSettings({ largeText: v })} />
        <ToggleRow icon="sun" label={t('settings.highContrast')} value={settings.highContrast} onChange={(v) => updateSettings({ highContrast: v })} />
        <ToggleRow icon="shield" label={t('settings.reducedMotion')} value={settings.reducedMotion} onChange={(v) => updateSettings({ reducedMotion: v })} />
      </Section>

      <Section title={t('settings.info')}>
        <LinkRow icon="info" label={t('settings.about')} onPress={() => router.push({ pathname: '/info/[page]', params: { page: 'about' } })} />
        <LinkRow icon="shield" label={t('settings.privacy')} onPress={() => router.push({ pathname: '/info/[page]', params: { page: 'privacy' } })} />
        <LinkRow icon="book" label={t('settings.sources')} onPress={() => router.push({ pathname: '/info/[page]', params: { page: 'sources' } })} />
      </Section>

      <Section title={t('settings.data')}>
        <LinkRow icon="trash" label={t('settings.reset')} onPress={() => setConfirmReset(true)} danger />
        <AppText variant="small" color={colors.textMuted}>
          {t('settings.resetDesc')}
        </AppText>
      </Section>

      <View style={styles.version}>
        <Icon name="star" size={18} color={colors.gold} />
        <AppText variant="tiny" color={colors.textMuted}>
          {t('app.name')} · {t('settings.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
        </AppText>
      </View>

      <Dialog
        visible={confirmReset}
        title={t('settings.resetTitle')}
        body={t('settings.resetBody')}
        confirmLabel={t('settings.resetConfirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={doReset}
        onCancel={() => setConfirmReset(false)}
        destructive
      />
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="label" color={colors.textMuted} accessibilityRole="header">
        {title.toUpperCase()}
      </AppText>
      <Card style={styles.card}>{children}</Card>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  card: { gap: spacing.xs },
  langRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs, marginBottom: spacing.sm },
  lang: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  version: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
});
