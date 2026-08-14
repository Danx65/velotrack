import { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '../theme/colors';
import { useThemeColors } from '../theme/useThemeColors';

function PhotosSection({ photos, onAdd, uploading, canEdit }) {
  const colors = useThemeColors();
  const styles = getStyles(colors);

  if (!photos && !canEdit) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>FOTOS</Text>
      <View style={styles.grid}>
        {(photos || []).map((uri, i) => (
          <View key={i} style={styles.photoItem}>
            <Image source={{ uri }} style={styles.photoImage} />
          </View>
        ))}
        {canEdit && (
          <TouchableOpacity style={styles.addPhotoBtn} onPress={onAdd} disabled={uploading} activeOpacity={0.7}>
            {uploading ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <>
                <Ionicons name="camera-outline" size={24} color={colors.textMuted} />
                <Text style={styles.addPhotoText}>Adicionar</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default memo(PhotosSection);

const getStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 1.2, marginBottom: spacing.md, textTransform: 'uppercase',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoItem: {
    width: '30%', aspectRatio: 1, borderRadius: radii.md, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
  },
  photoImage: { width: '100%', height: '100%' },
  addPhotoBtn: {
    width: '30%', aspectRatio: 1, borderRadius: radii.md,
    borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', gap: 4,
  },
  addPhotoText: { fontSize: 9, color: colors.textMuted, fontWeight: '600' },
});

