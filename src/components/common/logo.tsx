import React from 'react';
import { Image, ImageStyle, StyleProp, View, ViewStyle } from 'react-native';
import { useTheme, isDarkTheme } from '../../theme/tokens';

export type LogoVariant = 'adaptive' | 'app-icon' | 'mark' | 'white' | 'black' | 'dark' | 'light';

export interface LogoIconProps {
  size?: number;
  variant?: LogoVariant;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

const SOURCES: Record<string, any> = {
  'app-icon': require('../../../assets/icon.png'),
  'mark': require('../../../assets/logo-mark.png'),
  'white': require('../../../assets/logo-mark-white.png'),
  'black': require('../../../assets/logo-mark-black.png'),
  'dark': require('../../../assets/logo-mark-dark.png'),
  'light': require('../../../assets/logo-mark-light.png'),
};

/**
 * OmniWealth Asset Convergence Nexus Logo
 * Transparent and theme-adaptive by default to blend seamlessly into Liquid Glass UI.
 */
export const LogoIcon: React.FC<LogoIconProps> = ({
  size = 48,
  variant = 'adaptive',
  style,
  imageStyle,
}) => {
  const theme = useTheme();
  const isDark = isDarkTheme(theme);

  let resolvedSource: any;
  if (variant === 'adaptive') {
    resolvedSource = isDark ? SOURCES['dark'] : SOURCES['light'];
  } else {
    resolvedSource = SOURCES[variant] || (isDark ? SOURCES['dark'] : SOURCES['light']);
  }

  const isAppIcon = variant === 'app-icon';

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: isAppIcon ? size * 0.22 : 0,
          overflow: isAppIcon ? 'hidden' : 'visible',
          backgroundColor: 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Image
        source={resolvedSource}
        style={[{ width: size, height: size }, imageStyle]}
        resizeMode="contain"
      />
    </View>
  );
};

export default LogoIcon;
