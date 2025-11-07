import React from 'react';
import { View, ViewProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { AppColors, AppSpacing } from '@/theme/theme';

type SpacingProps =
  | 'margin'
  | 'marginTop'
  | 'marginRight'
  | 'marginBottom'
  | 'marginLeft'
  | 'marginHorizontal'
  | 'marginVertical'
  | 'padding'
  | 'paddingTop'
  | 'paddingRight'
  | 'paddingBottom'
  | 'paddingLeft'
  | 'paddingHorizontal'
  | 'paddingVertical';

type BoxSpacingProps = {
  [key in SpacingProps]?: AppSpacing;
};

type BoxProps = ViewProps &
  BoxSpacingProps & {
    backgroundColor?: AppColors;
  };

export const Box: React.FC<BoxProps> = ({ backgroundColor, ...rest }) => {
  const { spacing, colors } = useTheme();
  const style: ViewProps['style'] = {};

  for (const key in rest) {
    if (key.startsWith('margin') || key.startsWith('padding')) {
      const typedKey = key as SpacingProps;
      const value = rest[typedKey as keyof typeof rest] as AppSpacing;
      if (value) {
        style[typedKey] = spacing[value];
      }
    }
  }

  if (backgroundColor) {
    style.backgroundColor = colors[backgroundColor]; // Use colors from hook
  }

  return <View style={[style, rest.style]} {...rest} />;
};
