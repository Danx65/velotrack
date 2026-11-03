import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { typography, radii, spacing } from '../../src/theme/colors';
import { useThemeColors } from '../../src/theme';

import { suporteService } from '../../src/services/suporte';
import { useQuery } from '../../src/hooks/useQuery';
import { Card } from '../../src/ui/Card';
import { Skeleton, SkeletonCard } from '../../src/ui/Skeleton';
import Header from '../../src/ui/Header';

export default function SuporteAdmin() {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const { data: mensagens, loading, refetch } = useQuery(
    ['suporte-admin'],
    () => suporteService.listAll(),
    { cacheTime: 10000 }
  );

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) +
      ' • ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = useCallback(({ item }) => {
    if (!item) return null;
    return (
      <Card style={{ marginBottom: spacing.sm, padding: spacing.xl }}>
        <View style={styles.cardHead}>
          <View style={styles.senderRow}>
            <View style={styles.avatar}>
              <Ionicons name="person-outline" size={15} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.senderName}>{item.users?.nome || 'Desconhecido'}</Text>
              <Text style={styles.senderRole}>Técnico especializado</Text>
            </View>
          </View>
          <Text style={styles.date}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={styles.divider} />
        <Text style={styles.message}>{item.mensagem || ''}</Text>
        {item.fotos?.[0] && (
          <Image source={{ uri: item.fotos[0] }} style={styles.image} resizeMode="cover" />
        )}
      </Card>
    );
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Suporte" />
        <View style={styles.center}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} lines={3} />)}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Suporte</Text>
          <Text style={styles.sub}>{mensagens?.length || 0} comunicados de suporte</Text>
        </View>
        <View style={styles.countBadge}>
          <Ionicons name="chatbubbles-outline" size={15} color={colors.primary} />
          <Text style={styles.countText}>{mensagens?.length || 0}</Text>
        </View>
      </View>
      <FlatList
        data={mensagens || []}
        keyExtractor={(item, index) => item?.id || String(index)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="chatbubble-ellipses-outline" size={44} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Nenhuma mensagem</Text>
            <Text style={styles.emptySub}>As mensagens e chamados dos técnicos de campo aparecerão aqui.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.xl,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  countBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(99,91,255,0.06)', paddingHorizontal: 11, paddingVertical: 6, borderRadius: radii.md,
    borderWidth: 1, borderColor: 'rgba(99,91,255,0.12)',
  },
  countText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 40, paddingTop: spacing.md },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  senderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 34, height: 34, borderRadius: radii.md,
    backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(99,91,255,0.15)',
  },
  senderName: { color: colors.text, fontWeight: '700', fontSize: 13 },
  senderRole: { color: colors.textMuted, fontSize: 11, marginTop: 1, fontWeight: '500' },
  date: { color: colors.textMuted, fontSize: 11, fontWeight: '500' },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.md },
  message: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, fontWeight: '500' },
  image: { width: '100%', height: 200, borderRadius: radii.lg, marginTop: spacing.md },
  emptyBox: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.textSecondary },
  emptySub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', maxWidth: 280, lineHeight: 18 },
});
