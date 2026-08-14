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
    borderRadius: radii.lg,
    // No light mode: sem borda, só sombra suave (como no CRM do print)
    // No dark mode: borda sutil + sombra mais intensa
    borderWidth: colors.isDark ? 1 : 0,
    borderColor: colors.isDark ? colors.border : 'transparent',
    marginBottom: spacing.lg,
    alignSelf: 'stretch',
    // Sombra difusa estilo CRM profissional
    ...Platform.select({
      web: {
        boxShadow: colors.isDark
          ? '0 4px 24px rgba(0,0,0,0.35)'
          : '0 2px 16px rgba(31,41,55,0.07), 0 1px 4px rgba(31,41,55,0.04)',
      },
      default: {
        shadowColor: colors.shadowColor,
        shadowOffset: colors.shadowOffsetDesktop || { width: 0, height: 4 },
        shadowOpacity: colors.shadowOpacityDesktop || 0.07,
        shadowRadius: colors.shadowRadiusDesktop || 16,
        elevation: colors.isDark ? 6 : 3,
      }
    }),
  },
  padded: {
    padding: spacing.xl,
  },
  section: {
    marginBottom: spacing.xs,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.lg,
  },
});
