import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { radii, spacing } from '../theme/colors';
import { useThemeColors } from '../theme/useThemeColors';

export default function BarChart({ data = [], title, subtitle, height = 200 }) {
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
        70,
        animations.map(anim =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 650,
            useNativeDriver: false,
          })
        )
      ).start();
    }
  }, [data]);

  const maxValue = Math.max(...data.map(d => Number(d.value) || 0), 1);
  const niceMax = Math.ceil(maxValue / 25) * 25;
  const axisValues = [niceMax, niceMax * 0.75, niceMax * 0.5, niceMax * 0.25, 0];
  const maxBarHeight = height - 28;

  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        {title && <Text style={styles.title}>{title}</Text>}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        <View style={[styles.emptyContainer, { height }]}>
          <Text style={styles.emptyText}>Sem dados no período</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerTextBox}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <Text style={styles.headerTag}>OS</Text>
      </View>

      <View style={styles.chartBody}>
        <View style={[styles.yAxis, { height }]}>
          {axisValues.map((value, index) => (
            <Text key={index} style={styles.axisLabel}>{Math.round(value)}</Text>
          ))}
        </View>

        <View style={[styles.plotArea, { height }]}>
          <View style={styles.gridLayer}>
            {axisValues.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.gridLine,
                  { top: `${(index / (axisValues.length - 1)) * 100}%` },
                ]}
              />
            ))}
          </View>

          <View style={styles.barsRow}>
            {data.map((item, index) => {
              const value = Number(item.value) || 0;
              const percentage = niceMax > 0 ? value / niceMax : 0;
              const anim = animations[index];
              const isCurrent = index === data.length - 1;

              return (
                <View key={`${item.label}-${index}`} style={styles.barColumn}>
                  <Text style={styles.valueText}>{item.value}</Text>
                  <Animated.View
                    style={[
                      styles.barFill,
                      {
                        backgroundColor: item.color || (isCurrent
                          ? colors.primary
                          : (colors.isDark ? 'rgba(230,0,80,0.28)' : '#F5DCE6')),
                        height: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, percentage * maxBarHeight],
                        }),
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.xLabelsRow}>
        {data.map((item, index) => (
          <Text key={`${item.label}-${index}`} style={styles.xLabel}>{item.label}</Text>
        ))}
      </View>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing['2xl'],
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      web: {
        boxShadow: colors.isDark
          ? '0 1px 2px rgba(0,0,0,0.4), 0 18px 40px rgba(0,0,0,0.30)'
          : '0 1px 2px rgba(42,16,32,0.04), 0 18px 40px -12px rgba(42,16,32,0.10)',
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  headerTextBox: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 3,
  },
  headerTag: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  chartBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  yAxis: {
    width: 30,
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  axisLabel: {
    fontSize: 9.5,
    color: colors.textMuted,
    fontWeight: '500',
    textAlign: 'right',
    marginTop: -5,
  },
  plotArea: {
    flex: 1,
    position: 'relative',
  },
  gridLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  barsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  valueText: {
    color: colors.textSecondary,
    fontSize: 10.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  barFill: {
    width: 24,
    borderRadius: 5,
  },
  xLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingLeft: 30,
    paddingTop: 8,
  },
  xLabel: {
    flex: 1,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
