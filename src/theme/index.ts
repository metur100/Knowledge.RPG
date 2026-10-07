import type { AreaId } from '@/models';

export const colors = {
  night: '#14173A',
  nightSoft: '#232861',
  nightLine: '#343B7A',
  primary: '#0F7A6E',
  primaryDark: '#0A5B52',
  primarySoft: '#D7F0EC',
  gold: '#F2B544',
  goldDeep: '#A86F00',
  goldSoft: '#FDF0D2',
  sand: '#FBF5EA',
  card: '#FFFFFF',
  cardAlt: '#F4EEE2',
  border: '#E6DCCB',
  text: '#1D1F33',
  textMuted: '#555A75',
  textOnDark: '#FFFFFF',
  textOnDarkMuted: '#C9CCEA',
  success: '#1F8A4C',
  successSoft: '#DDF3E5',
  error: '#C0392B',
  errorSoft: '#FBE3E0',
  info: '#2C6BC9',
  infoSoft: '#E1ECFB',
  locked: '#8D90A6',
  overlay: 'rgba(10, 12, 35, 0.6)',
} as const;

export interface AreaTheme {
  gradient: [string, string];
  accent: string;
  icon: string;
}

export const areaThemes: Record<AreaId, AreaTheme> = {
  salah: { gradient: ['#1F4E6B', '#3F8E9C'], accent: '#2F7E8C', icon: 'mosque' },
  quran: { gradient: ['#17306B', '#2F5AA8'], accent: '#2F5AA8', icon: 'quran' },
  seerah: { gradient: ['#7A3B1C', '#C0703A'], accent: '#B0602E', icon: 'scroll' },
  prophets: { gradient: ['#4A3270', '#7E5AA8'], accent: '#6E4AA0', icon: 'flag' },
  akhlaq: { gradient: ['#1F6B4C', '#4FA36B'], accent: '#2F8A5A', icon: 'heart' },
  ramadan: { gradient: ['#33195F', '#6E43AE'], accent: '#5E36A0', icon: 'moon' },
  history: { gradient: ['#5B4A1E', '#A88A3C'], accent: '#8A6E22', icon: 'shield' },
  arabic: { gradient: ['#7D2A44', '#C4584E'], accent: '#B0434F', icon: 'letter' },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 } as const;

export const fonts = {
  regular: 'Nunito_400Regular',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  heavy: 'Nunito_800ExtraBold',
  arabic: 'NotoNaskhArabic_400Regular',
  arabicBold: 'NotoNaskhArabic_700Bold',
  quran: 'AmiriQuran_400Regular',
} as const;

export const typeScale = {
  display: 30,
  title: 24,
  heading: 20,
  body: 16,
  small: 14,
  tiny: 12,
} as const;

/** Minimum touch target recommended by platform accessibility guidelines. */
export const TOUCH_TARGET = 48;

export const shadow = {
  card: {
    shadowColor: '#1D1F33',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  raised: {
    shadowColor: '#1D1F33',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} as const;
