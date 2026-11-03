import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '../theme/colors';
import { useThemeColors } from '../theme/useThemeColors';

export default function Input({
  label,
  error,
  icon,
  rightIcon,
  onRightPress,
  style,
  multiline,
  ...props
}) {
  const [focused, setFocused] = useState(false);
  const colors = useThemeColors();
  const styles = getStyles(colors);

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[
          styles.label, 
          { color: colors.textMuted }, 
          focused && [styles.labelFocused, { color: colors.primary }]
        ]}>
          {label}
        </Text>
      )}
      <View style={[
        styles.box,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        focused && [styles.boxFocused, { borderColor: colors.primary, backgroundColor: colors.primarySoft }],
        error && styles.boxError,
        multiline && styles.boxMultiline,
      ]}>
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? colors.primary : colors.textMuted}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={[styles.input, { color: colors.text }, multiline && styles.multiline]}
          placeholderTextColor={colors.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightPress} style={styles.rightIcon}>
            <Ionicons name={rightIcon} size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    marginBottom: spacing.sm,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  labelFocused: {
    color: colors.primary,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 48,
    ...Platform.select({
      web: {
        transitionProperty: 'border-color, background-color, box-shadow',
        transitionDuration: '160ms',
        transitionTimingFunction: 'ease',
      },
    }),
  },
  boxFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    ...Platform.select({
      web: {
        boxShadow: '0 0 0 3px rgba(230,0,80,0.10)',
      },
    }),
  },
  boxError: {
    borderColor: colors.error,
  },
  boxMultiline: {
    height: 'auto',
    minHeight: 100,
    paddingVertical: spacing.sm,
    alignItems: 'flex-start',
  },
  leftIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    height: '100%',
    outlineStyle: 'none',
    outlineWidth: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  multiline: {
    minHeight: 80,
    paddingTop: 8,
    height: 'auto',
    textAlignVertical: 'top',
  },
  rightIcon: {
    padding: 4,
    marginLeft: 8,
  },
  errorText: {
    color: colors.error,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
});

