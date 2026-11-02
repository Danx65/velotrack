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
  get bg() { return currentTheme === 'dark' ? '#060814' : '#F8FAFC'; },
  get surface() { return currentTheme === 'dark' ? '#0B0F1E' : '#FFFFFF'; },
  get card() { return currentTheme === 'dark' ? '#0E1326' : '#FFFFFF'; },
  get surfaceElevated() { return currentTheme === 'dark' ? '#181F3B' : '#F1F5F9'; },
  get primary() { return '#E60050'; },
  get primaryHover() { return '#FF1A6C'; },
  get primarySoft() { return currentTheme === 'dark' ? 'rgba(230,0,80,0.06)' : 'rgba(230,0,80,0.04)'; },
  get text() { return currentTheme === 'dark' ? '#FFFFFF' : '#0F172A'; },
  get textSecondary() { return currentTheme === 'dark' ? '#94A3B8' : '#334155'; },
  get textMuted() { return currentTheme === 'dark' ? '#64748B' : '#64748B'; },
  get success() { return '#10B981'; },
  get successSoft() { return currentTheme === 'dark' ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.06)'; },
  get warning() { return '#F59E0B'; },
  get warningSoft() { return currentTheme === 'dark' ? 'rgba(245,158,11,0.06)' : 'rgba(245,158,11,0.06)'; },
  get error() { return '#EF4444'; },
  get errorSoft() { return currentTheme === 'dark' ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.06)'; },
  get border() { return currentTheme === 'dark' ? 'rgba(255,255,255,0.05)' : '#CBD5E1'; },
  get borderLight() { return currentTheme === 'dark' ? 'rgba(255,255,255,0.1)' : '#E2E8F0'; },
  get overlay() { return currentTheme === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(15,23,42,0.4)'; },
  get skeleton() { return currentTheme === 'dark' ? '#1F2235' : '#E2E8F0'; },
  get skeletonHighlight() { return currentTheme === 'dark' ? '#2A2E4B' : '#F1F5F9'; },
  get shadowColor() { return currentTheme === 'dark' ? '#000000' : '#0F172A'; },
  get shadowOpacityDesktop() { return currentTheme === 'dark' ? 0.35 : 0.05; },
  get shadowRadiusDesktop() { return currentTheme === 'dark' ? 16 : 12; },
  get shadowOffsetDesktop() { return { width: 0, height: currentTheme === 'dark' ? 6 : 4 }; },
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
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 26,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3, lineHeight: 24 },
  subtitle: { fontSize: 15, fontWeight: '600', lineHeight: 20 },
  body: { fontSize: 14, fontWeight: '400', lineHeight: 21 },
  caption: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  overline: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, lineHeight: 14 },
};
