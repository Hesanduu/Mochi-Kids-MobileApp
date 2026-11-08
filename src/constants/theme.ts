// Design tokens for Mochi Kids.
// Every screen takes its colours, fonts and sizes from here, so a change in
// this file updates the whole app.

export const colors = {
  // From the token table in claude.md
  background: '#FAFAFA',
  surface: '#FFFFFF',
  sky: '#5CCBFF',
  skySoft: '#E8F7FF',
  blue: '#03A6FF',
  primary: '#0274BD',
  primaryShadow: '#015A93',
  yellow: '#F7CB15',
  yellowSoft: '#FFF4C7',
  green: '#8FD681',
  greenSoft: '#EEF8EA',
  red: '#F53722',
  error: '#D12C17',
  text: '#1B3A57',
  textMuted: '#56697C',
  border: '#7C8C9B',

  // Extra colours used in the mockups (not in the claude.md table)
  skyShadow: '#CFEEFF', // soft oval "shadow" under Mochi on the login header
  yellowShadow: '#D4A900', // chunky shadow under yellow buttons
  divider: '#E3EAF0', // card borders, tab bar top border
  dividerSoft: '#EEF2F5', // line between rows inside a card
  greenDark: '#2F7D22', // green icons on light green backgrounds
  focusRing: 'rgba(3, 166, 255, 0.18)', // soft glow around a focused input
  mochiHand: '#BFE3EA', // Mochi's clapping hands in the celebration
} as const;

// In React Native each font weight is its own font family name.
// These names come from @expo-google-fonts and are loaded in src/app/_layout.tsx.
export const fonts = {
  heading: 'Baloo2_800ExtraBold', // titles
  headingBold: 'Baloo2_700Bold', // buttons
  body: 'Nunito_500Medium',
  bodySemiBold: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
  bodyExtraBold: 'Nunito_800ExtraBold', // labels, links
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 24,
  pill: 999,
} as const;

// Smallest comfortable tap target (claude.md: 48×48).
export const TAP_TARGET = 48;
