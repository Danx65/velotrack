import { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '../theme/colors';
import { useThemeColors } from '../theme/useThemeColors';

function Checklist({ checklist, onToggle, canEdit }) {
  const colors = useThemeColors();
  const styles = getStyles(colors);

  if (!checklist || checklist.length === 0) return null;

  const checked = checklist.filter(c => c.checked).length;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.sectionLabel}>CHECKLIST</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{checked}/{checklist.length}</Text>
        </View>
      </View>
      {checklist.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.checkItem}
          onPress={() => canEdit && onToggle(index)}
          activeOpacity={canEdit ? 0.7 : 1}
        >
          <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
            {item.checked && <Ionicons name="checkmark" size={12} color="#FFF" />}
          </View>
          <Text style={[styles.checkLabel, item.checked && styles.checkLabelDone]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default memo(Checklist);

const getStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  head: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 1.2, textTransform: 'uppercase',
  },
  countBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5,
  },
  countText: { fontSize: 10, fontWeight: '700', color: colors.primary },
  checkItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: colors.textMuted, justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: colors.success, borderColor: colors.success },
  checkLabel: { fontSize: 13, color: colors.text, flex: 1 },
  checkLabelDone: { textDecorationLine: 'line-through', color: colors.textMuted },
});

