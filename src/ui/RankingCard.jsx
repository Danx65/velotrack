import { View, Text, StyleSheet } from 'react-native';
import { spacing } from '../theme/colors';
import { useThemeColors } from '../theme/useThemeColors';

export default function RankingCard({ position, nome, total, isCurrentUser = false, max = 0 }) {
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const safeMax = Math.max(Number(max) || 0, Number(total) || 0, 1);
  const percentage = Math.min(100, ((Number(total) || 0) / safeMax) * 100);
  const isTop = position <= 3;

  const rankStyle = position === 1
    ? { backgroundColor: colors.primarySoft, color: colors.primary }
    : position === 2
      ? { backgroundColor: colors.surfaceElevated, color: colors.textSecondary }
      : { backgroundColor: colors.surfaceElevated, color: colors.textMuted };

  return (
    <View style={[styles.container, isCurrentUser && styles.currentUser]}>
      <View style={[styles.rankBadge, { backgroundColor: rankStyle.backgroundColor }]}>
        <Text style={[styles.rankText, { color: rankStyle.color }]}>{position}</Text>
      </View>

      <Text style={styles.name} numberOfLines={1}>{nome}</Text>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              backgroundColor: isTop ? colors.primary : colors.textMuted,
            },
          ]}
        />
      </View>

      <View style={styles.totalBox}>
        <Text style={styles.totalValue}>{total}</Text>
        <Text style={styles.totalLabel}>OS</Text>
      </View>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    marginBottom: 2,
  },
  currentUser: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
  },
  rankBadge: {
    width: 20,
    height: 20,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 9,
    fontWeight: '800',
  },
  name: {
    flex: 1.25,
    color: colors.text,
    fontSize: 11.5,
    fontWeight: '600',
  },
  track: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  totalBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    minWidth: 38,
    justifyContent: 'flex-end',
  },
  totalValue: {
    color: colors.text,
    fontSize: 11.5,
    fontWeight: '800',
  },
  totalLabel: {
    color: colors.textMuted,
    fontSize: 8.5,
    fontWeight: '700',
  },
});
