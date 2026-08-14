import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Switch,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { typography, radii, spacing } from '../../src/theme/colors';
import { useThemeColors } from '../../src/theme';
import { supabase } from '../../src/lib/supabase';

import { Card, CardSection } from '../../src/ui/Card';
import Button from '../../src/ui/Button';

const alert = (title, msg) => {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
  else {
    Alert.alert(title, msg);
  }
};

export default function ConfigsScreen() {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const { signOut, isDark, toggleTheme, profile } = useAuth();
  const [targetGoal, setTargetGoal] = useState('100');
  const [loadingGoal, setLoadingGoal] = useState(true);
  const [savingGoal, setSavingGoal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('configuracoes')
          .select('meta_mensal')
          .maybeSingle();
        if (data && typeof data.meta_mensal === 'number') {
          setTargetGoal(String(data.meta_mensal));
        }
      } catch {
      } finally {
        setLoadingGoal(false);
      }
    })();
  }, []);

  const handleSaveGoal = async () => {
    setSavingGoal(true);
    try {
      await supabase
        .from('configuracoes')
        .upsert({ id: 'fc6cabe0-9584-4252-80c5-2fe339b477d6', meta_mensal: parseInt(targetGoal, 10) || 100 }, { onConflict: 'id' });
      alert('Sucesso', 'Meta de OS do mês salva com sucesso!');
    } catch (err) {
      alert('Erro', err.message || 'Falha ao salvar a meta.');
    } finally {
      setSavingGoal(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Configurações</Text>
        <Text style={styles.sub}>Perfil, aparência e preferências globais</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* PROFILE INFO CARD */}
        <Card style={styles.card}>
          <CardSection label="Perfil do Administrador">
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {profile?.nome?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'AD'}
                </Text>
              </View>
              <View style={styles.profileMeta}>
                <Text style={[styles.profileName, { color: colors.text }]}>{profile?.nome || 'Administrador Velotrack'}</Text>
                <Text style={styles.profileEmail}>{profile?.email || 'admin@velotrack.com'}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>ADMINISTRADOR PRINCIPAL</Text>
                </View>
              </View>
            </View>
          </CardSection>
        </Card>

        {/* TEMA CARD */}
        <Card style={styles.card}>
          <CardSection label="Aparência Visual & Tema">
            <View style={styles.row}>
              <View style={styles.metaRow}>
                <Ionicons name={isDark ? "moon" : "sunny"} size={20} color={colors.primary} />
                <View>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>Mesa Premium Escura</Text>
                  <Text style={styles.rowDesc}>Alternar entre modo escuro premium e claro minimalista</Text>
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

        {/* META CARD */}
        <Card style={styles.card}>
          <CardSection label="Metas de Produtividade Mensal">
            <View style={styles.configItem}>
              <Text style={[styles.configLabel, { color: colors.textSecondary }]}>Meta de OS do Mês</Text>
              <Text style={styles.configDesc}>Número de serviços finalizados que serve de base para o progresso do painel comercial</Text>
              {loadingGoal ? (
                <View style={[styles.inputContainer, { justifyContent: 'center' }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : (
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputText, { color: colors.text }]}>{targetGoal} OS / Mês</Text>
                  <View style={styles.adjustRow}>
                    <Pressable
                      onPress={() => setTargetGoal(prev => String(Math.max(10, parseInt(prev, 10) - 10)))}
                      style={[styles.adjustBtn, { borderColor: colors.border }]}
                    >
                      <Ionicons name="remove" size={16} color={colors.text} />
                    </Pressable>
                    <Pressable
                      onPress={() => setTargetGoal(prev => String(parseInt(prev, 10) + 10))}
                      style={[styles.adjustBtn, { borderColor: colors.border }]}
                    >
                      <Ionicons name="add" size={16} color={colors.text} />
                    </Pressable>
                  </View>
                </View>
              )}
              <Button
                title="SALVAR META"
                onPress={handleSaveGoal}
                loading={savingGoal}
                variant="outline"
                style={{ marginTop: spacing.md }}
              />
            </View>
          </CardSection>
        </Card>

        {/* LOGOUT SYSTEM */}
        <Button
          title="ENCERRAR SESSÃO NO VELOTRACK"
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
    fontWeight: '800',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
    marginTop: 4,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
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
  configItem: {
    paddingVertical: spacing.sm,
  },
  configLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  configDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 16,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: spacing.md,
    borderRadius: radii.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputText: {
    fontSize: 14,
    fontWeight: '800',
  },
  adjustRow: {
    flexDirection: 'row',
    gap: 8,
  },
  adjustBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  signOutBtn: {
    marginTop: spacing.sm,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  bottomSpace: { height: 60 },
});