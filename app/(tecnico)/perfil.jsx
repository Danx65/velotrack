import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { spacing, radii } from '../../src/theme/colors';
import { useThemeColors } from '../../src/theme';

import { servicosService } from '../../src/services/servicos';
import { Card, CardSection } from '../../src/ui/Card';
import Button from '../../src/ui/Button';

const alert = (title, msg) => {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
  else {
    Alert.alert(title, msg);
  }
};

export default function TecnicoPerfil() {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const { profile, signOut, isDark, toggleTheme } = useAuth();
  const [loading, setLoading] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const fetchStats = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const res = await servicosService.list({
        technicianId: profile.id,
        status: 'concluido'
      });
      setCompletedCount(res.count || 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [fetchStats])
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Meu Perfil</Text>
        <Text style={styles.sub}>Dados operacionais e configurações pessoais</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* OPERATOR PROFILE SECTION */}
        <Card style={styles.card}>
          <CardSection label="Ficha Cadastral">
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {profile?.nome?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'OP'}
                </Text>
              </View>
              <View style={styles.profileMeta}>
                <Text style={[styles.profileName, { color: colors.text }]}>{profile?.nome || 'Operador Velotrack'}</Text>
                <Text style={styles.profileEmail}>{profile?.email || 'tecnico@velotrack.com'}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>OPERADOR DE CAMPO</Text>
                </View>
              </View>
            </View>
          </CardSection>
        </Card>

        {/* METRICS / STATS BOXES */}
        <View style={styles.grid}>
          <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.statLabel}>OS CONCLUÍDAS</Text>
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 8 }} />
            ) : (
              <Text style={[styles.statValue, { color: colors.text }]}>{completedCount}</Text>
            )}
            <Text style={styles.statSub}>Faturamento garantido</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.statLabel}>TAXA DE SUCESSO</Text>
            <Text style={[styles.statValue, { color: colors.success }]}>100%</Text>
            <Text style={styles.statSub}>Feedback excelente</Text>
          </View>
        </View>

        {/* UTILITIES - TEMA */}
        <Card style={styles.card}>
          <CardSection label="Aparência do Aplicativo">
            <View style={styles.row}>
              <View style={styles.metaRow}>
                <Ionicons name={isDark ? "moon" : "sunny"} size={18} color={colors.primary} />
                <View>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>Mesa Premium Escura</Text>
                  <Text style={styles.rowDesc}>Alternar entre modo escuro e modo claro minimalista</Text>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor={colors.text}
              />
            </View>
          </CardSection>
        </Card>

        {/* CONTACT / SUPPORT CARDS */}
        <Card style={styles.card}>
          <CardSection label="Centro de Ajuda & Central">
            <View style={styles.helpItem}>
              <Text style={[styles.helpTitle, { color: colors.textSecondary }]}>📞 Canais de Emergência</Text>
              <Text style={styles.helpDesc}>Para dúvidas quanto ao bloqueio remoto ou central de telemetria, contate o administrador imediatamente no painel interno.</Text>
            </View>
          </CardSection>
        </Card>

        {/* LOGOUT BUTTON */}
        <Button
          title="SAIR DA MINHA CONTA"
          onPress={async () => { await signOut(); }}
          variant="outline"
          style={styles.signOutBtn}
        />

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
  card: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: spacing.sm,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(230,0,80,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(230,0,80,0.15)',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '850',
    color: colors.primary,
  },
  profileMeta: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '800',
  },
  profileEmail: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.text === '#FFFFFF' ? 'rgba(255,255,255,0.05)' : 'rgba(15, 23, 42, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    padding: spacing.xl,
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: 4,
    shadowColor: colors.shadowColor,
    shadowOffset: colors.shadowOffsetDesktop || { width: 0, height: 4 },
    shadowOpacity: colors.shadowOpacityDesktop || 0.05,
    shadowRadius: colors.shadowRadiusDesktop || 12,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
  },
  statSub: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  rowDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  helpItem: {
    gap: 4,
    paddingVertical: spacing.sm,
  },
  helpTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  helpDesc: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
    fontWeight: '500',
  },
  signOutBtn: {
    marginTop: spacing.sm,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  bottomSpace: { height: 60 },
});
