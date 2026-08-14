import { useState, useCallback, memo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { typography, radii, spacing } from '../../src/theme/colors';
import { useThemeColors } from '../../src/theme';

import { tecnicosService } from '../../src/services/tecnicos';
import { Card } from '../../src/ui/Card';
import Input from '../../src/ui/Input';
import Button from '../../src/ui/Button';
import { Skeleton, SkeletonCard } from '../../src/ui/Skeleton';

const alert = (title, msg) => {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
  else { Alert.alert(title, msg); }
};

const TecnicoItem = ({ item, onEdit, onToggle, colors, styles }) => (
  <Card style={{ marginBottom: spacing.sm }}>
    <View style={styles.cardHead}>
      <View style={styles.cardLeft}>
        <View style={styles.cardAvatar}>
          <Ionicons name="person" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{item.nome}</Text>
          <Text style={styles.cardInfo}>{item.email}</Text>
          <Text style={styles.cardInfo}>{item.telefone || 'Sem telefone'}</Text>
        </View>
      </View>
      <View style={[styles.statusBadge, {
        backgroundColor: item.active ? colors.successSoft : colors.errorSoft,
        borderColor: item.active ? colors.success : colors.error,
      }]}>
        <View style={[styles.statusDot, { backgroundColor: item.active ? colors.success : colors.error }]} />
        <Text style={[styles.statusText, { color: item.active ? colors.success : colors.error }]}>
          {item.active ? 'Ativo' : 'Inativo'}
        </Text>
      </View>
    </View>
    <View style={styles.cardMeta}>
      <Text style={styles.metaText}>Cadastrado em {new Date(item.created_at).toLocaleDateString('pt-BR')}</Text>
    </View>
    <View style={styles.cardActions}>
      <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(item)} activeOpacity={0.7}>
        <Ionicons name="create-outline" size={15} color={colors.primary} />
        <Text style={[styles.actionText, { color: colors.primary }]}>Editar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionBtn, { borderColor: item.active ? colors.error : colors.success }]} onPress={() => onToggle(item)} activeOpacity={0.7}>
        <Ionicons name={item.active ? 'eye-off-outline' : 'eye-outline'} size={15} color={item.active ? colors.error : colors.success} />
        <Text style={[styles.actionText, { color: item.active ? colors.error : colors.success }]}>
          {item.active ? 'Desativar' : 'Ativar'}
        </Text>
      </TouchableOpacity>
    </View>
  </Card>
);

