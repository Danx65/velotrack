import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { radii, spacing } from '../theme/colors';
import { useThemeColors } from '../theme/useThemeColors';
import { historyService } from '../services/history';
import { Skeleton } from '../ui/Skeleton';
import { Feather } from '@expo/vector-icons';

const ACTION_CONFIG = {
  created:               { color: '#E60050', icon: 'plus-circle',      label: 'OS Criada' },
  technician_assigned:   { color: '#E60050', icon: 'user-plus',        label: 'Técnico Atribuído' },
  technician_changed:    { color: '#FF7300', icon: 'users',            label: 'Técnico Alterado' },
  status_changed:        { color: '#38A169', icon: 'sliders',          label: 'Status Alterado' },
  started:               { color: '#2B6CB0', icon: 'play-circle',      label: 'Execução Iniciada' },
  finished:              { color: '#319795', icon: 'check-circle',     label: 'OS Finalizada' },
  checklist_updated:     { color: '#319795', icon: 'clipboard',        label: 'Checklist Atualizado' },
  observation_added:     { color: '#ECC94B', icon: 'message-square',   label: 'Observação Adicionada' },
  photo_added:           { color: '#9F7AEA', icon: 'image',            label: 'Foto Anexada' },
  priority_changed:      { color: '#E53E3E', icon: 'alert-triangle',   label: 'Prioridade Ajustada' },
  edited:                { color: '#4A5568', icon: 'edit-2',           label: 'Cadastro Atualizado' },
};

function formatTime(d) {
  if (!d) return '';
  const date = new Date(d);
  const now = new Date();
  
  const isToday = date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  // Create temporary copy of now to check yesterday
  const yesterdayCheck = new Date();
  yesterdayCheck.setDate(yesterdayCheck.getDate() - 1);
  const isYesterday = yesterdayCheck.toDateString() === date.toDateString();

  const timesStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return `Hoje às ${timesStr}`;
  }
  if (isYesterday) {
    return `Ontem às ${timesStr}`;
  }
  
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' às ' + timesStr;
}

export default function ServiceTimeline({ serviceId }) {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serviceId) return;
    let mounted = true;
    setLoading(true);
    historyService.getByService(serviceId)
      .then(data => {
        if (mounted) {
          setEvents(data || []);
          setLoading(false);
        }
      })
      .catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [serviceId]);

  if (loading) {
    return (
      <View style={styles.wrapper}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Timeline Operacional</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Skeleton width="100%" height={24} style={{ marginBottom: 12, borderRadius: 6 }} />
          <Skeleton width="80%" height={24} style={{ marginBottom: 12, borderRadius: 6 }} />
          <Skeleton width="60%" height={24} style={{ borderRadius: 6 }} />
        </View>
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={styles.wrapper}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Timeline Operacional</Text>
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Feather name="activity" size={18} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Sem eventos registrados para esta ordem de serviço.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Timeline Operacional</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {events.map((event, i) => {
          const cfg = ACTION_CONFIG[event.action] || { color: '#E60050', icon: 'info', label: event.action };
          const userName = event.users?.nome || 'Velotrack System';
          const isLast = i === events.length - 1;
          
          return (
            <View key={event.id || i} style={styles.row}>
              {/* Timeline Track segment */}
              <View style={styles.trackCol}>
                <View style={[styles.iconContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  <Feather name={cfg.icon} size={11} color={cfg.color} />
                </View>
                {!isLast && <View style={[styles.trackLine, { backgroundColor: colors.border }]} />}
              </View>

              {/* Event Info Card */}
              <View style={styles.contentCol}>
                <View style={styles.titleRow}>
                  <Text style={[styles.label, { color: colors.text }]}>{cfg.label}</Text>
                  <Text style={styles.time}>{formatTime(event.created_at)}</Text>
                </View>
                
                {event.description ? (
                  <Text style={[styles.description, { color: colors.textSecondary }]}>{event.description}</Text>
                ) : null}

                <View style={styles.actorRow}>
                  <Feather name="user" size={10} color={colors.textMuted} style={{ marginRight: 4 }} />
                  <Text style={[styles.user, { color: colors.textMuted }]}>{userName}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  wrapper: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  trackCol: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  iconContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  trackLine: {
    position: 'absolute',
    top: 26,
    bottom: 0,
    width: 1.5,
    backgroundColor: colors.border,
    zIndex: 1,
  },
  contentCol: {
    marginLeft: spacing.xs,
    flex: 1,
    paddingBottom: spacing.lg,
    paddingTop: 2,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 0.2,
  },
  time: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  description: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  actorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  user: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
});

