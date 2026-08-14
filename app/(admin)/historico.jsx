import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { typography, radii, spacing } from '../../src/theme/colors';
import { useThemeColors } from '../../src/theme';

import { servicosService } from '../../src/services/servicos';
import { tecnicosService } from '../../src/services/tecnicos';
import { usePagination } from '../../src/hooks/usePagination';
import { useDebounce } from '../../src/hooks/useDebounce';
import ServiceCard from '../../src/ui/ServiceCard';
import { EmptyState } from '../../src/ui/EmptyState';
import { SkeletonCard } from '../../src/ui/Skeleton';
import FilterSheet from '../../src/ui/FilterSheet';

export default function HistoricoAdmin() {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const router = useRouter();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [period, setPeriod] = useState(null);
  const [status, setStatus] = useState(null);
  const [techFilter, setTechFilter] = useState(null);
  const [tecnicos, setTecnicos] = useState([]);
  const [filterVisible, setFilterVisible] = useState(false);

  useEffect(() => {
    tecnicosService.listActive().then(setTecnicos).catch(() => {});
  }, []);

  const dateFilter = period || 'todas';

  const fetchFn = useCallback(async ({ page, pageSize }) => {
    return servicosService.list({
      page,
      search: debouncedSearch,
      dateFilter,
      technicianId: techFilter,
      status: status,
    });
  }, [debouncedSearch, dateFilter, techFilter, status]);

  const { data, loading, refreshing, hasMore, fetch, refresh, nextPage } = usePagination(fetchFn);

  useFocusEffect(useCallback(() => { fetch(0, false); }, [fetch]));

  const hasFilters = period || status || techFilter;

  const handleApplyFilters = useCallback(({ period: p, status: s, technicianId }) => {
    setPeriod(p);
    setStatus(s);
    if (technicianId !== undefined) setTechFilter(technicianId);
  }, []);

  const renderCard = useCallback(({ item }) => (
    <ServiceCard
      service={item}
      onPress={() => router.push(`/(admin)/criar-servico?id=${item.id}`)}
    />
  ), []);

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <TouchableOpacity style={styles.loadMore} onPress={nextPage} activeOpacity={0.7}>
        <Text style={styles.loadMoreText}>Carregar mais</Text>
      </TouchableOpacity>
    );
  };

  const selectedTech = tecnicos.find(t => t.id === techFilter);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Ordens de Serviço</Text>
          <Text style={styles.subtitle}>{data.length} OS{techFilter ? ` • ${selectedTech?.nome || ''}` : ''}</Text>
        </View>
      </View>

      <View style={styles.stickyBar}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cliente, placa, técnico..."
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

      {loading && data.length === 0 ? (
        <View style={styles.center}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} lines={4} />)}
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="file-tray-outline"
              title="Nenhuma OS encontrada"
              message={data.length === 0 && !loading ? 'Nenhum resultado com os filtros atuais.' : 'Carregando...'}
            />
          }
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          onEndReached={nextPage}
          onEndReachedThreshold={0.5}
        />
      )}

      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={handleApplyFilters}
        initialPeriod={period}
        initialStatus={status}
        initialTech={techFilter}
        tecnicos={tecnicos}
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
  },
  searchInput: { flex: 1, fontSize: 13, color: colors.text, outlineStyle: 'none' },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, height: 42,
    borderRadius: radii.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterBtnActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  filterBtnText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  filterDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.primary,
    position: 'absolute', top: 8, right: 8,
  },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 30, paddingTop: spacing.xs },
  loadMore: {
    alignItems: 'center', paddingVertical: spacing.md,
    backgroundColor: colors.card, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.border, marginTop: spacing.sm,
  },
  loadMoreText: { fontSize: 13, fontWeight: '600', color: colors.primary },
});
