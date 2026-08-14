import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { typography, radii, spacing } from '../../src/theme/colors';
import { useThemeColors } from '../../src/theme';

import { suporteService } from '../../src/services/suporte';
import { Card } from '../../src/ui/Card';
import { SkeletonCard } from '../../src/ui/Skeleton';
import Header from '../../src/ui/Header';

export default function TecnicoSuporte() {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      const data = await suporteService.listByUser(user?.id);
      setMessages(data || []);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { fetchMessages(); }, [fetchMessages]));

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      await suporteService.send(user?.id, newMessage);
      setNewMessage('');
      fetchMessages();
    } catch {} finally {
      setSending(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';
    const today = new Date();
    const isToday = date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
    if (isToday) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) +
      ' • ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = useCallback(({ item }) => {
    if (!item) return null;
    return (
      <Card style={{ marginBottom: spacing.sm }}>
        <View style={styles.messageHead}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={16} color={colors.primary} />
          </View>
          <Text style={styles.messageSender}>{profile?.nome || 'Técnico'}</Text>
          <Text style={styles.messageDate}>{formatDate(item.created_at)}</Text>
        </View>
        <Text style={styles.messageText}>{item.mensagem || ''}</Text>
      </Card>
    );
  }, [profile?.nome]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Suporte" subtitle="Envie mensagens para o administrador" />
        <View style={styles.center}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} lines={2} />)}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Suporte</Text>
        <Text style={styles.sub}>Envie mensagens para o administrador</Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item, index) => item?.id || String(index)}
        renderItem={renderMessage}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMessages(); }} tintColor={colors.primary} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Nenhuma mensagem</Text>
            <Text style={styles.emptySub}>Envie sua primeira mensagem para o administrador.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.inputField}
          placeholder="Digite sua mensagem..."
          placeholderTextColor={colors.textMuted}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!newMessage.trim() || sending) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={sending || !newMessage.trim()}
          activeOpacity={0.8}
        >
          {sending ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Ionicons name="send" size={18} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  header: {
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { ...typography.h2, color: colors.text },
  sub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 10, paddingTop: spacing.sm },
  messageHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  avatar: {
    width: 28, height: 28, borderRadius: radii.sm,
    backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center',
  },
  messageSender: { fontSize: 13, fontWeight: '700', color: colors.text, flex: 1 },
  messageDate: { fontSize: 10, color: colors.textMuted },
  messageText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
  },
  inputField: {
    flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: radii.md,
    paddingHorizontal: spacing.md, paddingVertical: 10, color: colors.text,
    fontSize: 13, maxHeight: 90, borderWidth: 1, borderColor: colors.border,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.card, opacity: 0.5 },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.textSecondary },
  emptySub: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