export default function GestaoTecnicos() {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTecnico, setEditingTecnico] = useState(null);
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchTecnicos = useCallback(async () => {
    try {
      const data = await tecnicosService.list();
      setTecnicos(data);
    } catch (err) {
      alert('Erro', 'Não foi possível carregar a lista de técnicos.');
    }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchTecnicos(); }, []));

  const handleRegister = async () => {
    setErrorMsg(null);
    if (!form.nome || !form.email || !form.password) {
      alert('Atenção', 'Nome, e-mail e senha são obrigatórios.');
      return;
    }
    if (form.password.length < 6) {
      alert('Atenção', 'A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    setSubmitting(true);
    try {
      const { needsConfirmation } = await tecnicosService.create(form);
      alert('Sucesso', 'Técnico cadastrado com sucesso!');
      if (needsConfirmation) {
        alert('Confirmação necessária', 'O técnico precisa confirmar o e-mail antes do primeiro login.');
      }
      setForm({ nome: '', telefone: '', email: '', password: '' });
      setShowForm(false);
      fetchTecnicos();
    } catch (error) {
      setErrorMsg(error.message || 'Falha ao cadastrar técnico.');
      alert('Erro', error.message || 'Falha ao cadastrar técnico.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!form.nome) { alert('Atenção', 'Nome é obrigatório.'); return; }
    setSubmitting(true);
    try {
      await tecnicosService.update(editingTecnico.id, { nome: form.nome, telefone: form.telefone });
      alert('Sucesso', 'Técnico atualizado com sucesso!');
      setForm({ nome: '', telefone: '', email: '', password: '' });
      setEditingTecnico(null);
      setShowForm(false);
      fetchTecnicos();
    } catch (error) {
      alert('Erro', error.message || 'Falha ao atualizar técnico.');
    } finally { setSubmitting(false); }
  };

  const handleToggleActive = async (tecnico) => {
    try {
      await tecnicosService.toggleActive(tecnico.id, tecnico.active);
      alert('Sucesso', `Técnico ${tecnico.active ? 'desativado' : 'ativado'} com sucesso!`);
      fetchTecnicos();
    } catch (error) {
      alert('Erro', error.message || 'Não foi possível alterar o status.');
    }
  };

  const renderItem = useCallback(({ item }) => (
    <TecnicoItem
      item={item}
      colors={colors}
      styles={styles}
      onEdit={(tec) => { setEditingTecnico(tec); setForm({ nome: tec.nome, telefone: tec.telefone || '', email: tec.email, password: '' }); setShowForm(true); }}
      onToggle={handleToggleActive}
    />
  ), [colors, styles]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Técnicos</Text>
          <Text style={styles.headerSub}>{tecnicos.length} cadastrados</Text>
        </View>
        <Button
          title={showForm ? 'Voltar' : 'Cadastrar'}
          variant={showForm ? 'secondary' : 'primary'}
          size="sm"
          onPress={() => { setErrorMsg(null); if (showForm) { setEditingTecnico(null); setForm({ nome: '', telefone: '', email: '', password: '' }); } setShowForm(!showForm); }}
        />
      </View>

      {showForm ? (
        <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.formTitle}>{editingTecnico ? 'Editar Técnico' : 'Novo Técnico'}</Text>
          <Input label="Nome Completo *" value={form.nome} onChangeText={(v) => setForm({...form, nome: v})} icon="person-outline" />
          {!editingTecnico && (
            <>
              <Input label="E-mail *" value={form.email} onChangeText={(v) => setForm({...form, email: v})} keyboardType="email-address" autoCapitalize="none" icon="mail-outline" />
              <Input label="Senha Provisória *" value={form.password} onChangeText={(v) => setForm({...form, password: v})} secureTextEntry icon="lock-closed-outline" />
            </>
          )}
          <Input label="Telefone" value={form.telefone} onChangeText={(v) => setForm({...form, telefone: v})} keyboardType="phone-pad" icon="call-outline" />
          {errorMsg && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}
          <Button title={editingTecnico ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR TÉCNICO'} onPress={editingTecnico ? handleUpdate : handleRegister} loading={submitting} fullWidth style={{ marginTop: spacing.xl }} />
        </ScrollView>
      ) : loading ? (
        <View style={styles.center}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} lines={3} />)}
        </View>
      ) : (
        <FlatList
          data={tecnicos}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchTecnicos(); setRefreshing(false); }} tintColor={colors.primary} />}
          ListEmptyComponent={!loading && <Text style={styles.emptyText}>Nenhum técnico cadastrado.</Text>}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { ...typography.h2, color: colors.text },
  headerSub: { ...typography.caption, color: colors.textMuted, marginTop: 1 },
  list: { padding: spacing.xl, paddingBottom: 100 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  cardAvatar: {
    width: 40, height: 40, borderRadius: radii.md,
    backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center',
  },
  cardName: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  cardInfo: { fontSize: 13, color: colors.textSecondary, marginBottom: 1 },
  cardMeta: { marginTop: spacing.sm, marginBottom: spacing.sm },
  metaText: { fontSize: 11, color: colors.textMuted },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.sm, borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  cardActions: { flexDirection: 'row', gap: 8, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 7, paddingHorizontal: 12, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.border, flex: 1, justifyContent: 'center',
  },
  actionText: { fontSize: 12, fontWeight: '600' },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  formContainer: { padding: spacing.xl },
  formTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.xl },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.errorSoft, padding: spacing.md, borderRadius: radii.md,
    marginTop: spacing.lg, borderWidth: 1, borderColor: colors.error,
  },
  errorText: { color: colors.error, fontSize: 13, fontWeight: '600', flex: 1 },
});
