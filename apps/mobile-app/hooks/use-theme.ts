import { useColorScheme } from 'react-native';

import { AppTheme, theme } from '@/theme/theme';

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = isDark ? theme.dark : theme.colors;

  return {
    isDark,
    colors,
    spacing: theme.spacing,
    textVariants: theme.textVariants,
    borderRadii: theme.borderRadii,
  };
};

export const getAppTheme = (isDark: boolean): Omit<AppTheme, 'dark'> => ({
  colors: isDark ? theme.dark : theme.colors,
  spacing: theme.spacing,
  textVariants: theme.textVariants,
  borderRadii: theme.borderRadii,
});
