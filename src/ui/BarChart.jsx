import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { radii, spacing } from '../theme/colors';
import { useThemeColors } from '../theme/useThemeColors';

export default function BarChart({ data = [], title, height = 160 }) {
  const animRef = useRef([]);
  const colors = useThemeColors();
  const styles = getStyles(colors);

  if (animRef.current.length !== data.length) {
    animRef.current = data.map((_, i) => animRef.current[i] || new Animated.Value(0));
  }
  const animations = animRef.current;

  useEffect(() => {
    if (data.length > 0) {
      Animated.stagger(
        80,
        animations.map(anim =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: false,
          })
        )
      ).start();
    }
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height: height + 50 }]}>
        {title && <Text style={styles.title}>{title}</Text>}
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Sem dados</Text>
        </View>
      </View>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}

      <View style={[styles.chartArea, { height }]} >
        {data.map((item, index) => {
          const anim = animations[index];
          const percentage = (item.value / maxValue) * 100;

          return (
            <View key={index} style={styles.barContainer}>
              <Text style={styles.valueText}>{item.value}</Text>
              <View style={styles.barTrack}>
                <Animated.View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: item.color || colors.primary,
                      height: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', `${percentage}%`]
                      })
                    }
                  ]}
                />
              </View>
              <Text style={styles.labelText}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: spacing.lg,
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  valueText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  barTrack: {
    flex: 1,
    width: 16,
    justifyContent: 'flex-end',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
  },
  labelText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
  },
});

