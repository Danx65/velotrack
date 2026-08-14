import { useState, useEffect } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { radii } from '../theme/colors';
import { useThemeColors } from '../theme/useThemeColors';

export default function Timer({ startTime }) {
  const [elapsed, setElapsed] = useState('00:00:00');
  const colors = useThemeColors();
  const styles = getStyles(colors);

  useEffect(() => {
    if (!startTime) return;

    const start = new Date(startTime).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - start) / 1000));
      const h = String(Math.floor(diff / 3600)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      const s = String(diff % 60).padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <View style={styles.container}>
      <Text style={styles.time}>{elapsed}</Text>
      <Text style={styles.label}>TEMPO DE ATENDIMENTO</Text>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  time: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginTop: 4,
  },
});

