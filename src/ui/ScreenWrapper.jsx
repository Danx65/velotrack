import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { useThemeColors } from '../theme/useThemeColors';
import { useSegments } from 'expo-router';

export default function ScreenWrapper({ children }) {
  const { width } = useWindowDimensions();
  const segments = useSegments();
  const isWeb = Platform.OS === 'web';
  
  // Exclude login screen from being restricted inside a maximum center box bounds
  const isLoginScreen = segments.length === 0 || segments[0] === undefined || segments[0] === '' || segments[0] === 'index';
  const isDesktop = isWeb && width > 768 && !isLoginScreen;
  const colors = useThemeColors();

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={[
        styles.inner,
        { backgroundColor: colors.bg },
        isDesktop ? styles.innerWide : { paddingBottom: isWeb ? 0 : 56 }
      ]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: Platform.OS === 'web' ? '100vh' : '100%',
  },
  inner: {
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: Platform.OS === 'web' ? '100vh' : '100%',
    maxWidth: '100%',
    alignSelf: 'center',
  },
  innerWide: {
    maxWidth: '100%',
    width: '100%',
    height: '100%',
    minHeight: Platform.OS === 'web' ? '100vh' : '100%',
    alignSelf: 'stretch',
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
});

