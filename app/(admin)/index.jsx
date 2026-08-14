import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  RefreshControl,
  useWindowDimensions,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { typography, radii, spacing, shadows } from '../../src/theme/colors';
import { useThemeColors } from '../../src/theme';

import { dashboardService } from '../../src/services/dashboard';
import { tecnicosService } from '../../src/services/tecnicos';
import { useQuery } from '../../src/hooks/useQuery';
import { Card, CardSection } from '../../src/ui/Card';
import { Skeleton, SkeletonCard } from '../../src/ui/Skeleton';
import BarChart from '../../src/ui/BarChart';
import RankingCard from '../../src/ui/RankingCard';

function getDayGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function AdminDashboard() {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;
  const styles = getStyles(colors, isDesktop);
  const { signOut, isDark, toggleTheme, profile } = useAuth();
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const greeting = getDayGreeting();
  const firstName = (profile?.nome || 'equipe').split(' ')[0];

  // Active filters for Financial Analysis
  const [filters, setFilters] = useState({
    periodo: 'todas',
    tecnico: 'todos',
    status: 'todos',
    tipo_servico: 'todos',
    forma_pagamento: 'todos'
  });

  // Querying operational and financial KPIs
  const { data: statsData, loading: statsLoading, refetch: refetchStats } = useQuery(
    ['dashboard-stats'],
    () => dashboardService.getStats(),
    { cacheTime: 10000 }
  );

  const { data: meta } = useQuery(
    ['dashboard-meta'],
    () => dashboardService.getMeta(),
    { cacheTime: 30000 }
  );

  const { data: ranking, loading: rankingLoading } = useQuery(
    ['dashboard-ranking'],
    () => dashboardService.getRanking(5),
    { cacheTime: 15000 }
  );

  const { data: finStats, loading: finLoading, refetch: refetchFin } = useQuery(
    ['financial-stats', JSON.stringify(filters)],
    () => dashboardService.getFinancialStats(filters),
    { cacheTime: 5000, deps: [filters] }
  );

  const { data: activeTecnicos } = useQuery(
    ['active-tecnicos-list'],
    () => tecnicosService.listActive(),
    { cacheTime: 40000 }
  );

  useFocusEffect(
    useCallback(() => {
      refetchStats();
      refetchFin();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchFin()]);
    setRefreshing(false);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const stats = statsData?.stats;
  const chartData = statsData?.chartData;
  const realizadoMes = statsData?.monthCompleted || 0;
  const metaMensal = meta || 100;
  const pct = metaMensal > 0 ? Math.min(100, Math.round((realizadoMes / metaMensal) * 100)) : 0;

  // Format currency helpers
  const formatCurrencyValue = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0);
  };

  // Custom Selector Dropdown Component
  const DropdownSelector = ({ label, value, options, onChange }) => {
    return (
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>{label}</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterChipsRow}
        >
          {options.map((opt) => {
            const active = value === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => onChange(opt.id)}
                style={[
                  styles.filterChip,
                  active && styles.filterChipActive
                ]}
              >
                <Text style={[
                  styles.filterChipText,
                  active && styles.filterChipTextActive
                ]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const techDropdownOptions = [
    { id: 'todos', label: 'Todos os Técnicos' },
    ...(Array.isArray(activeTecnicos) ? activeTecnicos : []).map(t => ({ id: t.id, label: t.nome }))
  ];  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* ── Header estilo CRM ── */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerTitleBox}>
          <Text style={[styles.title, { color: colors.text }]}>
            {greeting}, {firstName}
          </Text>
          <Text style={styles.sub}>Acompanhe a operação dos atendimentos em um só lugar</Text>
        </View>

        <View style={styles.headerControls}>
          {/* Refresh */}
          <Pressable
            onPress={onRefresh}
            style={[styles.iconControlBtn, { backgroundColor: colors.isDark ? colors.surfaceElevated : '#F3F4F6', borderColor: colors.border }]}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="refresh-outline" size={17} color={colors.textMuted} />
            )}
          </Pressable>

          {/* Theme toggle */}
          <Pressable
            onPress={toggleTheme}
            style={[styles.iconControlBtn, { backgroundColor: colors.isDark ? colors.surfaceElevated : '#F3F4F6', borderColor: colors.border }]}
          >
            <Ionicons
              name={isDark ? 'sunny-outline' : 'moon-outline'}
              size={17}
              color={colors.textMuted}
            />
          </Pressable>

          {/* Botão + Nova OS (destaque vermelho, só desktop) */}
          {isDesktop && (
            <Pressable
              style={[styles.btnNovaOS]}
              onPress={() => router.push('/(admin)/criar-servico')}
            >
              <Ionicons name="add" size={16} color="#FFF" />
              <Text style={styles.btnNovaOSText}>Nova ordem de serviço</Text>
            </Pressable>
          )}

          {!isDesktop && (
            <Pressable
              onPress={async () => { await signOut(); }}
              style={styles.logoutBtn}
            >
              <Ionicons name="log-out-outline" size={15} color={colors.error} />
              <Text style={styles.logoutLabel}>Sair</Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* AUTOMATIC DB AUDIT ALERT BOX */}
        {finStats?.divergenciaDetectada && (
          <View style={[styles.auditAlert, { backgroundColor: colors.errorSoft, borderColor: colors.error }]}>
            <Ionicons name="warning-outline" size={24} color={colors.error} />
            <View style={styles.auditAlertContent}>
              <Text style={styles.auditAlertTitle}>⚠  Divergência Detectada na Receita</Text>
              <Text style={styles.auditAlertDesc}>
                O faturamento total calculado pelo Event Sourcing ({formatCurrencyValue(finStats?.auditSaaS)}) difere do somatório dos dados brutos ({formatCurrencyValue(finStats?.auditLocal)}).
              </Text>
            </View>
          </View>
        )}

        {/* STATS COUNT OVERVIEW GRID */}
        {statsLoading ? (
          <View style={styles.grid}>
            {[1, 2, 3, 4].map(i => (
              <View key={i} style={styles.statCard}>
                <Skeleton width={32} height={32} borderRadius={radii.sm} />
                <Skeleton width={50} height={28} style={{ marginTop: 8 }} />
              </View>
            ))}
          </View>
        ) : stats ? (
          <View style={styles.grid}>
            {/* OS em andamento */}
            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: 'rgba(59,130,246,0.10)' }]}>
                <Ionicons name="people-outline" size={20} color="#3B82F6" />
              </View>
              <Text style={styles.statLabel}>OS em andamento</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.emAndamento ?? '--'}</Text>
              <View style={styles.trendRow}>
                <Text style={[styles.trendSub, { color: colors.textSecondary }]}>em atendimento agora</Text>
              </View>
            </View>

            {/* Ordens hoje */}
            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: 'rgba(230,0,80,0.08)' }]}>
                <Ionicons name="document-text-outline" size={20} color="#E60050" />
              </View>
              <Text style={styles.statLabel}>Ordens hoje</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.ordensHoje}</Text>
              <View style={styles.trendRow}>
                <Text style={[styles.trendSub, { color: colors.textSecondary }]}>criadas hoje</Text>
              </View>
            </View>

            {/* Atendimentos concluídos */}
            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: 'rgba(16,185,129,0.10)' }]}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
              </View>
              <Text style={styles.statLabel}>Atendimentos concluídos</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.concluidasMes}</Text>
              <View style={styles.trendRow}>
                <Text style={[styles.trendSub, { color: colors.textSecondary }]}>
                  {stats.total > 0 ? `${Math.round((stats.finalizados / stats.total) * 100)}% do total` : 'sem OS ainda'}
                </Text>
              </View>
            </View>

            {/* OS Pendentes */}
            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: 'rgba(245,158,11,0.10)' }]}>
                <Ionicons name="alert-circle-outline" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.statLabel}>OS pendentes</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.pendentes}</Text>
              <View style={styles.trendRow}>
                <View style={[styles.trendBadge, { backgroundColor: 'rgba(245,158,11,0.08)' }]}>
                  <Ionicons name="time-outline" size={11} color="#F59E0B" />
                  <Text style={[styles.trendText, { color: '#F59E0B' }]}>Aguardando</Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {/* INTERACTIVE FILTERS DRAWER */}
        <Card style={styles.filtersCard}>
          <Pressable
            onPress={() => setFiltersExpanded(!filtersExpanded)}
            style={({ pressed }) => [
              styles.filtersHeaderToggle,
              pressed && { opacity: 0.8 }
            ]}
          >
            <View style={styles.filtersHeaderTitleBox}>
              <Ionicons name="funnel-outline" size={16} color={colors.primary} />
              <Text style={[styles.filtersTitle, { color: colors.text }]}>Filtros Analíticos Avançados</Text>
              {(filters.periodo !== 'todas' || filters.tecnico !== 'todos' || filters.status !== 'todos' || filters.tipo_servico !== 'todos' || filters.forma_pagamento !== 'todos') && (
                <View style={[styles.activeFilterBadge, { backgroundColor: colors.primarySoft || 'rgba(230,0,80,0.08)' }]}>
                  <Text style={[styles.activeFilterBadgeText, { color: colors.primary }]}>ATIVO</Text>
                </View>
              )}
            </View>
            <Ionicons 
              name={filtersExpanded ? "chevron-up" : "chevron-down"} 
              size={18} 
              color={colors.textSecondary} 
            />
          </Pressable>

          {filtersExpanded && (
            <View style={[styles.filterSection, { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }]}>
              <DropdownSelector
                label="Período"
                value={filters.periodo}
                onChange={(val) => handleFilterChange('periodo', val)}
                options={[
                  { id: 'todas', label: 'Todo o Histórico' },
                  { id: 'hoje', label: 'Hoje' },
                  { id: '7d', label: 'Últimos 7 Dias' },
                  { id: 'mes', label: 'Este Mês' }
                ]}
              />

              <DropdownSelector
                label="Técnico Alocado"
                value={filters.tecnico}
                onChange={(val) => handleFilterChange('tecnico', val)}
                options={techDropdownOptions}
              />

              <DropdownSelector
                label="Status pagamento"
                value={filters.status}
                onChange={(val) => handleFilterChange('status', val)}
                options={[
                  { id: 'todos', label: 'Todos os Status' },
                  { id: 'pendente', label: 'Faturamento Pendente' },
                  { id: 'em_andamento', label: 'Em Andamento' },
                  { id: 'concluido', label: 'Serviço Concluído' }
                ]}
              />

              <DropdownSelector
                label="Tipo de Serviço"
                value={filters.tipo_servico}
                onChange={(val) => handleFilterChange('tipo_servico', val)}
                options={[
                  { id: 'todos', label: 'Todos os Serviços' },
                  { id: 'Instalação', label: 'Instalação' },
                  { id: 'Instalação com Bloqueio', label: 'Instalação com Bloqueio' },
                  { id: 'Manutenção', label: 'Manutenção' },
                  { id: 'Retirada', label: 'Retirada' }
                ]}
              />

              <DropdownSelector
                label="Meio de Pagamento"
                value={filters.forma_pagamento}
                onChange={(val) => handleFilterChange('forma_pagamento', val)}
                options={[
                  { id: 'todos', label: 'Todos' },
                  { id: 'Pix', label: 'Pix' },
                  { id: 'Cartão de Crédito', label: 'Cartão de Crédito' },
                  { id: 'Boleto Bancário', label: 'Boleto Bancário' },
                  { id: 'Dinheiro', label: 'Dinheiro' }
                ]}
              />
            </View>
          )}
        </Card>

        {/* FINANCIAL STATS CARDS BLOCK */}
        {finLoading ? (
          <View style={styles.grid}>
            {[1, 2, 3, 4].map(idx => (
              <View key={idx} style={styles.statCard}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ))}
          </View>
        ) : finStats ? (
          <View style={styles.grid}>
            <View style={styles.statCard}>
              <View style={[styles.leftAccentBar, { backgroundColor: colors.success }]} />
              <View style={styles.statTop}>
                <Text style={styles.statLabel}>FATURAMENTO COMPLETO</Text>
                <View style={[styles.statIconDot, { backgroundColor: colors.successSoft }]}>
                  <Ionicons name="cash-outline" size={15} color={colors.success} />
                </View>
              </View>
              <Text style={[styles.statValue, { color: colors.success, fontSize: 26 }]}>
                {formatCurrencyValue(finStats.receitaTotal)}
              </Text>
              <View style={styles.trendRow}>
                {finStats.growth_percentage !== 0 && (
                  <View style={[styles.trendBadge, { backgroundColor: colors.successSoft }]}>
                    <Ionicons 
                      name={finStats.growth_percentage > 0 ? "trending-up" : "trending-down"} 
                      size={12} 
                      color={finStats.growth_percentage > 0 ? colors.success : colors.error} 
                    />
                    <Text style={[
                      styles.trendText, 
                      { color: finStats.growth_percentage > 0 ? colors.success : colors.error }
                    ]}>
                      {finStats.growth_percentage > 0 ? '+' : ''}
                      {finStats.growth_percentage.toFixed(1)}% vs MM
                    </Text>
                  </View>
                )}
                <Text style={styles.trendSub}>Progresso estratégico</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.leftAccentBar, { backgroundColor: colors.primary }]} />
              <View style={styles.statTop}>
                <Text style={styles.statLabel}>RECEITA MENSAL</Text>
                <View style={[styles.statIconDot, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="pulse-outline" size={15} color={colors.primary} />
                </View>
              </View>
              <Text style={[styles.statValue, { color: colors.text, fontSize: 22 }]}>
                {formatCurrencyValue(finStats.receitaMensal)}
              </Text>
              <Text style={styles.statMiniSub}>Mês calendário atual</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.leftAccentBar, { backgroundColor: '#FF1A6C' }]} />
              <View style={styles.statTop}>
                <Text style={styles.statLabel}>TICKET MÉDIO</Text>
                <View style={[styles.statIconDot, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="calculator-outline" size={15} color={colors.primary} />
                </View>
              </View>
              <Text style={[styles.statValue, { color: colors.text, fontSize: 22 }]}>
                {formatCurrencyValue(finStats.ticketMedio)}
              </Text>
              <Text style={styles.statMiniSub}>Por Ordem concluída</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.leftAccentBar, { backgroundColor: colors.textSecondary }]} />
              <View style={styles.statTop}>
                <Text style={styles.statLabel}>PAGOS VS PENDENTES</Text>
                <View style={[styles.statIconDot, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.05)' : '#E5E7EB' }]}>
                  <Ionicons name="stats-chart-outline" size={15} color={colors.textMuted} />
                </View>
              </View>
              <View style={styles.splitPaymentsRow}>
                <View>
                  <Text style={[styles.splitMain, { color: colors.text }]}>{finStats.servicosPagos}</Text>
                  <Text style={[styles.splitSub, { color: colors.success }]}>PAGOS</Text>
                </View>
                <View style={[styles.splitDivider, { backgroundColor: colors.border }]} />
                <View>
                  <Text style={[styles.splitMain, { color: colors.text }]}>{finStats.servicosPendentes}</Text>
                  <Text style={[styles.splitSub, { color: colors.warning }]}>PENDENTES</Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {/* CHARTS & DISTRIBUTION DETAILS */}
        <View style={isDesktop ? styles.desktopSplit : styles.mobileSplit}>
          <View style={styles.chartCol}>
            {/* Monthly productivity progress chart */}
            <BarChart 
              data={chartData || []} 
              title="Produtividade Mensal (OS Concluídas)" 
              height={200} 
            />

            {/* Faturamento por Tipo de Serviço */}
            <Card style={styles.breakoutCard}>
              <CardSection label="Faturamento por Tipo de Serviço">
                {finLoading ? (
                  <ActivityIndicator color={colors.primary} size="small" style={{ margin: 16 }} />
                ) : Array.isArray(finStats?.receitaPorTipo) && finStats.receitaPorTipo.length > 0 ? (
                  finStats.receitaPorTipo.map((item, idx) => (
                    <View key={idx} style={styles.progressRowContainer}>
                      <View style={styles.progressRowMeta}>
                        <Text style={[styles.progressRowLabel, { color: colors.textSecondary }]}>{item.tipo}</Text>
                        <Text style={[styles.progressRowValue, { color: colors.text }]}>{formatCurrencyValue(item.valor)}</Text>
                      </View>
                      <View style={[styles.progressBarBg, { backgroundColor: colors.isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB' }]}>
                        <View style={[
                          styles.progressBarFill, 
                          { width: `${Math.min(100, finStats.receitaTotal > 0 ? (item.valor / finStats.receitaTotal) * 100 : 0)}%`, backgroundColor: colors.primary }
                        ]} />
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>Sem dados de vendas faturadas.</Text>
                )}
              </CardSection>
            </Card>
          </View>

          <View style={styles.breakoutCol}>
            {/* Meta mensal OS progress */}
            <Card style={styles.goalsCard}>
              <CardSection label="Progresso da Meta Operacional">
                <View style={styles.metaHead}>
                  <View>
                    <Text style={[styles.metaPct, { color: colors.primary }]}>{pct}%</Text>
                    <Text style={[styles.metaPeriod, { color: colors.textMuted }]}>PROGRESSO MENSAL</Text>
                  </View>
                  <View style={[styles.metaCountContainer, { backgroundColor: colors.isDark ? 'rgba(255, 255, 255, 0.04)' : '#F3F4F6', borderColor: colors.border }]}>
                    <Text style={[styles.metaCount, { color: colors.text }]}>
                      {realizadoMes} <Text style={{ color: colors.textMuted }}>/ {metaMensal} OS</Text>
                    </Text>
                  </View>
                </View>
                <View style={[styles.progressBg, { backgroundColor: colors.isDark ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB' }]}>
                  <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
                </View>
              </CardSection>
            </Card>

            {/* Ranking de Líderes Técnicos por OS */}
            <Card style={styles.rankingCard}>
              <CardSection label="Ranking de Produtividade Técnica">
                {rankingLoading ? (
                  [1, 2, 3].map(i => <Skeleton key={i} width="100%" height={46} style={{ marginBottom: 8, borderRadius: radii.md }} />)
                ) : Array.isArray(ranking) && ranking.length > 0 ? (
                  ranking.map((item, index) => (
                    <RankingCard key={index} position={index + 1} nome={item.nome} total={item.total} />
                  ))
                ) : (
                  <Text style={styles.emptyText}>Nenhum serviço finalizado ainda.</Text>
                )}
              </CardSection>
            </Card>

            {/* Faturamento por Técnico */}
            <Card style={styles.rankingCard}>
              <CardSection label="Performance Comercial por Técnico">
                {finLoading ? (
                  <ActivityIndicator color={colors.primary} size="small" style={{ margin: 16 }} />
                ) : Array.isArray(finStats?.receitaPorTecnico) && finStats.receitaPorTecnico.length > 0 ? (
                  finStats.receitaPorTecnico.map((item, index) => (
                    <View key={index} style={styles.techPerfRow}>
                      <View style={styles.techPerfAvatar}>
                        <Text style={styles.techPerfAvatarText}>
                          {(item.nome || 'T').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.techPerfMeta}>
                        <Text style={[styles.techPerfName, { color: colors.text }]}>{item.nome}</Text>
                        <Text style={[styles.techPerfValue, { color: colors.success }]}>
                          {formatCurrencyValue(item.valor)}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>Sem faturamento por técnicos para o filtro selecionado.</Text>
                )}
              </CardSection>
            </Card>
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors, isDesktop) => StyleSheet.create({
  safe: { flex: 1 },
  filtersHeaderToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  filtersHeaderTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  activeFilterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
    marginLeft: 4,
  },
  activeFilterBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: 16,
    borderBottomWidth: 1,
    // Sombra sutil no header (como no CRM)
    ...Platform.select({
      web: {
        boxShadow: colors.isDark
          ? '0 1px 8px rgba(0,0,0,0.25)'
          : '0 1px 6px rgba(31,41,55,0.05)',
      },
    }),
  },
  headerTitleBox: { flex: 1, marginRight: spacing.lg },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '400',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconControlBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  btnNovaOS: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radii.md,
    backgroundColor: '#E60050',
    ...Platform.select({
      web: { boxShadow: '0 4px 14px rgba(230,0,80,0.30)' },
    }),
  },
  btnNovaOSText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutLabel: { fontSize: 11, fontWeight: '700', color: colors.error },
  desktopBadge: {
    backgroundColor: 'rgba(230,0,80,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(230,0,80,0.15)',
  },
  desktopBadgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  scroll: {
    padding: spacing.xl,
  },
  auditAlert: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    marginBottom: spacing.xl,
    gap: 12,
    alignItems: 'flex-start',
  },
  auditAlertContent: { flex: 1 },
  auditAlertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.error,
    marginBottom: 4,
  },
  auditAlertDesc: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: spacing.xl,
  },
  statCard: {
    minWidth: isDesktop ? '23%' : '46%',
    flexGrow: 1,
    flexShrink: 1,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.xl,
    // Sem borda no light, sombra difusa como no CRM
    borderWidth: colors.isDark ? 1 : 0,
    borderColor: colors.isDark ? colors.border : 'transparent',
    gap: 6,
    ...Platform.select({
      web: {
        boxShadow: colors.isDark
          ? '0 4px 20px rgba(0,0,0,0.3)'
          : '0 2px 14px rgba(31,41,55,0.07), 0 1px 4px rgba(31,41,55,0.04)',
      },
    }),
  },
  statIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 36,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    justifyContent: 'space-between',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16,185,129,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '700',
  },
  trendSub: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  statMiniSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  splitPaymentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: 16,
  },
  splitMain: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
  },
  splitSub: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
  splitDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  filtersCard: {
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterSection: {
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterGroup: {
    gap: spacing.xs,
  },
  filterLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: 2,
  },
  filterChipsRow: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  desktopSplit: {
    flexDirection: 'row',
    gap: spacing.xl,
    width: '100%',
  },
  mobileSplit: {
    flexDirection: 'column',
    gap: spacing.xl,
  },
  chartCol: {
    flex: 3,
    gap: spacing.xl,
  },
  breakoutCol: {
    flex: 2,
    gap: spacing.xl,
  },
  goalsCard: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  metaPct: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1,
  },
  metaPeriod: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  metaCountContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaCount: { fontSize: 13, fontWeight: '700' },
  progressBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  rankingCard: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  breakoutCard: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressRowContainer: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  progressRowMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressRowLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  progressRowValue: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  techPerfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  techPerfAvatar: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: 'rgba(230,0,80,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(230,0,80,0.15)',
  },
  techPerfAvatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  techPerfMeta: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  techPerfName: {
    fontSize: 13,
    fontWeight: '700',
  },
  techPerfValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyText: { color: colors.textMuted, fontSize: 13, fontStyle: 'italic', marginVertical: 8 },
  bottomSpace: { height: 60 },
});
