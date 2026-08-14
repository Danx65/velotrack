import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { ThemeProvider, useThemeColors, useTheme } from '../src/theme';
import ScreenWrapper from '../src/ui/ScreenWrapper';

if (Platform.OS !== 'web') {
  try {
    SplashScreen.preventAutoHideAsync();
  } catch {}
}

function RootLayoutNav() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const colors = useThemeColors();
  const { isDark } = useTheme();

  useEffect(() => {
    if (loading) return;

    if (Platform.OS !== 'web') {
      try { SplashScreen.hideAsync(); } catch {}
    }

    const inAdmin = segments[0] === '(admin)';
    const inTecnico = segments[0] === '(tecnico)';

    const rawRole = (profile?.role || user?.user_metadata?.role || 'tecnico').toLowerCase();
    const isAdmin = rawRole === 'admin' || rawRole === 'administrador';
    const isTecnico = rawRole === 'tecnico' || rawRole === 'technician';

    if (!user) {
      if (inAdmin || inTecnico) router.replace('/');
    } else if (isAdmin) {
      if (!inAdmin) router.replace('/(admin)');
    } else if (isTecnico) {
      if (!inTecnico) router.replace('/(tecnico)');
    } else {
      if (inAdmin || inTecnico) router.replace('/');
    }
  }, [user, profile, loading, segments, router]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg || '#07080D' }]}>
        <ActivityIndicator size="large" color={colors.primary || '#E60050'} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, width: '100%', height: '100%', minHeight: Platform.OS === 'web' ? '100vh' : '100%', backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScreenWrapper>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: Platform.OS === 'web' ? 'none' : 'fade' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(admin)" />
          <Stack.Screen name="(tecnico)" />
        </Stack>
      </ScreenWrapper>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider style={{ flex: 1, width: '100%', height: '100%', minHeight: Platform.OS === 'web' ? '100vh' : '100%', backgroundColor: '#07080D' }}>
      <ThemeProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: Platform.OS === 'web' ? '100vh' : '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#07080D',
  },
});

