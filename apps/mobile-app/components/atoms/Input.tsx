import React from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

interface InputProps extends TextInputProps {
  hasError?: boolean;
}

export const Input: React.FC<InputProps> = ({ style, hasError, ...rest }) => {
  const { colors, spacing, borderRadii, textVariants } = useTheme();

  const inputStyles = [
    styles.base,
    {
      borderColor: hasError ? colors.destructive : colors.border,
      color: colors.text,
      padding: spacing.s,
      borderRadius: borderRadii.radius,
      fontSize: textVariants.body.fontSize,
    },
    style,
  ];

  return (
    <TextInput
      style={inputStyles}
      placeholderTextColor={colors.mutedForeground}
      {...rest}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    width: '100%',
  },
});
