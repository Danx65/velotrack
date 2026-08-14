import { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '../theme/colors';
import { useThemeColors } from '../theme/useThemeColors';
import { StatusBadge, PriorityBadge } from './Badge';

function ServiceCard({ service, onPress, compact = false }) {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  if (!service) return null;

  const isAlta = service.priority === 'alta';
  const isConcluido = service.status === 'concluido';

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const today = new Date();
    const isToday = date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) +
      ' • ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (inicio, fim) => {
    if (!inicio || !fim) return null;
    const diff = Math.floor((new Date(fim) - new Date(inicio)) / 1000);
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  // Select micro colors for action tags
  const getTipoColors = (tipo) => {
    const t = (tipo || '').toLowerCase();
    const isDarkTheme = colors.text === '#FFFFFF';
    if (t.includes('instala')) return { bg: colors.primarySoft, text: colors.primary, border: 'rgba(230,0,80,0.15)' };
    if (t.includes('manuten')) return { bg: colors.warningSoft, text: colors.warning, border: 'rgba(245,158,11,0.15)' };
    if (t.includes('retira')) return { bg: colors.errorSoft, text: colors.error, border: 'rgba(239,68,68,0.15)' };
    return { 
      bg: isDarkTheme ? 'rgba(255,255,255,0.04)' : '#E5E7EB', 
      text: colors.textSecondary, 
      border: colors.border 
    };
  };

  const tipoColorSet = getTipoColors(service.tipo);
  const durationStr = isConcluido ? formatDuration(service.tempo_inicio, service.tempo_fim) : null;

  const valServico = service.valor_servico || service.metadata?.billing?.valServico;
  const formaPagamento = service.forma_pagamento || service.metadata?.billing?.formaPagamento || 'Pix';
  const isPago = service.status_pagamento === 'pago' || service.metadata?.billing?.isPago;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        isAlta && !isConcluido && styles.cardAlta,
        isConcluido && styles.cardConcluido,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      disabled={!onPress}
    >
      <View style={styles.top}>
        <View style={styles.topLeft}>
          <View style={[
            styles.avatar, 
            { backgroundColor: colors.primarySoft, borderColor: 'rgba(230,0,80,0.15)' },
            isConcluido && styles.avatarConcluido
          ]}>
            <Text style={[styles.avatarText, isConcluido && styles.avatarTextConcluido]}>
              {service.cliente?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '--'}
            </Text>
          </View>
          <View style={styles.info}>
            <View style={styles.clientRow}>
              <Text style={styles.clientName} numberOfLines={1}>{service.cliente}</Text>
              <View style={[styles.tipoPill, { backgroundColor: tipoColorSet.bg, borderColor: tipoColorSet.border }]}>
                <Text style={[styles.tipoText, { color: tipoColorSet.text }]}>{service.tipo || 'Geral'}</Text>
              </View>
            </View>
            <Text style={styles.vehicleInfo} numberOfLines={1}>
              {service.veiculo}{service.placa ? ` • ${service.placa}` : ''}
            </Text>
          </View>
        </View>
        <PriorityBadge priority={service.priority} size="sm" />
      </View>

      {valServico && valServico !== '0,00' ? (
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={13} color={colors.success} />
          <Text style={[styles.detailText, { fontWeight: '700', color: colors.text }]}>
            R$ {valServico} <Text style={{ fontWeight: '400', color: colors.textMuted }}>• {formaPagamento}</Text>
          </Text>
          <View style={[
            styles.payPill, 
            { backgroundColor: isPago ? colors.successSoft : colors.warningSoft, borderColor: isPago ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)' }
          ]}>
            <Text style={[styles.payPillText, { color: isPago ? colors.success : colors.warning }]}>
              {isPago ? 'PAGO' : 'FATURAMENTO PENDENTE'}
            </Text>
          </View>
        </View>
      ) : null}

      {service.endereco ? (
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={13} color={colors.textMuted} />
          <Text style={styles.detailText} numberOfLines={1}>{service.endereco}</Text>
        </View>
      ) : null}

      {!compact && service.users?.nome && (
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={13} color={colors.textMuted} />
          <Text style={styles.detailText} numberOfLines={1}>
            Técnico: <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>{service.users.nome}</Text>
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <StatusBadge status={service.status} size="sm" />
        <View style={styles.footerRight}>
          {durationStr && (
            <View style={styles.durationBadge}>
              <Ionicons name="hourglass-outline" size={11} color={colors.success} />
              <Text style={styles.durationValue}>{durationStr}</Text>
            </View>
          )}
          <Ionicons name="time-outline" size={13} color={colors.textMuted} />
          <Text style={styles.timeText}>{formatDate(service.created_at)}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default memo(ServiceCard);

const getStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    shadowColor: colors.shadowColor,
    shadowOffset: colors.shadowOffsetDesktop || { width: 0, height: 4 },
    shadowOpacity: colors.shadowOpacityDesktop || 0.05,
    shadowRadius: colors.shadowRadiusDesktop || 12,
  },
  cardAlta: {
    borderLeftWidth: 3.5,
    borderLeftColor: colors.error,
  },
  cardConcluido: {
    borderLeftWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    opacity: 0.9,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
    marginRight: spacing.sm,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99,91,255,0.12)',
  },
  avatarConcluido: {
    backgroundColor: colors.successSoft,
    borderColor: 'rgba(16,185,129,0.15)',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  avatarTextConcluido: {
    color: colors.success,
  },
  info: {
    flex: 1,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  clientName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.1,
  },
  tipoPill: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  tipoText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  vehicleInfo: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
    paddingLeft: 2,
  },
  detailText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  payPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
    borderWidth: 1,
    marginLeft: 'auto',
  },
  payPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.15)',
    marginRight: 4,
    gap: 3,
  },
  durationValue: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.success,
  },
  timeText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
