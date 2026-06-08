export const C = {
  bgBase: '#eadfd4',
  bgSurface: '#FFFFFF',
  bgSubtle: '#F2EDE8',
  brandPrimary: '#6B3F2A',
  brandSecondary: '#A0674A',
  brandMuted: '#C9A98A',
  textPrimary: '#1A1008',
  textSecondary: '#6B5B4E',
  textDisabled: '#B0A099',
  textInverse: '#FAF7F4',
  border: '#E8DDD5',
  statusSuccess: '#4A7C59',
  statusSuccessBg: 'rgba(74,124,89,0.10)',
  statusWarning: '#C48A2F',
  statusWarningBg: 'rgba(196,138,47,0.12)',
  statusError: '#B04040',
  statusErrorBg: 'rgba(176,64,64,0.10)',
  statusInfo: '#3A6B8A',
  statusInfoBg: 'rgba(58,107,138,0.10)',
};

export const CD = {
  bgBase: '#1C1410',
  bgSurface: '#261B13',
  bgSubtle: '#32221A',
  brandPrimary: '#C9A98A',
  brandSecondary: '#D4B89A',
  brandMuted: '#8B6B4E',
  textPrimary: '#FAF7F4',
  textSecondary: '#C9B5A8',
  textDisabled: '#7A6A60',
  textInverse: '#1C1410',
  border: '#3A2820',
  statusSuccess: '#6AAF79',
  statusSuccessBg: 'rgba(106,175,121,0.15)',
  statusWarning: '#D4A040',
  statusWarningBg: 'rgba(212,160,64,0.15)',
  statusError: '#C85050',
  statusErrorBg: 'rgba(200,80,80,0.15)',
  statusInfo: '#5A8BAA',
  statusInfoBg: 'rgba(90,139,170,0.15)',
};

export const Sp = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const FS = {
  overline: 11,
  caption: 12,
  label: 13,
  body: 14,
  bodyLg: 16,
  headingSm: 15,
  headingMd: 18,
  headingLg: 22,
  display: 28,
} as const;

export const R = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const cardShadow = {
  shadowColor: '#1A1008',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 3,
};

export const cardShadowMd = {
  shadowColor: '#1A1008',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.10,
  shadowRadius: 16,
  elevation: 5,
};

// Legacy exports for backwards compatibility
export const colors = {
  primary: C.brandPrimary,
  primaryLight: C.brandSecondary,
  primaryDark: '#4A3020',
  secondary: C.brandMuted,
  background: C.bgBase,
  surface: C.bgSurface,
  text: C.textPrimary,
  textMuted: C.textSecondary,
  border: C.border,
  error: C.statusError,
  success: C.statusSuccess,
  warning: C.statusWarning,
};

export const spacing = {
  xs: Sp[1],
  sm: Sp[2],
  md: Sp[4],
  lg: Sp[6],
  xl: Sp[8],
  xxl: Sp[12],
};

export const fontSizes = {
  xs: FS.caption,
  sm: FS.body,
  md: FS.bodyLg,
  lg: FS.headingMd,
  xl: FS.headingLg,
  xxl: FS.display,
};

export const borderRadius = {
  sm: R.sm,
  md: R.md,
  lg: R.lg,
  full: R.full,
};
