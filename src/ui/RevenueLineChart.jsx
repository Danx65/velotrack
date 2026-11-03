import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Line, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useThemeColors } from '../theme/useThemeColors';

function buildSmoothPath(points) {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const middleX = (current.x + next.x) / 2;
    path += ` C ${middleX} ${current.y}, ${middleX} ${next.y}, ${next.x} ${next.y}`;
  }
  return path;
}

function formatAxisValue(value) {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`;
  }
  return `R$ ${Math.round(value)}`;
}

export default function RevenueLineChart({ data = [], height = 200 }) {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const [width, setWidth] = useState(0);

  const points = Array.isArray(data) ? data : [];
  const values = points.map(item => Number(item.value) || 0);
  const rawMax = Math.max(...values, 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const niceMax = Math.ceil((rawMax * 1.12) / magnitude) * magnitude;
  const hasValues = values.some(value => value > 0);

  const axisValues = [niceMax, niceMax * 0.75, niceMax * 0.5, niceMax * 0.25, 0];
  const axisWidth = 64;
  const chartWidth = Math.max(0, width - axisWidth);
  const topInset = 14;
  const bottomInset = 14;
  const plotHeight = height - topInset - bottomInset;
  const usableWidth = Math.max(0, chartWidth - 16);

  const chartPoints = points.map((item, index) => {
    const x = points.length > 1
      ? 8 + (index * usableWidth) / (points.length - 1)
      : chartWidth / 2;
    const ratio = niceMax > 0 ? (Number(item.value) || 0) / niceMax : 0;
    const y = topInset + plotHeight - ratio * plotHeight;
    return { x, y };
  });

  const linePath = buildSmoothPath(chartPoints);
  const lastPoint = chartPoints[chartPoints.length - 1];
  const areaPath = chartPoints.length > 1
    ? `${linePath} L ${lastPoint.x} ${topInset + plotHeight} L ${chartPoints[0].x} ${topInset + plotHeight} Z`
    : '';

  return (
    <View style={styles.container} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {!hasValues ? (
        <View style={[styles.emptyBox, { height }]}>
          <Text style={styles.emptyText}>Sem dados no período</Text>
        </View>
      ) : null}

      <View style={[styles.body, !hasValues && styles.hidden]}>
        <View style={[styles.axis, { height }]}>
          {axisValues.map((value, index) => (
            <Text key={index} style={styles.axisLabel}>{formatAxisValue(value)}</Text>
          ))}
        </View>

        <View style={[styles.plotWrap, { height }]}>
          <View style={[styles.plotArea, { top: topInset, height: plotHeight }]}>
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

          {width > 0 ? (
            <Svg
              width={chartWidth}
              height={height}
              style={styles.svg}
              viewBox={`0 0 ${chartWidth} ${height}`}
            >
              <Defs>
                <LinearGradient id="vtRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={colors.primary} stopOpacity="0.18" />
                  <Stop offset="1" stopColor={colors.primary} stopOpacity="0" />
                </LinearGradient>
              </Defs>
              {areaPath ? <Path d={areaPath} fill="url(#vtRevenueGradient)" /> : null}
              <Path
                d={linePath}
                stroke={colors.primary}
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {lastPoint ? (
                <Circle
                  cx={lastPoint.x}
                  cy={lastPoint.y}
                  r="4.5"
                  fill={colors.primary}
                  stroke={colors.surface}
                  strokeWidth="2"
                />
              ) : null}
            </Svg>
          ) : null}
        </View>
      </View>

      <View style={[styles.labelsRow, { paddingLeft: axisWidth }]}>
        {points.map((item, index) => (
          <Text key={`${item.label}-${index}`} style={styles.labelText}>{item.label}</Text>
        ))}
      </View>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    width: '100%',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  hidden: {
    opacity: 0,
    height: 0,
  },
  axis: {
    width: 64,
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  axisLabel: {
    fontSize: 9.5,
    fontWeight: '500',
    color: colors.textMuted,
    textAlign: 'right',
  },
  plotWrap: {
    flex: 1,
    position: 'relative',
  },
  plotArea: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  labelText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.4,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
