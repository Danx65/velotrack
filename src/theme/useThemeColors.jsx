import { useTheme } from './index';

export function useThemeColors() {
  const { colors, isDark } = useTheme();
  return { ...colors, isDark };
}

export default useThemeColors;