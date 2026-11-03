import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, Platform } from 'react-native';
import { useThemeColors } from '../theme/useThemeColors';

const SIZES = {
  sm: { height: 36, paddingHorizontal: 14, fontSize: 12, borderRadius: 10 },
  md: { height: 44, paddingHorizontal: 18, fontSize: 13, borderRadius: 12 },
  lg: { height: 50, paddingHorizontal: 22, fontSize: 14, borderRadius: 13 },
};

export default function Button({
  title,
  onPress,
  loading = false,
  variant = 'primary',
  size = 'lg',
  style,
  disabled = false,
  icon,
  fullWidth = false,
}) {
  const colors = useThemeColors();

  const VARIANTS = {
    primary: {
      bg: colors.primary,
      text: '#FFF',
      border: null,
      shadow: Platform.OS === 'web'
        ? '0 8px 20px -6px rgba(230,0,80,0.45), 0 2px 6px rgba(230,0,80,0.18)'
        : null,
    },
    secondary: {
      bg: colors.surfaceElevated,
      text: colors.text,
      border: colors.border,
      shadow: Platform.OS === 'web'
        ? '0 1px 2px rgba(42,16,32,0.04)'
        : null,
    },
    outline: {
      bg: colors.isDark ? 'transparent' : colors.surface,
      text: colors.text,
      border: colors.border,
      shadow: null,
    },
    success: {
      bg: colors.success,
      text: '#FFF',
      border: null,
      shadow: Platform.OS === 'web'
        ? '0 8px 20px -6px rgba(16,185,129,0.40)'
        : null,
    },
    danger: {
      bg: colors.error,
      text: '#FFF',
      border: null,
      shadow: null,
    },
    ghost: {
      bg: 'transparent',
      text: colors.textSecondary,
      border: null,
      shadow: null,
    },
  };

  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.lg;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          height: s.height,
          paddingHorizontal: s.paddingHorizontal,
          borderRadius: s.borderRadius,
        },
        v.border && { borderWidth: 1, borderColor: v.border },
        v.shadow && Platform.OS === 'web' && { boxShadow: v.shadow },
        (disabled || loading) && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <View style={styles.row}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text style={[styles.label, { color: v.text, fontSize: s.fontSize }]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.45 },
  iconWrap: {},
  label: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
