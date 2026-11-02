let currentTheme = 'light';
if (typeof window !== 'undefined') {
  try {
    currentTheme = window.localStorage.getItem('velotrack_theme') || 'light';
  } catch (e) {}
}

export function setTheme(mode) {
  currentTheme = mode;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('velotrack_theme', mode);
    } catch (e) {}
  }
}

export function getTheme() {
  return currentTheme;
}

export const colors = {
  get bg() { return currentTheme === 'dark' ? '#08080D' : '#F7F6F8'; },
  get surface() { return currentTheme === 'dark' ? '#0C0C12' : '#FFFFFF'; },
  get card() { return currentTheme === 'dark' ? '#101017' : '#FFFFFF'; },
  get surfaceElevated() { return currentTheme === 'dark' ? '#191923' : '#F3F1F4'; },
  get primary() { return '#E60050'; },
  get primaryHover() { return '#FF1A6C'; },
  get primarySoft() { return currentTheme === 'dark' ? 'rgba(230,0,80,0.08)' : 'rgba(230,0,80,0.055)'; },
  get text() { return currentTheme === 'dark' ? '#F7F7FA' : '#1E1C22'; },
  get textSecondary() { return currentTheme === 'dark' ? '#A6A6B2' : '#4A4750'; },
  get textMuted() { return currentTheme === 'dark' ? '#70707C' : '#8A8691'; },
  get success() { return '#10B981'; },
  get successSoft() { return currentTheme === 'dark' ? 'rgba(16,185,129,0.09)' : 'rgba(16,185,129,0.09)'; },
  get warning() { return '#F59E0B'; },
  get warningSoft() { return currentTheme === 'dark' ? 'rgba(245,158,11,0.09)' : 'rgba(245,158,11,0.09)'; },
  get error() { return '#EF4444'; },
  get errorSoft() { return currentTheme === 'dark' ? 'rgba(239,68,68,0.09)' : 'rgba(239,68,68,0.09)'; },
  get border() { return currentTheme === 'dark' ? 'rgba(255,255,255,0.07)' : '#ECEAEE'; },
  get borderLight() { return currentTheme === 'dark' ? 'rgba(255,255,255,0.12)' : '#F4F2F5'; },
  get overlay() { return currentTheme === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(24,20,28,0.45)'; },
  get skeleton() { return currentTheme === 'dark' ? '#1C1C26' : '#ECEAEE'; },
  get skeletonHighlight() { return currentTheme === 'dark' ? '#262633' : '#F8F7F9'; },
  get shadowColor() { return currentTheme === 'dark' ? '#000000' : '#2A1020'; },
  get shadowOpacityDesktop() { return currentTheme === 'dark' ? 0.45 : 0.08; },
  get shadowRadiusDesktop() { return currentTheme === 'dark' ? 24 : 24; },
  get shadowOffsetDesktop() { return { width: 0, height: 8 }; },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};

export const radii = {
  sm: 7,
  md: 11,
  lg: 16,
  xl: 20,
  '2xl': 28,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8, lineHeight: 36 },
  h2: { fontSize: 23, fontWeight: '800', letterSpacing: -0.5, lineHeight: 29 },
  h3: { fontSize: 18, fontWeight: '800', letterSpacing: -0.35, lineHeight: 24 },
  subtitle: { fontSize: 15, fontWeight: '600', lineHeight: 20 },
  body: { fontSize: 14, fontWeight: '400', lineHeight: 21 },
  caption: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  overline: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, lineHeight: 14 },
};
