import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { spacing, radii } from '../../src/theme/colors';
import { useThemeColors } from '../../src/theme';

import { servicosService } from '../../src/services/servicos';
import { Card, CardSection } from '../../src/ui/Card';

export default function TecnicoAgenda() {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const router = useRouter();
  const { profile } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);

  const loadAgenda = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      // List services for current active technician
      const formattedDateStr = selectedDate.toLocaleDateString('pt-BR');
      const res = await servicosService.list({
        technicianId: profile.id,
        status: ['pendente', 'em_andamento']
      });
      
      // Filter list locally to show tasks scheduled for the selected day
      const dailyTasks = (res.data || []).filter(item => {
        const itemDate = item.metadata?.schedule?.date || '';
        return itemDate === formattedDateStr;
      });

      setServices(dailyTasks);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [profile?.id, selectedDate]);

  useFocusEffect(
    useCallback(() => {
      loadAgenda();
    }, [loadAgenda])
  );

  // Calendar builders
  const getWeekDays = () => {
    const days = [];
    const now = new Date();
    for (let i = -3; i <= 3; i++) {
      const d = new Date();
      d.setDate(now.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDays();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Minha Agenda</Text>
        <Text style={styles.sub}>Planejamento de ordens e rotas alocadas</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* WEEK HORIZONTAL SELECTOR */}
        <Card style={styles.calendarCard}>
          <CardSection label="Seletor de Data Rápido">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekRow}>
              {weekDays.map((day, idx) => {
                const isSelected = day.toDateString() === selectedDate.toDateString();
                const dayLabel = day.toLocaleString('pt-BR', { weekday: 'short' }).substring(0, 3).toUpperCase();
                return (
                  <Pressable
                    key={idx}
                    onPress={() => setSelectedDate(day)}
                    style={[
                      styles.dayButton,
                      { borderColor: colors.border },
                      isSelected && [styles.dayButtonActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
                    ]}
                  >
                    <Text style={[styles.dayLabelText, isSelected && styles.textActive]}>{dayLabel}</Text>
                    <Text style={[styles.dayNum, { color: colors.text }, isSelected && styles.textActive]}>{day.getDate()}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </CardSection>
        </Card>

        {/* AGENDA WORK ITEMS LIST */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Compromissos para {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 24 }} />
        ) : services.length > 0 ? (
          <View style={styles.list}>
            {services.map((item) => {
              const schedule = item.metadata?.schedule || {};
              const location = item.metadata?.location || {};
              return (
                <Pressable
                  key={item.id}
                  onPress={() => router.push(`/(tecnico)/servico/${item.id}`)}
                  style={[styles.serviceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.timeBox}>
                    <Ionicons name="time-outline" size={14} color={colors.primary} />
                    <Text style={[styles.timeText, { color: colors.text }]}>{schedule.time || '12:00'}</Text>
                  </View>

                  <View style={styles.cardHeader}>
                    <Text style={[styles.clientName, { color: colors.text }]} numberOfLines={1}>
                      {item.cliente}
                    </Text>
                    <View style={[
                      styles.badge, 
                      item.status === 'em_andamento' ? styles.badgeActive : { backgroundColor: 'rgba(255,255,255,0.05)' }
                    ]}>
                      <Text style={[
                        styles.badgeText, 
                        item.status === 'em_andamento' ? { color: '#FFFFFF' } : { color: colors.textMuted }
                      ]}>
                        {item.status === 'em_andamento' ? 'EM EXECUÇÃO' : 'AGENDADO'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.vehicle} numberOfLines={1}>
                    🚗 {item.veiculo} — <Text style={{ color: colors.textMuted }}>{item.placa}</Text>
                  </Text>

                  <View style={styles.divider} />

                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.metaText} numberOfLines={1}>
                      {item.endereco} {location.cidade ? `(${location.cidade})` : ''}
                    </Text>
                  </View>

                  <View style={styles.metaRow}>
                    <Ionicons name="construct-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.metaText} numberOfLines={1}>
                      Serviço: {item.tipo}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <Ionicons name="calendar-clear-outline" size={36} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Nenhum agendamento alocado</Text>
              <Text style={styles.emptySub}>Você não possui ordens de serviço pendentes para esta data.</Text>
            </View>
          </Card>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
    fontWeight: '500',
  },
  scroll: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  calendarCard: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekRow: {
    gap: 8,
    paddingVertical: spacing.sm,
  },
  dayButton: {
    width: 52,
    height: 64,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.text === '#FFFFFF' ? 'rgba(255,255,255,0.02)' : 'rgba(15, 23, 42, 0.02)',
    gap: 4,
  },
  dayButtonActive: {},
  dayLabelText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  dayNum: {
    fontSize: 15,
    fontWeight: '900',
  },
  textActive: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  list: {
    gap: 12,
  },
  serviceCard: {
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    gap: 10,
    shadowColor: colors.shadowColor,
    shadowOffset: colors.shadowOffsetDesktop || { width: 0, height: 4 },
    shadowOpacity: colors.shadowOpacityDesktop || 0.05,
    shadowRadius: colors.shadowRadiusDesktop || 12,
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(230,0,80,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '900',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  badgeActive: {
    backgroundColor: colors.primary,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  vehicle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textMuted,
    marginTop: 4,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: 240,
  },
  bottomSpace: { height: 60 },
});
