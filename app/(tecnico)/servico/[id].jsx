import { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Platform, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../src/contexts/AuthContext';
import { typography, radii, spacing } from '../../../src/theme/colors';
import { useThemeColors } from '../../../src/theme';

import { servicosService, photoService } from '../../../src/services/servicos';
import { historyService } from '../../../src/services/history';
import { Card, CardSection } from '../../../src/ui/Card';
import Header from '../../../src/ui/Header';
import { SkeletonCard } from '../../../src/ui/Skeleton';
import Timer from '../../../src/ui/Timer';
import ServiceInfo from '../../../src/features/ServiceInfo';
import ServiceVehicle from '../../../src/features/ServiceVehicle';
import ServiceTimeline from '../../../src/features/ServiceTimeline';
import Checklist from '../../../src/features/Checklist';
import PhotosSection from '../../../src/features/PhotosSection';

const CHECKLIST_ITEMS = [
  'Equipamento fixado corretamente',
  'Fiação isolada e protegida',
  'Sinal GPS testado e funcionando',
  'Plataforma configurada',
  'Cliente orientado sobre o sistema',
];

const alert = (title, msg) => {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
  else { Alert.alert(title, msg); }
};

function formatDuration(inicio, fim) {
  if (!inicio || !fim) return '-';
  const diff = Math.floor((new Date(fim) - new Date(inicio)) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

function formatDate(d) {
  if (!d) return null;
  const date = new Date(d);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) +
    ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function ServiceDetail() {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [checklist, setChecklist] = useState(CHECKLIST_ITEMS.map(item => ({ label: item, checked: false })));
  const [observations, setObservations] = useState('');
  const [photos, setPhotos] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchService = useCallback(async () => {
    try {
      const data = await servicosService.getById(id);
      setService(data);
      setObservations(data.observations || '');
      setPhotos(data.fotos || []);
      if (data.checklist && data.checklist.length > 0) setChecklist(data.checklist);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { fetchService(); }, [fetchService]));

  const handleCall = () => {
    const digits = (service?.telefone || '').replace(/[^\d]/g, '');
    if (!digits) return;
    const url = `tel:+${digits}`;
    if (Platform.OS === 'web') window.location.href = url;
    else Linking.openURL(url);
  };

  const STATUS_LABEL = {
    pendente: 'Pendente',
    em_andamento: 'Em andamento',
    concluido: 'Concluído',
  };

  const buildWhatsAppMessage = () => {
    const lines = [
      'Olá! Aqui é da Velotrack.',
      service?.cliente ? `Cliente: ${service.cliente}` : null,
      service?.endereco ? `Endereço: ${service.endereco}` : null,
      service?.veiculo ? `Veículo: ${service.veiculo}${service.placa ? ` (${service.placa})` : ''}` : null,
      service?.tipo ? `Serviço: ${service.tipo}` : null,
      service?.status ? `Status: ${STATUS_LABEL[service.status] || service.status}` : null,
    ].filter(Boolean).join('\n');
    return encodeURIComponent(lines);
  };

  const handleWhatsApp = () => {
    let digits = (service?.telefone || '').replace(/[^\d]/g, '');
    if (!digits) return;
    if (!digits.startsWith('55')) digits = `55${digits}`;
    const url = `https://wa.me/${digits}?text=${buildWhatsAppMessage()}`;
    if (Platform.OS === 'web') window.open(url, '_blank');
    else Linking.openURL(url);
  };

  const handleCopyPhone = () => {
    const digits = (service?.telefone || '').replace(/[^\d]/g, '');
    if (!digits) return;
    if (Platform.OS === 'web') {
      navigator.clipboard?.writeText(digits);
      alert('Copiado', 'Número copiado para a área de transferência.');
    } else {
      alert('Telefone', service.telefone);
    }
  };

  const handleStart = async () => {
    setUpdating(true);
    try {
      await servicosService.startService(id);
      await historyService.log(id, user?.id, historyService.ACTIONS.STARTED, 'Serviço iniciado pelo técnico');
      await fetchService();
    } catch { alert('Erro', 'Não foi possível iniciar o serviço.'); } finally { setUpdating(false); }
  };

  const handleFinish = async () => {
    setUpdating(true);
    try {
      await servicosService.finishService(id, { checklist, observations, fotos: photos });
      await historyService.log(id, user?.id, historyService.ACTIONS.FINISHED, 'Serviço finalizado');
      alert('Sucesso', 'Serviço finalizado com sucesso!');
      router.replace('/(tecnico)');
    } catch { alert('Erro', 'Não foi possível finalizar o serviço.'); } finally { setUpdating(false); }
  };

  const toggleChecklist = async (index) => {
    const updated = [...checklist];
    updated[index] = { ...updated[index], checked: !updated[index].checked };
    setChecklist(updated);
    try {
      await servicosService.updateChecklist(id, updated);
      await historyService.log(id, user?.id, historyService.ACTIONS.CHECKLIST_UPDATED, `Checklist: ${updated.filter(c => c.checked).length}/${updated.length}`);
    } catch {}
  };

  const saveObservations = async () => {
    try {
      await servicosService.updateObservations(id, observations);
      if (observations.trim()) {
        await historyService.log(id, user?.id, historyService.ACTIONS.OBSERVATION_ADDED, 'Observação registrada');
      }
    } catch {}
  };

  const pickAndUploadPhoto = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = 'image/*';
        input.onchange = async (e) => {
          const file = e.target.files[0]; if (!file) return;
          setUploadingPhoto(true);
          try {
            const url = await photoService.upload(file);
            const newPhotos = [...photos, url];
            setPhotos(newPhotos);
            await servicosService.addPhoto(id, newPhotos);
            await historyService.log(id, user?.id, historyService.ACTIONS.PHOTO_ADDED, 'Foto adicionada');
          } catch { alert('Erro', 'Não foi possível enviar a foto.'); } finally { setUploadingPhoto(false); }
        };
        input.click();
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, base64: true });
        if (result.canceled) return;
        setUploadingPhoto(true);
        try {
          const url = await photoService.uploadBase64(result.assets[0].base64);
          const newPhotos = [...photos, url];
          setPhotos(newPhotos);
          await servicosService.addPhoto(id, newPhotos);
          await historyService.log(id, user?.id, historyService.ACTIONS.PHOTO_ADDED, 'Foto adicionada');
        } catch { alert('Erro', 'Não foi possível enviar a foto.'); } finally { setUploadingPhoto(false); }
      }
    } catch {}
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <SkeletonCard lines={2} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={4} />
        </View>
      </SafeAreaView>
    );
  }

  if (!service) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}><Text style={{ color: colors.textSecondary }}>Serviço não encontrado.</Text></View>
      </SafeAreaView>
    );
  }

  const isActive = service.status === 'em_andamento';
  const isConcluido = service.status === 'concluido';
  const canEdit = service.status !== 'concluido';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Ordem de Serviço" onBack={() => router.replace('/(tecnico)')} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchService} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        <ServiceInfo service={service} />
        <ServiceVehicle service={service} />

        {service.telefone ? (
          <Card>
            <CardSection label="Contato com o Cliente">
              <View style={styles.contactRow}>
                <View style={styles.contactIcon}>
                  <Ionicons name="call-outline" size={16} color={colors.primary} />
                </View>
                <Text style={styles.contactValue}>{service.telefone}</Text>
                <View style={styles.contactActions}>
                  <TouchableOpacity style={styles.contactBtn} onPress={handleWhatsApp} activeOpacity={0.7}>
                    <Ionicons name="logo-whatsapp" size={14} color={colors.success} />
                    <Text style={[styles.contactBtnText, { color: colors.success }]}>WhatsApp</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.contactBtn} onPress={handleCall} activeOpacity={0.7}>
                    <Ionicons name="call" size={14} color={colors.primary} />
                    <Text style={styles.contactBtnText}>Ligar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.contactBtn} onPress={handleCopyPhone} activeOpacity={0.7}>
                    <Ionicons name="copy-outline" size={14} color={colors.textMuted} />
                    <Text style={[styles.contactBtnText, { color: colors.textMuted }]}>Copiar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </CardSection>
          </Card>
        ) : null}

        <Card>
          <CardSection label="Técnico e Datas">
            <View style={styles.techRow}>
              <Ionicons name="person-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.techName}>{service.users?.nome || user?.email || '—'}</Text>
            </View>
            <View style={styles.datesGrid}>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Criação</Text>
                <Text style={styles.dateValue}>{formatDate(service.created_at)}</Text>
              </View>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Início</Text>
                <Text style={styles.dateValue}>{formatDate(service.tempo_inicio) || '—'}</Text>
              </View>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Término</Text>
                <Text style={styles.dateValue}>{formatDate(service.tempo_fim) || '—'}</Text>
              </View>
            </View>
          </CardSection>
        </Card>

        <ServiceTimeline serviceId={id} />

        {isActive && <Timer startTime={service.tempo_inicio} />}

        {service.status === 'pendente' && (
          <TouchableOpacity style={styles.startBtn} onPress={handleStart} disabled={updating} activeOpacity={0.8}>
            {updating ? <ActivityIndicator color="#FFF" /> : (
              <View style={styles.btnRow}>
                <Ionicons name="play-circle" size={22} color="#FFF" />
                <Text style={styles.btnText}>INICIAR ATENDIMENTO</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {(isActive || isConcluido) && (
          <Checklist checklist={checklist} onToggle={toggleChecklist} canEdit={canEdit} />
        )}

        {(isActive || isConcluido) && (
          <PhotosSection photos={photos} onAdd={pickAndUploadPhoto} uploading={uploadingPhoto} canEdit={canEdit} />
        )}

        {(isActive || isConcluido) && (
          <Card>
            <Text style={styles.sectionLabel}>OBSERVAÇÕES</Text>
            <TextInput
              style={styles.obsInput}
              placeholder="Notas sobre o serviço..."
              placeholderTextColor={colors.textMuted}
              value={observations}
              onChangeText={setObservations}
              onBlur={saveObservations}
              multiline
              numberOfLines={4}
              editable={canEdit}
            />
          </Card>
        )}

        {isActive && (
          <TouchableOpacity style={styles.finishBtn} onPress={handleFinish} disabled={updating} activeOpacity={0.8}>
            {updating ? <ActivityIndicator color="#FFF" /> : (
              <View style={styles.btnRow}>
                <Ionicons name="checkmark-done-circle" size={22} color="#FFF" />
                <Text style={styles.btnText}>FINALIZAR SERVIÇO</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {isConcluido && (
          <View style={styles.completedSection}>
            <Ionicons name="checkmark-circle" size={36} color={colors.success} />
            <Text style={styles.completedTitle}>Serviço Concluído</Text>
            <View style={styles.completedMeta}>
              <View style={styles.completedItem}>
                <Text style={styles.completedLabel}>Duração</Text>
                <Text style={styles.completedValue}>{formatDuration(service.tempo_inicio, service.tempo_fim)}</Text>
              </View>
              <View style={styles.completedItem}>
                <Text style={styles.completedLabel}>Finalizado</Text>
                <Text style={styles.completedValue}>{formatDate(service.tempo_fim)}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  content: { padding: spacing.xl },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 1.2, marginBottom: spacing.md, textTransform: 'uppercase',
  },
  techRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  techName: { fontSize: 14, fontWeight: '600', color: colors.text },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  contactIcon: {
    width: 36, height: 36, borderRadius: radii.md,
    backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center',
  },
  contactValue: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text },
  contactActions: { flexDirection: 'row', gap: 8 },
  contactBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 8, paddingHorizontal: 10, borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border,
  },
  contactBtnText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  datesGrid: { flexDirection: 'row', gap: 8 },
  dateItem: {
    flex: 1, backgroundColor: colors.card,
    padding: spacing.sm, borderRadius: radii.md,
  },
  dateLabel: {
    fontSize: 9, color: colors.textMuted, fontWeight: '600',
    textTransform: 'uppercase', marginBottom: 3,
  },
  dateValue: { fontSize: 12, color: colors.text, fontWeight: '600' },
  startBtn: {
    backgroundColor: colors.success, borderRadius: radii.lg, height: 52,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md,
  },
  finishBtn: {
    backgroundColor: colors.primary, borderRadius: radii.lg, height: 52,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md,
  },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnText: { fontSize: 15, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
  obsInput: {
    backgroundColor: colors.surfaceElevated, borderRadius: radii.md, padding: spacing.md,
    color: colors.text, fontSize: 13, minHeight: 90, textAlignVertical: 'top',
    borderWidth: 1, borderColor: colors.border,
  },
  completedSection: {
    alignItems: 'center', backgroundColor: colors.successSoft, borderRadius: radii.xl,
    padding: spacing['2xl'], marginBottom: spacing.md, gap: 8,
    borderWidth: 1, borderColor: colors.success,
  },
  completedTitle: { fontSize: 19, fontWeight: '800', color: colors.success },
  completedMeta: { flexDirection: 'row', gap: 20, marginTop: 2 },
  completedItem: { alignItems: 'center', gap: 3 },
  completedLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  completedValue: { fontSize: 14, fontWeight: '700', color: colors.text },
});
