import React from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleSheet,
  TextStyle,
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { AppColors, AppDarkColors, AppTextVariants } from '@/theme/theme';

type TextProps = RNTextProps & {
  variant?: AppTextVariants;
  color?: AppColors | AppDarkColors;
};

export const Text: React.FC<TextProps> = ({
  variant = 'defaults',
  color,
  style,
  ...rest
}) => {
  const { textVariants, colors } = useTheme();

  const variantStyle = textVariants[variant] as TextStyle;

  const textColorName = color || (variantStyle.color as AppColors);
  const textColor = colors[textColorName];

  return (
    <RNText
      style={[
        styles.base,
        variantStyle,
        {
          color: textColor,
        },
        style,
      ]}
      {...rest}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    textAlignVertical: 'center',
  },
});
