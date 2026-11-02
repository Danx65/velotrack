import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing, typography } from '../theme/colors';
import { useThemeColors } from '../theme/useThemeColors';

export default function Header({
  title,
  subtitle,
  onBack,
  rightAction,
  rightIcon,
  onRightPress,
  style,
}) {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightAction ? (
        rightAction
      ) : rightIcon ? (
        <TouchableOpacity onPress={onRightPress} style={styles.rightBtn} activeOpacity={0.7}>
          <Ionicons name={rightIcon} size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  rightBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

