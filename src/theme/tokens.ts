/**
 * v8 "Orange" design tokens, copied from the final canvas (light + dark).
 * Orange is the only accent. It is never used to signal a party:
 * candidates are always shown in neutral colors.
 */

export type ThemeTokens = {
  scheme: 'light' | 'dark';
  bg: string;
  surface: string;
  sub: string;
  line: string;
  navLine: string;
  avatar: string;
  text: string;
  muted: string;
  faint: string;
  accent: string;
  /** Orange that passes contrast when used as text on bg/surface. */
  accentText: string;
  onAccent: string;
  accentTint: string;
  done: string;
  onDone: string;
  empty: string;
  emptyBorder: string;
};

export const orangeLight: ThemeTokens = {
  scheme: 'light',
  bg: '#FFFCF2',
  surface: '#FFFFFF',
  sub: '#F6F1E6',
  line: '#E2DCD0',
  navLine: '#E2DCD0',
  avatar: '#CCC5B9',
  text: '#252422',
  muted: '#403D39',
  faint: '#6B665F',
  accent: '#EB5E28',
  accentText: '#B8481C',
  onAccent: '#252422',
  accentTint: 'rgba(235,94,40,0.10)',
  done: '#8FB996',
  onDone: '#252422',
  empty: '#E8E2D6',
  emptyBorder: '#CCC5B9',
};

export const orangeDark: ThemeTokens = {
  scheme: 'dark',
  bg: '#252422',
  surface: '#403D39',
  sub: '#2E2C29',
  line: '#4A4642',
  navLine: '#33312E',
  avatar: '#5A5650',
  text: '#FFFCF2',
  muted: '#CCC5B9',
  faint: '#A39E95',
  accent: '#EB5E28',
  accentText: '#F27A4C',
  onAccent: '#252422',
  accentTint: 'rgba(235,94,40,0.16)',
  done: '#8FB996',
  onDone: '#252422',
  empty: '#403D39',
  emptyBorder: '#5A5650',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;
export const radius = { sm: 12, md: 16, lg: 20, xl: 24, pill: 999 } as const;

export const fonts = {
  display: 'SpaceGrotesk_700Bold',
  displayMedium: 'SpaceGrotesk_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyHeavy: 'Inter_800ExtraBold',
} as const;
