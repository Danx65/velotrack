import { View, Text, StyleSheet } from 'react-native';
import { radii } from '../theme/colors';
import { useThemeColors } from '../theme/useThemeColors';

export function StatusBadge({ status, size = 'sm' }) {
  const colors = useThemeColors();

  const STATUS_CONFIG = {
    pendente: {
      bg: colors.warningSoft,
      color: colors.warning,
      dotColor: '#F59E0B',
      label: 'Pendente',
    },
    em_andamento: {
      bg: 'rgba(59,130,246,0.08)',
      color: '#3B82F6',
      dotColor: '#3B82F6',
      label: 'Em rota',
    },
    concluido: {
      bg: colors.successSoft,
      color: colors.success,
      dotColor: '#10B981',
      label: 'Confirmado',
    },
    cancelado: {
      bg: colors.errorSoft,
      color: colors.error,
      dotColor: '#EF4444',
      label: 'Cancelado',
    },
  };

  const c = STATUS_CONFIG[status] || {
    bg: colors.isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
    color: colors.textMuted,
    dotColor: colors.textMuted,
    label: status,
  };

  const isLg = size === 'lg';

  return (
    <View style={[
      styles.pill,
      { backgroundColor: c.bg },
      isLg && styles.pillLg,
    ]}>
      <View style={[
        styles.dot,
        { backgroundColor: c.dotColor },
        isLg && styles.dotLg,
      ]} />
      <Text style={[
        styles.label,
        { color: c.color },
        isLg && styles.labelLg,
      ]}>
        {c.label}
      </Text>
    </View>
  );
}

export function PriorityBadge({ priority, size = 'sm' }) {
  const colors = useThemeColors();

  const PRIORITY_CONFIG = {
    alta: { color: colors.error, bg: colors.errorSoft, label: 'Alta' },
    media: { color: colors.warning, bg: colors.warningSoft, label: 'Média' },
    baixa: { color: colors.success, bg: colors.successSoft, label: 'Baixa' },
  };

  const p = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.baixa;
  const isLg = size === 'lg';

  return (
    <View style={[
      styles.prioBadge,
      { backgroundColor: p.bg, borderColor: p.color + '40' },
      isLg && styles.prioBadgeLg,
    ]}>
      <View style={[styles.dot, { backgroundColor: p.color }, isLg && styles.dotLg]} />
      <Text style={[styles.label, { color: p.color }, isLg && styles.labelLg]}>
        {p.label}
      </Text>
    </View>
  );
}

export function CountBadge({ count, color }) {
  const colors = useThemeColors();
  const finalColor = color || colors.primary;
  if (count <= 0) return null;
  return (
    <View style={[styles.countBadge, { backgroundColor: finalColor + '18' }]}>
      <Text style={[styles.countText, { color: finalColor }]}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  pillLg: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 7,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotLg: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  labelLg: {
    fontSize: 13,
    fontWeight: '600',
  },
  prioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  prioBadgeLg: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
