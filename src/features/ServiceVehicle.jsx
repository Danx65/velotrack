import { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { radii, spacing } from '../theme/colors';
import { useThemeColors } from '../theme/useThemeColors';

function ServiceVehicle({ service }) {
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const openMaps = (endereco) => {
    const q = encodeURIComponent(endereco);
    if (Platform.OS === 'web') window.open(`https://www.google.com/maps/search/${q}`, '_blank');
    else { Linking.openURL(`https://www.google.com/maps/search/${q}`); }
  };

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>VEÍCULO</Text>
        <View style={styles.vehicleRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="car-outline" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.vehicleMain}>{service.veiculo}</Text>
            <Text style={styles.vehicleSub}>{service.placa || 'Sem placa'} • {service.tipo}</Text>
          </View>
        </View>
      </View>

      {service.endereco ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>ENDEREÇO</Text>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.addressText}>{service.endereco}</Text>
          </View>
          <TouchableOpacity style={styles.mapsBtn} onPress={() => openMaps(service.endereco)} activeOpacity={0.7}>
            <Ionicons name="navigate-outline" size={14} color={colors.primary} />
            <Text style={styles.mapsBtnText}>Abrir no Google Maps</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </>
  );
}

export default memo(ServiceVehicle);

const getStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 1.2, marginBottom: spacing.md, textTransform: 'uppercase',
  },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: {
    width: 40, height: 40, borderRadius: radii.md,
    backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center',
  },
  vehicleMain: { fontSize: 15, fontWeight: '700', color: colors.text },
  vehicleSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: spacing.md },
  addressText: { fontSize: 13, color: colors.textSecondary, flex: 1, lineHeight: 19 },
  mapsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primarySoft, padding: 10, borderRadius: radii.md,
    alignSelf: 'flex-start',
  },
  mapsBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary },
});

