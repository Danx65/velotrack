import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '../theme/colors';
import { useThemeColors } from '../theme/useThemeColors';

const MEDAL_COLORS = ['#F59E0B', '#94A3B8', '#CD7F32'];
const AVATAR_BG = [
  'rgba(230,0,80,0.08)',
  'rgba(59,130,246,0.08)',
  'rgba(16,185,129,0.08)',
  'rgba(139,92,246,0.08)',
  'rgba(245,158,11,0.08)',
];
const AVATAR_COLOR = ['#E60050', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];

export default function RankingCard({ position, nome, total, isCurrentUser = false }) {
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const initials = (nome || 'TK')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const avatarBg = AVATAR_BG[(position - 1) % AVATAR_BG.length];
  const avatarColor = AVATAR_COLOR[(position - 1) % AVATAR_COLOR.length];
  const isTopThree = position <= 3;

  return (
    <View style={[
      styles.container,
      isCurrentUser && styles.currentUser,
    ]}>
      {/* Avatar com iniciais */}
      <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
        <Text style={[styles.avatarText, { color: avatarColor }]}>
          {initials}
        </Text>
      </View>

      {/* Nome e posição */}
      <View style={styles.nameCol}>
        <Text style={styles.name} numberOfLines={1}>{nome}</Text>
        <Text style={styles.posLabel}>
          {isTopThree ? `#${position} Top Ranking` : `Posição #${position}`}
        </Text>
      </View>

      {/* Score + Troféu */}
      <View style={styles.scoreRight}>
        <View style={styles.scoreRow}>
          <Text style={[
            styles.scoreValue,
            { color: isTopThree ? MEDAL_COLORS[position - 1] : colors.primary }
          ]}>
            {total}
          </Text>
          {isTopThree && (
            <Ionicons
              name="trophy"
              size={13}
              color={MEDAL_COLORS[position - 1]}
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
        <Text style={styles.scoreLabel}>serviços</Text>
      </View>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.isDark ? 'rgba(255,255,255,0.02)' : '#FAFAFA',
    borderRadius: radii.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  currentUser: {
    backgroundColor: colors.primarySoft,
    borderColor: 'rgba(230,0,80,0.18)',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
  },
  nameCol: {
    flex: 1,
    gap: 1,
  },
  name: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  posLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
  scoreRight: {
    alignItems: 'flex-end',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  scoreLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
  },
});
