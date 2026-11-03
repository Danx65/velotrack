import { View, Text, StyleSheet, Platform } from 'react-native';
import { radii, spacing } from '../theme/colors';
import { useThemeColors } from '../theme/useThemeColors';

export function Card({ children, style, padded = true }) {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  return (
    <View style={[
      styles.card, 
      padded && styles.padded, 
      style
    ]}>
      {children}
    </View>
  );
}

export function CardSection({ label, children, style }) {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  return (
    <View style={[styles.section, style]}>
      {label && <Text style={styles.sectionLabel}>{label}</Text>}
      {children}
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    // Hairline em ambos os temas para um acabamento mais preciso
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    alignSelf: 'stretch',
    // Sombra difusa em camadas, com subtom quente no light
    ...Platform.select({
      web: {
        boxShadow: colors.isDark
          ? '0 1px 2px rgba(0,0,0,0.4), 0 18px 40px rgba(0,0,0,0.35)'
          : '0 1px 2px rgba(42,16,32,0.04), 0 18px 40px -12px rgba(42,16,32,0.10)',
      },
      default: {
        shadowColor: colors.shadowColor,
        shadowOffset: colors.shadowOffsetDesktop || { width: 0, height: 8 },
        shadowOpacity: colors.shadowOpacityDesktop || 0.08,
        shadowRadius: colors.shadowRadiusDesktop || 24,
        elevation: colors.isDark ? 6 : 3,
      }
    }),
  },
  padded: {
    padding: spacing['2xl'],
  },
  section: {
    marginBottom: spacing.xs,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.lg,
  },
});
