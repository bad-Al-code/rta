import { useTheme } from '@/hooks/use-theme';
import { AppColors, AppDarkColors, AppSpacing } from '@/theme/theme';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
} from 'react-native';

import { Text } from './Text';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'ghost';
type ButtonSize = 'xs' | 's' | 'm' | 'l';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  spacing?: AppSpacing;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'm',
  isLoading = false,
  disabled,
  ...rest
}) => {
  const { colors, spacing, borderRadii } = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'destructive':
        return colors.destructive;
      case 'outline':
      case 'ghost':
        return 'transparent';
      default:
        return colors.primary;
    }
  };

  const getTextColor = (): AppColors | AppDarkColors => {
    switch (variant) {
      case 'primary':
        return 'primaryForeground';
      case 'secondary':
        return 'secondaryForeground';
      case 'destructive':
        return 'destructiveForeground';
      case 'outline':
        return 'foreground';
      case 'ghost':
        return 'foreground';
      default:
        return 'primaryForeground';
    }
  };

  const buttonStyles = [
    styles.base,
    {
      backgroundColor: getBackgroundColor(),
      padding: spacing[size],
      borderRadius: borderRadii.radius,
    },
    variant === 'outline' && {
      borderColor: colors.border,
      borderWidth: 1,
    },
    (disabled || isLoading) && styles.disabled,
  ];

  return (
    <Pressable style={buttonStyles} disabled={disabled || isLoading} {...rest}>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors[getTextColor()]} />
      ) : (
        <Text variant="body" color={getTextColor()}>
          {title}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
