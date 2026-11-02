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
import RevenueLineChart from '../../src/ui/RevenueLineChart';
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
    { staleTime: 300000 }
  );

  const { data: meta } = useQuery(
    ['dashboard-meta'],
    () => dashboardService.getMeta(),
    { staleTime: 300000 }
  );

  const { data: ranking, loading: rankingLoading } = useQuery(
    ['dashboard-ranking'],
    () => dashboardService.getRanking(5),
    { staleTime: 300000 }
  );

  const { data: finStats, loading: finLoading, refetch: refetchFin } = useQuery(
    ['financial-stats', JSON.stringify(filters)],
    () => dashboardService.getFinancialStats(filters),
    { staleTime: 300000, deps: [filters] }
  );

  const { data: activeTecnicos } = useQuery(
    ['active-tecnicos-list'],
    () => tecnicosService.listActive(),
    { staleTime: 300000 }
  );

  useFocusEffect(
    useCallback(() => {
      refetchStats({ silent: true });
      refetchFin({ silent: true });
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

  const exportCSV = () => {
    if (!finStats) return;
    if (Platform.OS !== 'web') {
      alert('Exportar CSV', 'Disponível apenas na versão web.');
      return;
    }
    const fmt = (v) => String((v ?? 0)).replace('.', ',');
    const rows = [
      ['Métrica', 'Valor'],
      ['Faturamento total', fmt(finStats.receitaTotal)],
      ['Receita mensal', fmt(finStats.receitaMensal)],
      ['Receita semanal', fmt(finStats.receitaSemanal)],
      ['Receita diária', fmt(finStats.receitaDiaria)],
      ['Receita anual', fmt(finStats.receitaAnual)],
      ['Ticket médio', fmt(finStats.ticketMedio)],
      ['OS pagas', finStats.servicosPagos ?? 0],
      ['OS com faturamento pendente', finStats.servicosPendentes ?? 0],
      [],
      ['Faturamento por técnico'],
      ['Técnico', 'Valor'],
      ...(finStats.receitaPorTecnico || []).map(t => [t.nome, fmt(t.valor)]),
      [],
      ['Faturamento por tipo de serviço'],
      ['Tipo', 'Valor'],
      ...(finStats.receitaPorTipo || []).map(t => [t.tipo, fmt(t.valor)]),
    ];
    const csv = rows
      .map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `velotrack_financeiro_${filters.periodo}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
    { id: 'todos', label: 'Todos os TǸcnicos' },
    ...(Array.isArray(activeTecnicos) ? activeTecnicos : []).map(t => ({ id: t.id, label: t.nome }))
  ];

  const overviewItems = [
    { label: 'OS em andamento', value: stats?.emAndamento ?? 0, sub: 'em atendimento agora', icon: 'people-outline', color: '#3B82F6', bg: 'rgba(59,130,246,0.10)' },
    { label: 'Ordens hoje', value: stats?.ordensHoje ?? 0, sub: 'criadas hoje', icon: 'document-text-outline', color: colors.primary, bg: colors.primarySoft },
    { label: 'Atendimentos concluídos', value: stats?.concluidasMes ?? 0, sub: 'no mês atual', icon: 'checkmark-circle-outline', color: colors.success, bg: colors.successSoft },
    { label: 'OS pendentes', value: stats?.pendentes ?? 0, sub: 'aguardando atendimento', icon: 'alert-circle-outline', color: colors.warning, bg: colors.warningSoft },
  ];
  const receitaPorTecnico = Array.isArray(finStats?.receitaPorTecnico) ? finStats.receitaPorTecnico : [];
  const receitaPorTipo = Array.isArray(finStats?.receitaPorTipo) ? finStats.receitaPorTipo : [];
  const performanceMax = Number(receitaPorTecnico[0]?.valor) || 1;
  const growth = Number(finStats?.growth_percentage) || 0;
  const activeFilterCount = Object.values(filters).filter((value) => value !== 'todos' && value !== 'todas').length;

  return (
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
            style={[styles.iconControlBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
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
            style={[styles.iconControlBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
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

        {/* SECTION HEADER */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Visão geral</Text>
          <View style={styles.sectionStatus}>
            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
            <Text style={styles.sectionStatusText}>Dados do período selecionado</Text>
          </View>
        </View>

        {/* INTERACTIVE FILTERS DRAWER */}
        <Card style={styles.filtersCard}>
          <View style={styles.filtersHeaderRow}>
            <Pressable
              onPress={() => setFiltersExpanded(!filtersExpanded)}
              style={({ pressed }) => [
                styles.filtersHeaderToggle,
                pressed && { opacity: 0.8 }
              ]}
            >
              <View style={styles.filtersHeaderTitleBox}>
                <Ionicons name="funnel-outline" size={16} color={colors.primary} />
                <Text style={[styles.filtersTitle, { color: colors.text }]}>Filtros analíticos</Text>
                {activeFilterCount > 0 && (
                  <View style={[styles.activeFilterBadge, { backgroundColor: colors.primarySoft || 'rgba(230,0,80,0.08)' }]}>
                    <Text style={[styles.activeFilterBadgeText, { color: colors.primary }]}>{activeFilterCount} ATIVOS</Text>
                  </View>
                )}
              </View>
              <Ionicons
                name={filtersExpanded ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.textSecondary}
              />
            </Pressable>
            <Text style={styles.filtersCount}>
              {activeFilterCount > 0 ? `${activeFilterCount} ativos` : '5 filtros'}
            </Text>
            <Pressable
              onPress={exportCSV}
              style={({ pressed }) => [
                styles.exportBtn,
                pressed && { opacity: 0.8 }
              ]}
            >
              <Ionicons name="download-outline" size={15} color={colors.success} />
              <Text style={[styles.exportBtnText, { color: colors.success }]}>CSV</Text>
            </Pressable>
          </View>

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

        {/* HERO RECEITA */}
        {finLoading || statsLoading ? (
          <Card padded={false} style={styles.heroCard}>
            <View style={styles.heroLoading}>
              <View style={styles.heroLoadingLeft}>
                <Skeleton width="35%" height={12} />
                <Skeleton width="65%" height={42} style={{ marginTop: 14 }} />
                <Skeleton width="45%" height={20} style={{ marginTop: 14 }} />
                <Skeleton width="80%" height={12} style={{ marginTop: 28 }} />
              </View>
              <View style={styles.heroLoadingRight}>
                <Skeleton width="100%" height={190} borderRadius={16} />
              </View>
            </View>
          </Card>
        ) : finStats ? (
          <Card padded={false} style={styles.heroCard}>
            <View style={isDesktop ? styles.heroGrid : styles.heroGridMobile}>
              <View style={[styles.heroLeft, isDesktop && styles.heroLeftDesktop]}>
                <View style={styles.revenueLabelRow}>
                  <View style={[styles.revenueDot, { backgroundColor: colors.primary }]} />
                  <Text style={styles.revenueLabel}>RECEITA DO MÊS</Text>
                </View>

                <Text style={[styles.revenueValue, { color: colors.text }]} numberOfLines={1}>
                  {formatCurrencyValue(finStats.receitaMensal)}
                </Text>

                <View style={styles.growthRow}>
                  {growth !== 0 ? (
                    <View style={[
                      styles.growthBadge,
                      { backgroundColor: growth > 0 ? colors.successSoft : colors.errorSoft },
                    ]}>
                      <Ionicons
                        name={growth > 0 ? 'trending-up-outline' : 'trending-down-outline'}
                        size={12}
                        color={growth > 0 ? colors.success : colors.error}
                      />
                      <Text style={[styles.growthText, { color: growth > 0 ? colors.success : colors.error }]}>
                        {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                      </Text>
                    </View>
                  ) : null}
                  <Text style={styles.growthCaption}>em relação ao mês anterior</Text>
                </View>

                <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />

                <View style={styles.heroStatsRow}>
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatLabel}>FATURAMENTO ACUMULADO</Text>
                    <Text style={[styles.heroStatValue, { color: colors.text }]}>
                      {formatCurrencyValue(finStats.receitaTotal)}
                    </Text>
                  </View>
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatLabel}>ORDENS FATURADAS</Text>
                    <View style={styles.heroStatValueRow}>
                      <Text style={[styles.heroStatValue, { color: colors.text }]}>
                        {stats?.finalizados ?? 0}
                      </Text>
                      <Text style={styles.heroStatUnit}>concluídas</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={[styles.heroRight, isDesktop && styles.heroRightDesktop]}>
                <View style={styles.chartHeaderRow}>
                  <View style={styles.chartHeaderTextBox}>
                    <Text style={[styles.chartTitle, { color: colors.text }]}>Evolução da receita</Text>
                    <Text style={styles.chartSubtitle}>Acumulado — últimos 6 meses</Text>
                  </View>
                  <View style={[styles.chartPeriodBadge, { backgroundColor: colors.surfaceElevated }]}>
                    <Text style={[styles.chartPeriodText, { color: colors.primary }]}>6M</Text>
                  </View>
                </View>
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                    <Text style={styles.legendText}>Período atual</Text>
                  </View>
                </View>
                <RevenueLineChart data={finStats.receitaPorMes || []} height={isDesktop ? 200 : 170} />
              </View>
            </View>
          </Card>
        ) : null}

        {/* FAIXA DE KPIs */}
        {statsLoading ? (
          <Card padded={false} style={styles.stripCard}>
            <View style={styles.stripRow}>
              {[1, 2, 3, 4].map((item) => (
                <View key={item} style={styles.stripItem}>
                  <Skeleton width={38} height={38} borderRadius={12} />
                  <View style={styles.stripInfo}>
                    <Skeleton width={70} height={10} />
                    <Skeleton width={44} height={22} style={{ marginTop: 8 }} />
                  </View>
                </View>
              ))}
            </View>
          </Card>
        ) : (
          <Card padded={false} style={styles.stripCard}>
            <View style={styles.stripRow}>
              {overviewItems.map((item, index) => (
                <View
                  key={item.label}
                  style={[styles.stripItem, isDesktop && index > 0 && styles.stripDivider]}
                >
                  <View style={[styles.stripIcon, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>
                  <View style={styles.stripInfo}>
                    <Text style={styles.stripLabel}>{item.label}</Text>
                    <Text style={[styles.stripValue, { color: colors.text }]}>
                      {String(item.value).padStart(2, '0')}
                    </Text>
                    <Text style={styles.stripSub}>{item.sub}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* FAIXA FINANCEIRA */}
        {finLoading ? (
          <Card padded={false} style={styles.finStripCard}>
            <View style={styles.finStripRow}>
              {[1, 2, 3].map((item) => (
                <View key={item} style={styles.finStripItem}>
                  <Skeleton width={34} height={34} borderRadius={10} />
                  <View style={styles.stripInfo}>
                    <Skeleton width={90} height={10} />
                    <Skeleton width={70} height={16} style={{ marginTop: 8 }} />
                  </View>
                </View>
              ))}
            </View>
          </Card>
        ) : (
          <Card padded={false} style={styles.finStripCard}>
            <View style={isDesktop ? styles.finStripRow : styles.finStripColumn}>
              <View style={styles.finStripItem}>
                <View style={[styles.finStripIcon, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="receipt-outline" size={17} color={colors.primary} />
                </View>
                <View style={styles.stripInfo}>
                  <Text style={styles.finStripLabel}>TICKET MÉDIO</Text>
                  <Text style={[styles.finStripValue, { color: colors.text }]}>
                    {formatCurrencyValue(finStats?.ticketMedio || 0)}
                  </Text>
                  <Text style={styles.finStripSub}>por ordem concluída</Text>
                </View>
              </View>

              <View style={[styles.finStripItem, isDesktop && styles.finStripDivider]}>
                <View style={[styles.finStripIcon, { backgroundColor: colors.successSoft }]}>
                  <Ionicons name="card-outline" size={17} color={colors.success} />
                </View>
                <View style={styles.stripInfo}>
                  <Text style={styles.finStripLabel}>CONTROLE DE PAGAMENTOS</Text>
                  <Text style={styles.finStripSub}>ordens concluídas</Text>
                  <View style={styles.paymentRow}>
                    <View style={styles.paymentPill}>
                      <View style={[styles.paymentDot, { backgroundColor: colors.success }]} />
                      <Text style={styles.paymentText}>{finStats?.servicosPagos ?? 0} pagos</Text>
                    </View>
                    <View style={styles.paymentPill}>
                      <View style={[styles.paymentDot, { backgroundColor: colors.warning }]} />
                      <Text style={styles.paymentText}>{finStats?.servicosPendentes ?? 0} pendentes</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={[styles.finStripItem, isDesktop && styles.finStripDivider]}>
                <View style={[styles.finStripIcon, { backgroundColor: colors.surfaceElevated }]}>
                  <Ionicons name="document-text-outline" size={17} color={colors.textSecondary} />
                </View>
                <View style={styles.stripInfo}>
                  <Text style={styles.finStripLabel}>ORDENS FATURADAS</Text>
                  <Text style={[styles.finStripValue, { color: colors.text }]}>
                    {stats?.finalizados ?? 0}
                  </Text>
                  <Text style={styles.finStripSub}>concluídas no período</Text>
                </View>
              </View>
            </View>
          </Card>
        )}

        {/* PRODUTIVIDADE + FATURAMENTO POR TIPO */}
        <View style={isDesktop ? styles.chartsRow : styles.chartsRowMobile}>
          <View style={styles.mainChartCol}>
            {statsLoading ? (
              <Card style={styles.chartPlaceholder}>
                <Skeleton width="100%" height={250} borderRadius={12} />
              </Card>
            ) : (
              <BarChart
                data={chartData || []}
                title="Produtividade mensal (OS concluídas)"
                subtitle="Volume mensal de ordens de serviço finalizadas"
                height={isDesktop ? 220 : 180}
              />
            )}
          </View>

          <View style={styles.sideChartCol}>
            <Card style={styles.breakdownCard}>
              <View style={styles.cardTitleRow}>
                <View style={styles.cardTitleBox}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Faturamento por tipo de serviço</Text>
                  <Text style={styles.cardSubtitle}>Receita no período selecionado</Text>
                </View>
                <Text style={styles.cardTitleValue}>{formatCurrencyValue(finStats?.receitaTotal || 0)}</Text>
              </View>

              {finLoading ? (
                <View style={styles.typeLoading}>
                  <Skeleton width="100%" height={14} />
                  <Skeleton width="82%" height={14} />
                  <Skeleton width="70%" height={14} />
                  <Skeleton width="56%" height={14} />
                </View>
              ) : receitaPorTipo.length > 0 ? (
                receitaPorTipo.map((item, index) => {
                  const percent = finStats?.receitaTotal > 0
                    ? (item.valor / finStats.receitaTotal) * 100
                    : 0;
                  return (
                    <View key={`${item.tipo}-${index}`} style={styles.typeRow}>
                      <View style={styles.typeMetaRow}>
                        <Text style={styles.typeLabel}>{item.tipo}</Text>
                        <Text style={styles.typeValue}>{formatCurrencyValue(item.valor)}</Text>
                      </View>
                      <View style={styles.typeTrack}>
                        <View style={[styles.typeFill, { width: `${Math.min(100, percent)}%` }]} />
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>Sem dados de vendas faturadas.</Text>
              )}
            </Card>
          </View>
        </View>

        {/* META + RANKING + PERFORMANCE */}
        <View style={isDesktop ? styles.bottomRow : styles.bottomRowMobile}>
          <Card style={styles.bottomCard}>
            <Text style={styles.cardEyebrow}>PROGRESSO DA META OPERACIONAL</Text>
            <View style={styles.goalHeader}>
              <Text style={[styles.goalValue, { color: colors.primary }]}>{pct}%</Text>
              <Text style={styles.goalCount}>
                {realizadoMes} <Text style={styles.goalCountMuted}>/ {metaMensal} OS</Text>
              </Text>
            </View>
            <View style={styles.goalTrack}>
              <View style={[styles.goalFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.goalCaption}>meta mensal de ordens concluídas</Text>
          </Card>

          <Card style={styles.bottomCard}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardEyebrow}>RANKING DE PRODUTIVIDADE TÉCNICA</Text>
              <Text style={styles.cardEyebrowValue}>OS CONCLUÍDAS</Text>
            </View>
            {rankingLoading ? (
              <View style={styles.typeLoading}>
                <Skeleton width="100%" height={20} />
                <Skeleton width="100%" height={20} />
                <Skeleton width="100%" height={20} />
              </View>
            ) : Array.isArray(ranking) && ranking.length > 0 ? (
              ranking.map((item, index) => (
                <RankingCard
                  key={`${item.nome}-${index}`}
                  position={index + 1}
                  nome={item.nome}
                  total={item.total}
                  max={ranking[0]?.total || 1}
                />
              ))
            ) : (
              <Text style={styles.emptyText}>Nenhum serviço finalizado ainda.</Text>
            )}
          </Card>

          <Card style={styles.bottomCard}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardEyebrow}>PERFORMANCE COMERCIAL POR TÉCNICO</Text>
              <Text style={styles.cardEyebrowValue}>RECEITA</Text>
            </View>
            {finLoading ? (
              <View style={styles.typeLoading}>
                <Skeleton width="100%" height={18} />
                <Skeleton width="100%" height={18} />
                <Skeleton width="100%" height={18} />
              </View>
            ) : receitaPorTecnico.length > 0 ? (
              receitaPorTecnico.map((item, index) => {
                const percent = Math.min(100, ((Number(item.valor) || 0) / performanceMax) * 100);
                return (
                  <View key={`${item.nome}-${index}`} style={styles.perfRow}>
                    <View style={styles.perfMeta}>
                      <Text style={styles.perfName} numberOfLines={1}>{item.nome}</Text>
                      <Text style={styles.perfValue}>{formatCurrencyValue(item.valor)}</Text>
                    </View>
                    <View style={styles.perfTrack}>
                      <View style={[styles.perfFill, { width: `${percent}%` }]} />
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>Sem faturamento por técnicos para o filtro selecionado.</Text>
            )}
          </Card>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors, isDesktop) => StyleSheet.create({
  safe: { flex: 1 },
  filtersHeaderToggle: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  filtersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginRight: spacing.lg,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
    backgroundColor: 'rgba(16,185,129,0.08)',
  },
  exportBtnText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  filtersHeaderTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  filtersTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
    flexShrink: 1,
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
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderBottomWidth: 1,
    // Sombra quase imperceptível, só para separar o header
    ...Platform.select({
      web: {
        boxShadow: colors.isDark
          ? '0 1px 0 rgba(0,0,0,0.35)'
          : '0 1px 0 rgba(42,16,32,0.035)',
      },
    }),
  },
  headerTitleBox: { flex: 1, marginRight: spacing.lg },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  sub: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 3,
    fontWeight: '400',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconControlBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  btnNovaOS: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#E60050',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 20px -6px rgba(230,0,80,0.45), 0 2px 6px rgba(230,0,80,0.18)',
      },
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
    padding: spacing['2xl'],
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
    gap: 16,
    marginBottom: spacing['2xl'],
  },
  statCard: {
    minWidth: isDesktop ? '23%' : '46%',
    flexGrow: 1,
    flexShrink: 1,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: {
        boxShadow: colors.isDark
          ? '0 1px 2px rgba(0,0,0,0.4), 0 18px 40px rgba(0,0,0,0.32)'
          : '0 1px 2px rgba(42,16,32,0.04), 0 18px 40px -12px rgba(42,16,32,0.10)',
      },
    }),
  },
  leftAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statIconDot: {
    width: 30,
    height: 30,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1.2,
    lineHeight: 38,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    justifyContent: 'space-between',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16,185,129,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '700',
  },
  trendSub: {
    fontSize: 10.5,
    color: colors.textSecondary,
  },
  statMiniSub: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  splitPaymentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: 18,
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
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaCount: { fontSize: 13, fontWeight: '700' },
  progressBg: {
    height: 7,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
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
    height: 7,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  techPerfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  techPerfAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 2,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionStatusText: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontWeight: '500',
  },
  filtersCount: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontWeight: '600',
    marginRight: 12,
  },
  heroCard: {
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  heroGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  heroGridMobile: {
    flexDirection: 'column',
  },
  heroLeft: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  heroLeftDesktop: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  heroRight: {
    flex: 1.8,
    padding: 24,
    minWidth: 0,
    justifyContent: 'center',
  },
  heroRightDesktop: {},
  revenueLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  revenueDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  revenueLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1.2,
  },
  revenueValue: {
    fontSize: isDesktop ? 38 : 32,
    fontWeight: '800',
    letterSpacing: -1.4,
    lineHeight: isDesktop ? 42 : 36,
    marginTop: 8,
  },
  growthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },
  growthText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  growthCaption: {
    fontSize: 9.5,
    color: colors.textMuted,
    fontWeight: '500',
  },
  heroDivider: {
    height: 1,
    marginVertical: 18,
  },
  heroStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 28,
  },
  heroStat: {
    minWidth: 120,
  },
  heroStatLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  heroStatValue: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 3,
  },
  heroStatValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginTop: 3,
  },
  heroStatUnit: {
    fontSize: 9.5,
    color: colors.textMuted,
    fontWeight: '500',
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  chartHeaderTextBox: {
    flex: 1,
    minWidth: 0,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  chartSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 3,
    fontWeight: '500',
  },
  chartPeriodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chartPeriodText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 9.5,
    color: colors.textMuted,
    fontWeight: '500',
  },
  heroLoading: {
    flexDirection: isDesktop ? 'row' : 'column',
    gap: 24,
    padding: 24,
  },
  heroLoadingLeft: {
    flex: 1,
  },
  heroLoadingRight: {
    flex: 1.8,
    minWidth: 0,
  },
  stripCard: {
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  stripRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  stripItem: {
    flexBasis: isDesktop ? '25%' : '50%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  stripDivider: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  stripIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stripInfo: {
    flex: 1,
    minWidth: 0,
  },
  stripLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  stripValue: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 28,
    marginTop: 2,
  },
  stripSub: {
    fontSize: 9.5,
    color: colors.textMuted,
    fontWeight: '500',
    marginTop: 1,
  },
  finStripCard: {
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  finStripRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  finStripColumn: {
    flexDirection: 'column',
  },
  finStripItem: {
    flexBasis: isDesktop ? '33.33%' : '100%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  finStripDivider: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  finStripIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finStripLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.7,
  },
  finStripValue: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  finStripSub: {
    fontSize: 9.5,
    color: colors.textMuted,
    marginTop: 1,
    fontWeight: '500',
  },
  paymentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 5,
  },
  paymentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  paymentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  paymentText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chartsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 20,
  },
  chartsRowMobile: {
    flexDirection: 'column',
    gap: 0,
  },
  mainChartCol: {
    flex: 1.65,
    minWidth: 0,
  },
  sideChartCol: {
    flex: 1,
    minWidth: 0,
  },
  breakdownCard: {
    flex: 1,
    marginBottom: spacing.lg,
  },
  chartPlaceholder: {
    marginBottom: spacing.lg,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 18,
  },
  cardTitleBox: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 3,
    fontWeight: '500',
  },
  cardTitleValue: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: -0.2,
  },
  typeLoading: {
    gap: 14,
    marginTop: 6,
  },
  typeRow: {
    marginBottom: 15,
  },
  typeMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  typeLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1,
  },
  typeValue: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textMuted,
  },
  typeTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  typeFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 16,
    marginBottom: spacing.lg,
  },
  bottomRowMobile: {
    flexDirection: 'column',
    gap: 0,
  },
  bottomCard: {
    flex: 1,
    minWidth: 0,
    marginBottom: isDesktop ? 0 : spacing.lg,
  },
  cardEyebrow: {
    fontSize: 8.5,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
    flexShrink: 1,
  },
  cardEyebrowValue: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 16,
    marginBottom: 12,
  },
  goalValue: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
  },
  goalCount: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.textMuted,
  },
  goalCountMuted: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  goalTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  goalCaption: {
    fontSize: 9.5,
    color: colors.textMuted,
    marginTop: 10,
    fontWeight: '500',
  },
  perfRow: {
    marginBottom: 14,
  },
  perfMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  perfName: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  perfValue: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  perfTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  perfFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.textMuted,
  },
  bottomSpace: { height: 60 },
});
