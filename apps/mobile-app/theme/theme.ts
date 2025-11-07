import { TextStyle, ViewStyle } from 'react-native';

export const theme = {
  colors: {
    background: '#FFFFFF',
    foreground: '#0A0A0A',
    card: '#FFFFFF',
    cardForeground: '#0A0A0A',
    popover: '#FFFFFF',
    popoverForeground: '#0A0A0A',
    primary: '#1A1A1A',
    primaryForeground: '#FAFAFA',
    secondary: '#F5F5F5',
    secondaryForeground: '#1A1A1A',
    muted: '#F5F5F5',
    mutedForeground: '#737373',
    accent: '#F5F5F5',
    accentForeground: '#1A1A1A',
    destructive: '#EF4444',
    destructiveForeground: '#FAFAFA',
    border: '#E5E5E5',
    input: '#E5E5E5',
    ring: '#A3A3A3',
    // Chart colors
    chart1: '#F59E0B',
    chart2: '#3B82F6',
    chart3: '#1E40AF',
    chart4: '#FACC15',
    chart5: '#EAB308',
    // Sidebar colors
    sidebar: '#FAFAFA',
    sidebarForeground: '#0A0A0A',
    sidebarPrimary: '#1A1A1A',
    sidebarPrimaryForeground: '#FAFAFA',
    sidebarAccent: '#F5F5F5',
    sidebarAccentForeground: '#1A1A1A',
    sidebarBorder: '#E5E5E5',
    sidebarRing: '#A3A3A3',
  },

  dark: {
    background: '#0A0A0A',
    foreground: '#FAFAFA',
    card: '#1A1A1A',
    cardForeground: '#FAFAFA',
    popover: '#262626',
    popoverForeground: '#FAFAFA',
    primary: '#E5E5E5',
    primaryForeground: '#1A1A1A',
    secondary: '#262626',
    secondaryForeground: '#FAFAFA',
    muted: '#262626',
    mutedForeground: '#A3A3A3',
    accent: '#404040',
    accentForeground: '#FAFAFA',
    destructive: '#F87171',
    destructiveForeground: '#FAFAFA',
    border: 'rgba(255, 255, 255, 0.1)',
    input: 'rgba(255, 255, 255, 0.15)',
    ring: '#737373',
    // Chart colors
    chart1: '#8B5CF6',
    chart2: '#10B981',
    chart3: '#EAB308',
    chart4: '#A855F7',
    chart5: '#EF4444',
    // Sidebar colors
    sidebar: '#1A1A1A',
    sidebarForeground: '#FAFAFA',
    sidebarPrimary: '#8B5CF6',
    sidebarPrimaryForeground: '#FAFAFA',
    sidebarAccent: '#262626',
    sidebarAccentForeground: '#FAFAFA',
    sidebarBorder: 'rgba(255, 255, 255, 0.1)',
    sidebarRing: '#525252',
  },
  // Typography following shadcn's scale
  fonts: {
    geist: 'Geist',
    geistMono: 'GeistMono',
  },
  fontSizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeights: {
    normal: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semibold: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
  },
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    '2xl': 40,
  },

  textVariants: {
    h1: {
      fontFamily: 'Geist',
      fontSize: 36,
      fontWeight: '700' as TextStyle['fontWeight'],
      lineHeight: 45,
      letterSpacing: -0.5,
      color: 'foreground',
    },
    h2: {
      fontFamily: 'Geist',
      fontSize: 30,
      fontWeight: '600' as TextStyle['fontWeight'],
      lineHeight: 38,
      letterSpacing: -0.5,
      color: 'foreground',
    },
    h3: {
      fontFamily: 'Geist',
      fontSize: 24,
      fontWeight: '600' as TextStyle['fontWeight'],
      lineHeight: 32,
      letterSpacing: -0.25,
      color: 'foreground',
    },
    h4: {
      fontFamily: 'Geist',
      fontSize: 20,
      fontWeight: '600' as TextStyle['fontWeight'],
      lineHeight: 28,
      color: 'foreground',
    },

    p: {
      fontFamily: 'Geist',
      fontSize: 16,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 24,
      color: 'foreground',
    },
    large: {
      fontFamily: 'Geist',
      fontSize: 18,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 28,
      color: 'foreground',
    },
    small: {
      fontFamily: 'Geist',
      fontSize: 14,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 20,
      color: 'foreground',
    },
    muted: {
      fontFamily: 'Geist',
      fontSize: 14,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 20,
      color: 'mutedForeground',
    },

    lead: {
      fontFamily: 'Geist',
      fontSize: 20,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 32,
      color: 'mutedForeground',
    },
    blockquote: {
      fontFamily: 'Geist',
      fontSize: 16,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 24,
      fontStyle: 'italic' as TextStyle['fontStyle'],
      color: 'foreground',
    },
    code: {
      fontFamily: 'GeistMono',
      fontSize: 14,
      fontWeight: '400' as TextStyle['fontWeight'],
      color: 'foreground',
    },

    defaults: {
      fontFamily: 'Geist',
      fontSize: 16,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 24,
      color: 'foreground',
    },
    title: {
      fontFamily: 'Geist',
      fontSize: 30,
      fontWeight: '600' as TextStyle['fontWeight'],
      lineHeight: 38,
      letterSpacing: -0.5,
      color: 'foreground',
    },
    subtitle: {
      fontFamily: 'Geist',
      fontSize: 20,
      fontWeight: '600' as TextStyle['fontWeight'],
      lineHeight: 28,
      color: 'foreground',
    },
    body: {
      fontFamily: 'Geist',
      fontSize: 16,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 24,
      color: 'foreground',
    },
    caption: {
      fontFamily: 'Geist',
      fontSize: 12,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 16,
      color: 'mutedForeground',
    },
  },
  borderRadii: {
    none: 0,
    sm: 2,
    base: 4,
    md: 6,
    lg: 8,
    xl: 12,
    '2xl': 16,
    full: 9999,
    radius: 8,
  },
};

export type AppTheme = typeof theme;
export type AppColors = keyof AppTheme['colors'];
export type AppDarkColors = keyof AppTheme['dark'];
export type AppSpacing = keyof AppTheme['spacing'];
export type AppTextVariants = keyof AppTheme['textVariants'];
export type AppBorderRadii = keyof AppTheme['borderRadii'];

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle };

export const createStyleSheet = <T extends NamedStyles<T>>(styles: T) => styles;

export const getColor = (
  colorKey: AppColors | AppDarkColors,
  isDark: boolean = false
): string => {
  if (isDark && colorKey in theme.dark) {
    return theme.dark[colorKey as AppDarkColors];
  }
  return theme.colors[colorKey as AppColors];
};
