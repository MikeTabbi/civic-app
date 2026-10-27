/** v10 "Elevated UI" civic palette. Level colors never represent parties. */

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
  /** Accent tone that passes contrast when used as text on bg/surface. */
  accentText: string;
  onAccent: string;
  accentTint: string;
  done: string;
  onDone: string;
  empty: string;
  emptyBorder: string;
  primary: { bg: string; fg: string };
  lime: string;
  forest: string;
  level: {
    federal: { tint: string; ink: string };
    state: { tint: string; ink: string };
    local: { tint: string; ink: string };
  };
  /** Daily Drop palette. */
  drop: {
    bg: string;
    text: string;
    track: string;
    card: string;
    cardText: string;
    cardMuted: string;
    /** Unpicked quick-check choice on the card. */
    cardSub: string;
    cardAccent: string;
    btnBg: string;
    btnFg: string;
  };
};

export const civicLight: ThemeTokens = {
  scheme: 'light',
  bg: '#FAF9F5',
  surface: '#FFFFFF',
  sub: '#F0F1EA',
  line: '#E4E5DC',
  navLine: '#E4E5DC',
  avatar: '#EAEDE0',
  text: '#203E35',
  muted: '#3F5148',
  faint: '#586257',
  accent: '#517045',
  accentText: '#517045',
  onAccent: '#FFFFFF',
  accentTint: 'rgba(81,112,69,0.10)',
  done: '#203E35',
  onDone: '#DDEE95',
  empty: '#ECEDE6',
  emptyBorder: '#CFD3C6',
  primary: { bg: '#203E35', fg: '#DDEE95' },
  lime: '#DDEE95',
  forest: '#203E35',
  level: {
    federal: { tint: '#EAEDE0', ink: '#3F5A34' },
    state: { tint: '#E7E5F0', ink: '#4A4566' },
    local: { tint: '#F2E5DA', ink: '#7A4A2E' },
  },
  drop: {
    bg: '#203E35',
    text: '#FAF9F5',
    track: 'rgba(250,249,245,0.22)',
    card: '#FAF9F5',
    cardText: '#203E35',
    cardMuted: '#3F5148',
    cardSub: '#EAEDE0',
    cardAccent: '#517045',
    btnBg: '#DDEE95',
    btnFg: '#203E35',
  },
};

export const civicDark: ThemeTokens = {
  scheme: 'dark',
  bg: '#13201B',
  surface: '#1C2D27',
  sub: '#182722',
  line: '#2A3D35',
  navLine: '#22332C',
  avatar: '#2D493F',
  text: '#F3F2EC',
  muted: '#C8D3B8',
  faint: '#9FAE9A',
  accent: '#DDEE95',
  accentText: '#DDEE95',
  onAccent: '#203E35',
  accentTint: 'rgba(221,238,149,0.12)',
  done: '#DDEE95',
  onDone: '#203E35',
  empty: '#1C2D27',
  emptyBorder: '#2D493F',
  primary: { bg: '#DDEE95', fg: '#203E35' },
  lime: '#DDEE95',
  forest: '#2D493F',
  level: {
    federal: { tint: '#22352B', ink: '#C8D3B8' },
    state: { tint: '#2A2938', ink: '#D3CFEA' },
    local: { tint: '#382B22', ink: '#EBC9AE' },
  },
  drop: {
    bg: '#13201B',
    text: '#F3F2EC',
    track: 'rgba(243,242,236,0.16)',
    card: '#1C2D27',
    cardText: '#F3F2EC',
    cardMuted: '#C8D3B8',
    cardSub: '#22352B',
    cardAccent: '#DDEE95',
    btnBg: '#DDEE95',
    btnFg: '#203E35',
  },
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;
export const radius = { sm: 12, md: 16, lg: 20, xl: 24, xxl: 28, pill: 999 } as const;

export const fonts = {
  display: 'InterTight_700Bold',
  displayMedium: 'InterTight_500Medium',
  body: 'InterTight_400Regular',
  bodyMedium: 'InterTight_500Medium',
  bodySemi: 'InterTight_600SemiBold',
  bodyHeavy: 'InterTight_800ExtraBold',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
} as const;
