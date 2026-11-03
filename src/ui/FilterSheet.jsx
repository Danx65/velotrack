import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, ScrollView, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, radii, spacing } from '../theme/colors';
import { useThemeColors } from '../theme/useThemeColors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_SHEET_HEIGHT = SCREEN_HEIGHT * 0.72;
const OVERHEAD = 136;

const PERIOD_OPTIONS = [
  { key: 'hoje', label: 'Hoje' },
  { key: 'ontem', label: 'Ontem' },
  { key: '7d', label: '7 dias' },
  { key: 'mes', label: 'Este mês' },
];

const STATUS_OPTIONS = [
  { key: 'pendente', label: 'Pendente' },
  { key: 'em_andamento', label: 'Em andamento' },
  { key: 'concluido', label: 'Concluído' },
];

function Chip({ label, selected, onPress }) {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function FilterSheet({ visible, onClose, onApply, initialPeriod, initialStatus, initialTech, tecnicos }) {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const translateY = useRef(new Animated.Value(MAX_SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetHeightRef = useRef(MAX_SHEET_HEIGHT);

  const [sheetHeight, setSheetHeight] = useState(MAX_SHEET_HEIGHT);
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod || null);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus || null);
  const [selectedTech, setSelectedTech] = useState(initialTech || null);

  useEffect(() => {
    if (visible) {
      setSelectedPeriod(initialPeriod || null);
      setSelectedStatus(initialStatus || null);
      setSelectedTech(initialTech || null);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 22,
          stiffness: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: sheetHeightRef.current,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => onClose && onClose());
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: sheetHeightRef.current,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose && onClose());
  }, [onClose]);

  const handleApply = useCallback(() => {
    if (onApply) {
      onApply({ period: selectedPeriod, status: selectedStatus, technicianId: selectedTech });
    }
    handleClose();
  }, [selectedPeriod, selectedStatus, selectedTech, onApply, handleClose]);

  const handleContentSize = useCallback((_w, h) => {
    if (h > 0) {
      const total = Math.min(h + OVERHEAD, MAX_SHEET_HEIGHT);
      sheetHeightRef.current = total;
      setSheetHeight(total);
    }
  }, []);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </Pressable>

      <Animated.View style={[styles.sheet, { height: sheetHeight, transform: [{ translateY }] }]}>
        <View style={styles.handleBar} />

        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Filtros</Text>
          <TouchableOpacity onPress={handleClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerDivider} />

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={handleContentSize}
        >
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PERÍODO</Text>
            <View style={styles.chipGrid}>
              {PERIOD_OPTIONS.map((opt) => (
                <Chip
                  key={opt.key}
                  label={opt.label}
                  selected={selectedPeriod === opt.key}
                  onPress={() => setSelectedPeriod(opt.key === selectedPeriod ? null : opt.key)}
                />
              ))}
            </View>
          </View>

          <View style={styles.sectionDivider} />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>STATUS</Text>
            <View style={styles.chipRow}>
              {STATUS_OPTIONS.map((opt) => (
                <Chip
                  key={opt.key}
                  label={opt.label}
                  selected={selectedStatus === opt.key}
                  onPress={() => setSelectedStatus(opt.key === selectedStatus ? null : opt.key)}
                />
              ))}
            </View>
          </View>

          {tecnicos && tecnicos.length > 0 ? (
            <>
              <View style={styles.sectionDivider} />
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>TÉCNICO</Text>
                <View style={styles.chipRow}>
                  <Chip
                    label="Todos"
                    selected={!selectedTech}
                    onPress={() => setSelectedTech(null)}
                  />
                  {tecnicos.map((tec) => (
                    <Chip
                      key={tec.id}
                      label={tec.nome}
                      selected={selectedTech === tec.id}
                      onPress={() => setSelectedTech(tec.id)}
                    />
                  ))}
                </View>
              </View>
            </>
          ) : null}
        </ScrollView>

        <View style={styles.sheetFooter}>
          <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.8}>
            <Text style={styles.applyBtnText}>Aplicar filtros</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const getStyles = (colors) => StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: radii['2xl'],
    borderTopRightRadius: radii['2xl'],
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    alignSelf: 'center',
    marginTop: spacing.sm,
    opacity: 0.35,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.text,
  },
  headerDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xl,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  section: {
    paddingVertical: spacing.sm,
  },
  sectionLabel: {
    ...typography.overline,
    color: colors.textMuted,
    marginBottom: spacing.md,
    letterSpacing: 1.4,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  chipSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  chipLabelSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  sheetFooter: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  applyBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  applyBtnDisabled: {
    opacity: 0.5,
  },
  applyBtnText: {
    ...typography.subtitle,
    color: '#FFF',
    fontWeight: '700',
  },
});

