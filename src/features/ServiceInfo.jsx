import { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '../theme/colors';
import { useThemeColors } from '../theme/useThemeColors';
import { StatusBadge, PriorityBadge } from '../ui/Badge';

function ServiceInfo({ service }) {
  const colors = useThemeColors();
  const styles = getStyles(colors);

  return (
    <View style={styles.headerCard}>
      <View style={styles.headerRow}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>
            {service.cliente?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '--'}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{service.cliente}</Text>
          <Text style={styles.headerType}>{service.tipo}</Text>
        </View>
        <PriorityBadge priority={service.priority} size="lg" />
      </View>
      <View style={styles.badges}>
        <StatusBadge status={service.status} size="lg" />
      </View>
    </View>
  );
}

export default memo(ServiceInfo);

const getStyles = (colors) => StyleSheet.create({
  headerCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarLarge: {
    width: 46, height: 46, borderRadius: radii.lg,
    backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '800', color: colors.primary },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 19, fontWeight: '800', color: colors.text },
  headerType: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  badges: { flexDirection: 'row', marginTop: spacing.md, gap: 8 },
});

