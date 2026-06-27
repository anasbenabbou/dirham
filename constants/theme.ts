/**
 * Dirham design system — single source of truth for color, spacing, radius,
 * typography and elevation. Two palettes (dark = default, light) share the
 * exact same token *shape*, so any component styled against `Theme` works in
 * both. Never hard-code a hex value in a screen again — pull from here.
 */
import { Platform } from 'react-native';

/* ── Semantic color tokens ─────────────────────────────────────────────── */
export interface ThemeColors {
  /** App background (furthest back) */
  bg: string;
  /** Slightly raised background (headers, sheets) */
  bgElevated: string;
  /** Card / panel surface */
  card: string;
  /** Card raised one level (nested panels, pressed) */
  cardAlt: string;
  /** Inputs, pills, inactive segments */
  surface: string;

  /** Brand accent — primary actions, active states */
  primary: string;
  /** Faint primary tint for backgrounds/badges */
  primarySoft: string;
  /** Premium highlight (gold) used sparingly */
  gold: string;

  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;

  text: string;
  textSecondary: string;
  textTertiary: string;
  /** Text/icon that sits on top of a primary-filled surface */
  onPrimary: string;

  border: string;
  borderStrong: string;

  tabBar: string;
  overlay: string;
  /** Always-light value for content drawn on colored cards */
  white: string;
}

const dark: ThemeColors = {
  bg:            '#0B0E11',
  bgElevated:    '#12161C',
  card:          '#161B22',
  cardAlt:       '#1C232C',
  surface:       '#202833',

  primary:       '#3D7BFF',
  primarySoft:   'rgba(61,123,255,0.16)',
  gold:          '#F0B90B',

  success:       '#0ECB81',
  successSoft:   'rgba(14,203,129,0.16)',
  danger:        '#F6465D',
  dangerSoft:    'rgba(246,70,93,0.16)',
  warning:       '#F0B90B',
  warningSoft:   'rgba(240,185,11,0.16)',

  text:          '#EAECEF',
  textSecondary: '#848E9C',
  textTertiary:  '#5E6673',
  onPrimary:     '#FFFFFF',

  border:        '#252D38',
  borderStrong:  '#323C4A',

  tabBar:        '#0E1217',
  overlay:       'rgba(0,0,0,0.66)',
  white:         '#FFFFFF',
};

const light: ThemeColors = {
  bg:            '#F4F6FB',
  bgElevated:    '#FFFFFF',
  card:          '#FFFFFF',
  cardAlt:       '#F4F6FB',
  surface:       '#EDF1F8',

  primary:       '#0057FF',
  primarySoft:   'rgba(0,87,255,0.10)',
  gold:          '#E0A100',

  success:       '#00B47E',
  successSoft:   'rgba(0,180,126,0.12)',
  danger:        '#F0334B',
  dangerSoft:    'rgba(240,51,75,0.10)',
  warning:       '#E08600',
  warningSoft:   'rgba(224,134,0,0.12)',

  text:          '#0A1628',
  textSecondary: '#5B6B8C',
  textTertiary:  '#9AA7C0',
  onPrimary:     '#FFFFFF',

  border:        '#E5EAF2',
  borderStrong:  '#D4DCE8',

  tabBar:        '#FFFFFF',
  overlay:       'rgba(10,22,40,0.45)',
  white:         '#FFFFFF',
};

/* ── Shared scales (theme-independent) ─────────────────────────────────── */
export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
} as const;

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 20, xxl: 26, pill: 999,
} as const;

export const font = {
  /** Tabular-ish weight ramp used across the app */
  display:  { fontSize: 38, fontWeight: '800' as const, letterSpacing: -1 },
  title:    { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.4 },
  heading:  { fontSize: 17, fontWeight: '700' as const },
  body:     { fontSize: 15, fontWeight: '500' as const },
  label:    { fontSize: 13, fontWeight: '600' as const },
  caption:  { fontSize: 12, fontWeight: '500' as const },
  micro:    { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.6, textTransform: 'uppercase' as const },
} as const;

/* ── Elevation — subtle on dark (relies on borders), softer floats ─────── */
function makeShadows(scheme: 'dark' | 'light') {
  const c = scheme === 'dark' ? '#000' : '#1B2A4A';
  return {
    card: Platform.select({
      ios: {
        shadowColor: c,
        shadowOffset: { width: 0, height: scheme === 'dark' ? 8 : 6 },
        shadowOpacity: scheme === 'dark' ? 0.35 : 0.08,
        shadowRadius: 16,
      },
      android: { elevation: scheme === 'dark' ? 0 : 3 },
      default: {},
    })!,
    float: Platform.select({
      ios: {
        shadowColor: c,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: scheme === 'dark' ? 0.5 : 0.22,
        shadowRadius: 20,
      },
      android: { elevation: 12 },
      default: {},
    })!,
  };
}

export interface Theme {
  scheme: 'dark' | 'light';
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  font: typeof font;
  shadow: ReturnType<typeof makeShadows>;
}

export const darkTheme: Theme = {
  scheme: 'dark', colors: dark, spacing, radius, font, shadow: makeShadows('dark'),
};
export const lightTheme: Theme = {
  scheme: 'light', colors: light, spacing, radius, font, shadow: makeShadows('light'),
};

export type ThemeMode = 'dark' | 'light' | 'system';
