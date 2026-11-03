import { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { radii } from '../theme/colors';
import { useThemeColors } from '../theme/useThemeColors';

export function Skeleton({ width = '100%', height = 20, borderRadius = radii.md, style }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  const colors = useThemeColors();
  const styles = getStyles(colors);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ lines = 3, style }) {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  return (
    <View style={[styles.card, style]}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === 0 ? '60%' : i === lines - 1 ? '40%' : '90%'}
          height={i === 0 ? 18 : 14}
          style={{ marginBottom: i < lines - 1 ? 10 : 0 }}
        />
      ))}
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  base: {
    backgroundColor: colors.skeleton,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

