import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, Platform } from 'react-native';
import { radii } from '../theme/colors';
import { useThemeColors } from '../theme/useThemeColors';

const SIZES = {
  sm: { height: 34, paddingHorizontal: 14, fontSize: 12, borderRadius: radii.md },
  md: { height: 42, paddingHorizontal: 18, fontSize: 13, borderRadius: radii.md },
  lg: { height: 48, paddingHorizontal: 22, fontSize: 14, borderRadius: radii.md },
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
        ? '0 4px 14px rgba(230,0,80,0.30), 0 1px 4px rgba(230,0,80,0.15)'
        : null,
    },
    secondary: {
      bg: colors.isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
      text: colors.text,
      border: colors.border,
      shadow: null,
    },
    outline: {
      bg: 'transparent',
      text: colors.text,
      border: colors.border,
      shadow: null,
    },
    success: {
      bg: colors.success,
      text: '#FFF',
      border: null,
      shadow: Platform.OS === 'web'
        ? '0 4px 12px rgba(16,185,129,0.28)'
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
