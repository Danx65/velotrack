import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { typography, radii, spacing } from '../../src/theme/colors';
import { useThemeColors } from '../../src/theme';

import { supabase } from '../../src/lib/supabase';
import { Card } from '../../src/ui/Card';
import ServiceCard from '../../src/ui/ServiceCard';
import { EmptyState } from '../../src/ui/EmptyState';
import { Skeleton, SkeletonCard } from '../../src/ui/Skeleton';

const TABS = [
  { key: 'ativos', label: 'Ativos', icon: 'construct-outline' },
  { key: 'pendentes', label: 'Pendentes', icon: 'time-outline' },
  { key: 'andamento', label: 'Em Andamento', icon: 'play-circle-outline' },
  { key: 'concluidos', label: 'Concluídos', icon: 'checkmark-circle-outline' },
];

export default function TecnicoHome() {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ativos');
  const [counts, setCounts] = useState({ pendente: 0, em_andamento: 0, concluido: 0 });

  const fetchServices = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('*, users(nome)')
        .eq('technician_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const list = data || [];
      setServices(list);
      setCounts({
        pendente: list.filter(s => s.status === 'pendente').length,
        em_andamento: list.filter(s => s.status === 'em_andamento').length,
        concluido: list.filter(s => s.status === 'concluido').length,
      });
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { fetchServices(); }, [fetchServices]));

  const filteredServices = useMemo(() => {
    switch (activeTab) {
      case 'pendentes':
        return services.filter(s => s.status === 'pendente');
      case 'andamento':
        return services.filter(s => s.status === 'em_andamento');
      case 'concluidos':
        return services.filter(s => s.status === 'concluido');
      case 'ativos':
      default:
        return services.filter(s => s.status === 'pendente' || s.status === 'em_andamento');
    }
  }, [services, activeTab]);

  const today = useMemo(() =>
    new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }),
  []);

  const countItems = [
    { value: counts.pendente, label: 'Pendentes', color: colors.warning, icon: 'time-outline' },
    { value: counts.em_andamento, label: 'Em Andamento', color: colors.primary, icon: 'play-circle-outline' },
    { value: counts.concluido, label: 'Concluídos', color: colors.success, icon: 'checkmark-circle-outline' },
  ];

  const renderCard = useCallback(({ item }) => (
    <ServiceCard
      service={item}
      onPress={() => router.push(`/(tecnico)/servico/${item.id}`)}
    />
  ), []);

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'pendentes': return { icon: 'time-outline', title: 'Nenhum pendente', message: 'Você não tem serviços pendentes no momento.' };
      case 'andamento': return { icon: 'play-circle-outline', title: 'Nada em andamento', message: 'Você não tem serviços em andamento.' };
      case 'concluidos': return { icon: 'checkmark-circle-outline', title: 'Nenhum concluído', message: 'Você ainda não finalizou nenhum serviço.' };
      default: return { icon: 'checkmark-circle', title: 'Tudo em dia!', message: 'Você não tem serviços pendentes no momento.' };
    }
  };

  const empty = getEmptyMessage();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {profile?.nome?.split(' ')[0] || 'Técnico'}</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
        <Pressable
          onPress={async () => { await signOut(); }}
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="log-out-outline" size={16} color={colors.error} />
          <Text style={styles.logoutLabel}>Sair</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <View style={styles.counterRow}>
            {[1, 2, 3].map(i => (
              <View key={i} style={styles.counterCard}>
                <Skeleton width={16} height={16} borderRadius={8} />
                <Skeleton width={28} height={20} />
                <Skeleton width={45} height={10} />
              </View>
            ))}
          </View>
          {[1, 2].map(i => <SkeletonCard key={i} lines={4} />)}
        </View>
      ) : (
        <>
          <View style={styles.counterRow}>
            {countItems.map((c, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.counterCard, activeTab === TABS[i + 1]?.key && { backgroundColor: c.color + '10' }]}
                onPress={() => setActiveTab(TABS[i + 1]?.key || 'ativos')}
                activeOpacity={0.7}
              >
                <View style={[styles.leftAccentBar, { backgroundColor: c.color }]} />
                <Ionicons name={c.icon} size={16} color={c.color} />
                <Text style={[styles.counterNum, { color: c.color }]}>{c.value}</Text>
                <Text style={styles.counterLabel}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={TABS}
            contentContainerStyle={styles.tabList}
            renderItem={({ item }) => {
              const isActive = activeTab === item.key;
              let count = 0;
              if (item.key === 'ativos') count = counts.pendente + counts.em_andamento;
              else if (item.key === 'pendentes') count = counts.pendente;
              else if (item.key === 'andamento') count = counts.em_andamento;
              else if (item.key === 'concluidos') count = counts.concluido;
              return (
                <TouchableOpacity
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => setActiveTab(item.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={item.icon} size={14} color={isActive ? colors.primary : colors.textMuted} />
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{item.label}</Text>
                  <View style={[styles.tabCount, isActive && styles.tabCountActive]}>
                    <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>{count}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            keyExtractor={(i) => i.key}
          />

          <FlatList
            data={filteredServices}
            keyExtractor={(item) => item.id}
            renderItem={renderCard}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchServices(); }} tintColor={colors.primary} colors={[colors.primary]} />
            }
            ListEmptyComponent={
              <EmptyState icon={empty.icon} title={empty.title} message={empty.message} />
            }
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </SafeAreaView>
  );
}




const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, padding: spacing.xl },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  greeting: { ...typography.h2, color: colors.text },
  date: { ...typography.caption, color: colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 7, paddingHorizontal: 11, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: (colors.shadowOpacityDesktop || 0.05) * 0.5,
    shadowRadius: 4,
  },
  logoutLabel: { fontSize: 12, fontWeight: '700', color: colors.error },
  counterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.xl, marginBottom: spacing.md, marginTop: spacing.lg },
  counterCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, gap: 3,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: colors.shadowColor,
    shadowOffset: colors.shadowOffsetDesktop || { width: 0, height: 4 },
    shadowOpacity: colors.shadowOpacityDesktop || 0.05,
    shadowRadius: colors.shadowRadiusDesktop || 12,
  },
  leftAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
  },
  counterNum: { fontSize: 20, fontWeight: '900' },
  counterLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 1, fontWeight: '600' },
  tabList: { paddingHorizontal: spacing.xl, gap: 6, marginBottom: spacing.md },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: (colors.shadowOpacityDesktop || 0.05) * 0.7,
    shadowRadius: 6,
  },
  tabActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.primary },
  tabCount: {
    backgroundColor: colors.surfaceElevated, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4,
  },
  tabCountActive: { backgroundColor: colors.primary + '30' },
  tabCountText: { fontSize: 10, fontWeight: '700', color: colors.textMuted },
  tabCountTextActive: { color: colors.primary },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 20 },
});
