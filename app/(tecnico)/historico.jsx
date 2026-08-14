import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { typography, radii, spacing } from '../../src/theme/colors';
import { useThemeColors } from '../../src/theme';

import { supabase } from '../../src/lib/supabase';
import { useDebounce } from '../../src/hooks/useDebounce';
import ServiceCard from '../../src/ui/ServiceCard';
import { EmptyState } from '../../src/ui/EmptyState';
import { SkeletonCard } from '../../src/ui/Skeleton';
import FilterSheet from '../../src/ui/FilterSheet';

export default function TecnicoHistorico() {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const { user } = useAuth();
  const router = useRouter();
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [filterVisible, setFilterVisible] = useState(false);
  const [period, setPeriod] = useState(null);
  const [status, setStatus] = useState(null);

  const fetchHistorico = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('*, users(nome)')
        .eq('technician_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setServicos(data || []);
    } catch {} finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { fetchHistorico(); }, [fetchHistorico]));

  const filtered = useMemo(() => {
    let list = servicos;

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase();
      list = list.filter(s =>
        s.cliente?.toLowerCase().includes(q) ||
        s.placa?.toLowerCase().includes(q) ||
        s.veiculo?.toLowerCase().includes(q)
      );
    }

    if (period) {
      const now = new Date();
      list = list.filter(s => {
        const d = new Date(s.created_at);
        switch (period) {
          case 'hoje':
            return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          case '7d': {
            const seteDias = new Date(); seteDias.setDate(seteDias.getDate() - 7);
            return d >= seteDias;
          }
          case 'mes':
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          case 'personalizado':
            return true;
          default: return true;
        }
      });
    }

    if (status) {
      list = list.filter(s => s.status === status);
    }

    return list;
  }, [servicos, debouncedSearch, period, status]);

  const hasFilters = period || status;

  const handleApplyFilters = useCallback(({ period: p, status: s }) => {
    setPeriod(p);
    setStatus(s);
  }, []);

  const renderCard = useCallback(({ item }) => (
    <ServiceCard
      service={item}
      onPress={() => router.push(`/(tecnico)/servico/${item.id}`)}
      compact
    />
  ), []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Meu Histórico</Text>
        <Text style={styles.subtitle}>{filtered.length} OS</Text>
      </View>

      <View style={styles.stickyBar}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cliente, placa..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            style={[styles.filterBtn, hasFilters && styles.filterBtnActive]}
            onPress={() => setFilterVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="options-outline" size={16} color={hasFilters ? colors.primary : colors.textMuted} />
            <Text style={[styles.filterBtnText, hasFilters && { color: colors.primary }]}>Filtros</Text>
            {hasFilters && <View style={styles.filterDot} />}
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} lines={4} />)}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchHistorico(); setRefreshing(false); }} tintColor={colors.primary} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="file-tray-outline"
              title="Nenhum serviço encontrado"
              message={servicos.length === 0 ? 'Você ainda não tem serviços no histórico.' : 'Nenhum resultado para esta busca.'}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={handleApplyFilters}
        initialPeriod={period}
        initialStatus={status}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  stickyBar: { backgroundColor: colors.bg, paddingBottom: spacing.sm },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.xl, marginTop: spacing.sm,
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface, borderRadius: radii.md, paddingHorizontal: spacing.md,
    height: 42, borderWidth: 1, borderColor: colors.border,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: (colors.shadowOpacityDesktop || 0.05) * 0.5,
    shadowRadius: 4,
  },
  searchInput: { flex: 1, fontSize: 13, color: colors.text, outlineStyle: 'none' },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, height: 42,
    borderRadius: radii.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: (colors.shadowOpacityDesktop || 0.05) * 0.5,
    shadowRadius: 4,
  },
  filterBtnActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  filterBtnText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  filterDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.primary,
    position: 'absolute', top: 8, right: 8,
  },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 30, paddingTop: spacing.xs },
});
