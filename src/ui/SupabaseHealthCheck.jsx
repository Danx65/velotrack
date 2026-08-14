import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { checkSupabaseConnection, getSupabaseConfig } from '../lib/supabase';
import { useThemeColors } from '../theme/useThemeColors';
import { radii, spacing } from '../theme/colors';
import { Card, CardSection } from './Card';
import Button from './Button';

export default function SupabaseHealthCheck({ style }) {
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [config, setConfig] = useState(getSupabaseConfig());

  const runCheck = async () => {
    setLoading(true);
    try {
      setConfig(getSupabaseConfig());
      const res = await checkSupabaseConnection();
      setHealth(res);
    } catch (err) {
      setHealth({
        timestamp: new Date().toISOString(),
        configured: false,
        status: 'error',
        message: err.message || 'Erro ao realizar diagnóstico.',
        latencyMs: null,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runCheck();
  }, []);

  const getStatusBadge = () => {
    if (loading && !health) {
      return {
        label: 'VERIFICANDO CONEXÃO...',
        color: colors.primary,
        bg: 'rgba(230,0,80,0.1)',
        icon: 'hourglass-outline',
      };
    }

    if (!health) {
      return {
        label: 'NÃO VERIFICADO',
        color: colors.textMuted,
        bg: 'rgba(255,255,255,0.05)',
        icon: 'help-circle-outline',
      };
    }

    if (health.status === 'connected') {
      return {
        label: 'ONLINE & CONECTADO',
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.12)',
        icon: 'checkmark-circle',
      };
    }

    if (health.status === 'unauthorized') {
      return {
        label: 'ACESSO RESTRITO / RLS',
        color: '#F59E0B',
        bg: 'rgba(245, 158, 11, 0.12)',
        icon: 'warning-outline',
      };
    }

    if (health.status === 'not_configured') {
      return {
        label: 'CHAVES NÃO CONFIGURADAS',
        color: '#EF4444',
        bg: 'rgba(239, 68, 68, 0.12)',
        icon: 'alert-circle',
      };
    }

    return {
      label: 'FALHA DE CONEXÃO',
      color: '#EF4444',
      bg: 'rgba(239, 68, 68, 0.12)',
      icon: 'close-circle',
    };
  };

  const statusBadge = getStatusBadge();

  return (
    <Card style={[styles.card, style]}>
      <CardSection label="Supabase Connection Health Check">
        {/* Header do Status */}
        <View style={styles.headerRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg, borderColor: statusBadge.color }]}>
            <Ionicons name={statusBadge.icon} size={14} color={statusBadge.color} />
            <Text style={[styles.statusBadgeText, { color: statusBadge.color }]}>
              {statusBadge.label}
            </Text>
          </View>

          {health?.latencyMs !== null && health?.latencyMs !== undefined && (
            <View style={styles.latencyBadge}>
              <Ionicons name="flash-outline" size={12} color={colors.textMuted} />
              <Text style={styles.latencyText}>{health.latencyMs} ms</Text>
            </View>
          )}
        </View>

        {/* Mensagem Principal */}
        <Text style={[styles.mainMessage, { color: colors.text }]}>
          {health?.message || 'Iniciando diagnóstico da infraestrutura Supabase...'}
        </Text>

        {/* Grid de Metadados de Ambiente */}
        <View style={styles.grid}>
          {/* Endpoint URL */}
          <View style={[styles.gridItem, { borderColor: colors.border }]}>
            <View style={styles.itemHeader}>
              <Ionicons name="globe-outline" size={14} color={colors.primary} />
              <Text style={styles.itemTitle}>SUPABASE_URL</Text>
            </View>
            <Text style={[styles.itemValue, { color: colors.text }]} numberOfLines={1} ellipsizeMode="middle">
              {config.url}
            </Text>
            <View style={styles.itemFooter}>
              <Text style={[styles.tag, config.isConfigured ? styles.tagSuccess : styles.tagWarning]}>
                {config.isConfigured ? 'Produção/Custom' : 'Modo Mock / Placeholder'}
              </Text>
            </View>
          </View>

          {/* Anon Key Status */}
          <View style={[styles.gridItem, { borderColor: colors.border }]}>
            <View style={styles.itemHeader}>
              <Ionicons name="key-outline" size={14} color={colors.primary} />
              <Text style={styles.itemTitle}>ANON_KEY (MASCARADA)</Text>
            </View>
            <Text style={[styles.itemValue, { color: colors.text }]} numberOfLines={1}>
              {config.maskedKey}
            </Text>
            <View style={styles.itemFooter}>
              <Text style={[styles.tag, config.key && !config.key.includes('placeholder') ? styles.tagSuccess : styles.tagWarning]}>
                {config.key && !config.key.includes('placeholder') ? 'Chave Injetada' : 'Chave Pendente'}
              </Text>
            </View>
          </View>
        </View>

        {/* Status Detalhado dos Serviços */}
        {health && (
          <View style={[styles.servicesBox, { borderColor: colors.border }]}>
            <View style={styles.serviceRow}>
              <View style={styles.serviceMeta}>
                <Ionicons 
                  name={health.authStatus === 'operational' ? "shield-checkmark-outline" : "warning-outline"} 
                  size={16} 
                  color={health.authStatus === 'operational' ? '#10B981' : '#F59E0B'} 
                />
                <Text style={[styles.serviceName, { color: colors.text }]}>Módulo de Autenticação (Auth)</Text>
              </View>
              <Text style={[styles.serviceStatus, { color: health.authStatus === 'operational' ? '#10B981' : colors.textSecondary }]}>
                {health.authStatus === 'operational' ? 'Operacional' : health.authStatus}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.serviceRow}>
              <View style={styles.serviceMeta}>
                <Ionicons 
                  name={health.status === 'connected' ? "server-outline" : "alert-circle-outline"} 
                  size={16} 
                  color={health.status === 'connected' ? '#10B981' : '#EF4444'} 
                />
                <Text style={[styles.serviceName, { color: colors.text }]}>Banco de Dados & REST API</Text>
              </View>
              <Text style={[styles.serviceStatus, { color: health.status === 'connected' ? '#10B981' : '#EF4444' }]}>
                {health.databaseStatus || (health.status === 'connected' ? 'Respondendo' : 'Offline')}
              </Text>
            </View>
          </View>
        )}

        {/* Instruções se não configurado */}
        {!config.isConfigured && (
          <View style={[styles.hintBox, { backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.25)' }]}>
            <Ionicons name="information-circle-outline" size={18} color="#F59E0B" />
            <Text style={[styles.hintText, { color: colors.textSecondary }]}>
              Para conectar seu projeto Supabase real, configure as variáveis <Text style={{ fontWeight: '800', color: colors.text }}>EXPO_PUBLIC_SUPABASE_URL</Text> e <Text style={{ fontWeight: '800', color: colors.text }}>EXPO_PUBLIC_SUPABASE_ANON_KEY</Text> nas configurações de ambiente ou arquivo .env.
            </Text>
          </View>
        )}

        {/* Ações */}
        <View style={styles.actionsRow}>
          <Button
            title={loading ? "TESTANDO CONEXÃO..." : "TESTAR CONEXÃO AGORA"}
            onPress={runCheck}
            loading={loading}
            variant="primary"
            style={styles.checkBtn}
          />
          <Pressable 
            onPress={() => setShowDetails(!showDetails)}
            style={[styles.detailsToggle, { borderColor: colors.border }]}
          >
            <Ionicons name={showDetails ? "chevron-up" : "code-slash-outline"} size={16} color={colors.textSecondary} />
            <Text style={[styles.detailsToggleText, { color: colors.textSecondary }]}>
              {showDetails ? 'Ocultar JSON' : 'Ver Logs'}
            </Text>
          </Pressable>
        </View>

        {/* Painel de JSON de Diagnóstico Expansível */}
        {showDetails && health && (
          <View style={[styles.rawBox, { backgroundColor: 'rgba(0,0,0,0.4)', borderColor: colors.border }]}>
            <Text style={styles.rawJson}>
              {JSON.stringify(health, null, 2)}
            </Text>
          </View>
        )}
      </CardSection>
    </Card>
  );
}

const getStyles = (colors) => StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  latencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  latencyText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  mainMessage: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  gridItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: 6,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  itemValue: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  itemFooter: {
    marginTop: 2,
  },
  tag: {
    fontSize: 9,
    fontWeight: '800',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  tagSuccess: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    color: '#10B981',
  },
  tagWarning: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    color: '#F59E0B',
  },
  servicesBox: {
    backgroundColor: 'rgba(255,255,255,0.015)',
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  serviceName: {
    fontSize: 12,
    fontWeight: '700',
  },
  serviceStatus: {
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: spacing.sm,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  hintText: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checkBtn: {
    flex: 1,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  detailsToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  rawBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  rawJson: {
    fontSize: 10,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    color: '#10B981',
    lineHeight: 14,
  },
});
